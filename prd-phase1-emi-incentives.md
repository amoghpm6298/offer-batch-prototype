# PRD: Phase-1 — Incentive Automation for EMI Journeys

## 1. Overview

### 1.1 Background
Banks periodically run special offers on EMI journeys — reduced ROI (Rate of Interest), reduced Processing Fee, or both — targeting eligible customers within a defined duration. These offers are designed to improve conversion rates on EMI journeys, directly impacting revenue.

### 1.2 Current Workflow (Manual)
1. Bank communicates eligibility logic to filter customers from an existing base batch.
2. Data team manually runs a query and generates an allocation file with override ROI/PF values.
3. Ops team uploads the file and creates a new batch.
4. Unique links are generated with override values.
5. Nudges are sent; customers open links and see offer values.

**Problems:**

| # | Problem | Impact |
|---|---------|--------|
| 1 | Manual file generation leads to human error | Incorrect offer values reaching customers |
| 2 | Team bandwidth consumed by repetitive workflow | Ops & Data team capacity wasted |
| 3 | No correlation between offer batch and base batch | Difficult to track offer performance against the original cohort |

### 1.3 Goal
Automate incentive creation for EMI journeys — admin self-serve with full control over eligibility and outcomes, real-time evaluation, and end-to-end traceability to the base batch.

---

## 2. Pre-Requisites

| # | Requirement | Current State | Required State |
|---|-------------|---------------|----------------|
| 1 | Propensity score availability | Warehouse only | Application DB |
| 2 | Decile availability | Warehouse only | Application DB |
| 3 | EMI Config ID mapping | Manual | System-resolved (current config → override config for ROI/PF changes) |
| 4 | Journey variant config | Does not exist | New `variables` and `frontendSupported` fields on journey variant entity |

Items 1–3 are **hard blockers** — the system cannot evaluate eligibility or resolve outcomes without them.

---

## 3. Constraints

- **Duration bound to base batch:** Incentive start and end dates must fall within the parent base batch's duration. Hard enforcement at creation time.
- **Multiple active incentives:** Multiple incentives can be active simultaneously under a base batch. They are mutually inclusive — a customer can qualify for any combination.
- **EMI outcomes only (phase-1):** Only ROI and Processing Fee outcome types are available.

---

## 4. Journey Variant Configuration

Each journey variant declares which data variables are applicable and which are rendered on its frontend. Both fields live on the journey variant (not journey type) because a "Custom" journey type can have variants with completely different variable sets.

| Field | Type | Purpose |
|---|---|---|
| `variables` | `string[]` | Applicable data variables for this variant. Controls what eligibility filters and outcome types appear in the create incentive form. |
| `frontendSupported` | `string[]` | Subset of `variables` that the variant's frontend actually renders to customers. |

`frontendSupported` is always a subset of `variables`.

### Example

```
Journey Variant: "CLI - Dark Theme" (Issuer 1)
  journeyType: "Credit Limit Increase"
  variables: [roi, pf, decile, propensity]
  frontendSupported: [roi, pf]

Journey Variant: "CLI - Issuer 2 Theme"
  journeyType: "Credit Limit Increase"
  variables: [roi, decile, propensity]
  frontendSupported: [roi]
```

### Phase-1 Behavior
- **Create form filtering:** Eligibility filters and outcome types are filtered based on `variables`. If `pf` is not in a variant's `variables`, the Processing Fee outcome type does not appear in the form.
- **`frontendSupported` stored as metadata:** Not enforced in admin UI in phase-1. No soft warning shown. Available for frontend teams to reference.
- **Phase-2:** Admin UI will show a soft warning when the selected outcome type is in `variables` but not in `frontendSupported`.

---

## 5. Incentive Structure

Each incentive is a standalone entity under a base batch with its own basic details, eligibility criteria, and exactly one outcome.

```
Base Batch
 └── Incentives (1..N, mutually inclusive)
      ├── Basic Details (title, description, duration)
      ├── Eligibility Criteria (AND-joined filters)
      └── Outcome (exactly one)
```

---

## 6. Feature Specification

### 6.1 Create Incentive — 3-Step Wizard

#### Step 1: Basic Details

| Field | Type | Validation |
|-------|------|------------|
| Title | Text input | Required, max 100 chars |
| Description | Textarea | Optional, max 500 chars |
| Start Date & Time | Datetime picker | Required. Must be within base batch duration. |
| End Date & Time | Datetime picker | Required. Must be within base batch duration. Must be after start date. |

Duration constraint is hard-enforced with inline error: _"Incentive duration must be within the base batch duration ({base_start} to {base_end})."_

#### Step 2: Eligibility & Outcome

##### A. Eligibility Criteria

All selected criteria are AND-joined. Criteria are added via pill-shaped buttons and rendered as a flat list with AND separators.

| Criterion | Input Type | Operators | Notes |
|-----------|-----------|-----------|-------|
| Journey Status | Toggle buttons (multi-select) | NOT_STARTED, IN_PROGRESS | Optional. Select one or both. |
| Smart Tags | Searchable multi-select dropdown | — (inclusion-based) | Optional. Select from catalog. Each tag shows user count. |
| Propensity | Operator dropdown + numeric input(s) | RANGE, GT, GTE, LT, LTE, E | Optional. RANGE shows min/max; others show single value. |
| Decile | Operator dropdown + numeric input(s) | RANGE, GT, GTE, LT, LTE, E | Optional. Same behavior as Propensity. |
| Current ROI | Operator dropdown + numeric input | GT (default), GTE, LT, LTE, E | Optional. Single value with % suffix. |

**Criteria visibility** is controlled by the journey variant's `variables` field — only applicable criteria are shown.

##### B. Outcome Definition

Each incentive has exactly one outcome. Admin selects the outcome type, then configures it.

| Outcome Type | Sub-types | Input |
|-------------|-----------|-------|
| ROI | **Relative**: Current ROI - x % | Numeric input for x |
| | **Absolute**: Set ROI = x % | Numeric input for x |
| Processing Fee | **Flat**: Set PF = Rs x | Numeric input for x |
| | **Relative**: Current PF - Rs x | Numeric input for x |

Sub-type selection is rendered as toggle buttons (e.g., "Relative" / "Absolute"). First sub-type is selected by default.

**Outcome type visibility** is controlled by the journey variant's `variables` field — only applicable outcome types are shown.

#### Step 3: Review & Submit

Read-only summary of all configured details:
1. **Basic Details**: Title, description, start date, end date
2. **Eligibility & Outcome**: Criteria summary (AND-joined) + outcome summary (type, sub-type, value)

"Create Incentive" button submits, shows success toast, and navigates back to base batch view.

#### Stepper Navigation

| Behavior | Description |
|----------|-------------|
| Forward | Requires current step validation to pass |
| Backward | Always allowed via "Back" button or clicking completed step |
| Completed steps | Green check mark, clickable |
| Current step | Filled circle with step number |
| Future steps | Grayed out, not clickable |

---

### 6.2 Incentive Evaluation — Real-time

The system must ensure that eligible customers receive the assigned outcome. The evaluation approach (real-time API, batch, or hybrid) is an engineering decision. The contract is:

1. When a customer enters the journey, the system checks all active incentives for that base batch.
2. If the customer matches an incentive's eligibility criteria, the configured outcome is applied.
3. Multiple incentives are mutually inclusive — a customer can qualify for more than one.
4. If a customer qualifies for none, they proceed with default journey values.

### 6.3 Validation at Evaluation Time

| Rule | Description |
|------|-------------|
| Override ROI > 0% | Computed offer ROI must not go negative. If it would, exclude customer from this incentive and log for admin review. |
| Override PF >= 0 | Computed PF must not go negative. Same handling. |

---

### 6.4 Incentive Lifecycle

```
SCHEDULED ──→ ACTIVE ──→ EXPIRED
    │            │
    └────────────┴──→ DISABLED
```

| Status | Trigger | Description |
|--------|---------|-------------|
| SCHEDULED | Admin creates incentive | Awaiting start time. Fully editable. |
| ACTIVE | Start datetime reached | Live. Eligible customers entering the journey receive the outcome. |
| EXPIRED | End datetime reached | Duration ended. Read-only. |
| DISABLED | Admin disables (irreversible) | Manually stopped. No future customers receive the outcome. Can be triggered from SCHEDULED or ACTIVE. |

- SCHEDULED → ACTIVE and ACTIVE → EXPIRED transitions are automated based on datetime.
- DISABLED is triggered by admin action and is **irreversible** — once disabled, the incentive cannot be re-enabled.
- Disabling an EXPIRED incentive is not allowed (no operational effect).

---

## 7. Admin Views

### 7.1 Incentive List View (within Base Batch)

Displayed in the base batch detail page under the Overview tab.

| Column | Description |
|--------|-------------|
| Incentive Title | Clickable, navigates to detail page |
| Status | SCHEDULED / ACTIVE / EXPIRED / DISABLED |
| Duration | Start date – End date |
| Eligible Customers | Count of matched customers |
| Outcome | Chip showing outcome type label |
| Created By | Admin who created the incentive |

Empty state: "No incentives yet" with a CTA to create the first one.

### 7.2 Incentive Detail View

Single scrollable page. Header shows incentive title, status badge, and enable/disable toggle. No tabs, no 3-dot menu.

**Basic Details** (with inline edit)

| Field | Description |
|-------|-------------|
| Incentive ID | System-generated (with copy button) |
| Title | Name of the incentive |
| Start Date | When the incentive becomes active |
| End Date | When the incentive expires |
| Eligible Customers | Count of matched customers |

Inline edit mode: pencil icon switches to editable form.

| Field | SCHEDULED | ACTIVE | EXPIRED | DISABLED |
|-------|-----------|--------|---------|----------|
| Title | Editable | Editable | Editable | Hidden (edit button not shown) |
| Description | Editable | Editable | Editable | Hidden |
| Start Date | Editable | Locked | Locked | Hidden |
| End Date | Editable | Editable | Editable | Hidden |

**Eligibility Criteria** — summary card with AND separators between filters.

**Outcome** — summary card showing type, sub-type, and value.

**Audit Info**

| Field | Description |
|-------|-------------|
| Created By | Admin who created the incentive |
| Created On | Timestamp of creation |
| Last Updated By | Admin who last modified the incentive |
| Last Updated On | Timestamp of last modification |

**Analytics** — top-level metric cards:

| Metric | Description |
|--------|-------------|
| Final Batch Data | Total eligible customers |
| Conversions | Customers who completed the journey |
| Conversion Rate | Conversions / Eligible (%) |
| Days to Journey End | Remaining days until incentive expires |

**Overall Funnel** — bar chart tracking conversion across stages:

| Stage | Description |
|-------|-------------|
| Total Customers | All eligible customers in the incentive |
| Visited Landing Page | Customers who opened the unique link |
| Completed Journey | Customers who finished the conversion flow |
| Attempted OTP Verification | Customers who reached the OTP step |

### 7.3 Irreversible Disable

- Toggle in incentive detail header.
- Clicking opens confirmation modal:
  - Title: "Disable Incentive?"
  - Warning: _"This action is **irreversible**. Once disabled, this incentive cannot be enabled again. Disabling will stop this incentive from being applied to any future eligible customers."_
  - Rationale: _"Re-enabling is not supported because backtracing previously applied incentives would be operationally complex and error-prone."_
  - Actions: "Cancel" / "Disable Permanently"
- Disabled state: overview grayed out (50% opacity), label shows "Disabled" in red, toggle non-interactive.

---

## 8. Form Validation Summary

| # | Rule | Step | Error |
|---|------|------|-------|
| 1 | Title is required | Step 1 | Inline error, block forward |
| 2 | Title max 100 characters | Step 1 | Inline error |
| 3 | Start date is required | Step 1 | Inline error |
| 4 | End date is required | Step 1 | Inline error |
| 5 | End date must be after start date | Step 1 | Inline error |
| 6 | Duration must be within base batch bounds | Step 1 | Inline error |
| 7 | Outcome type is required | Step 2 | Inline error |
| 8 | Outcome sub-type is required (ROI/PF) | Step 2 | Inline error |
| 9 | Outcome value is required | Step 2 | Inline error |

---

## 9. Edge Cases

| Scenario | Handling |
|----------|----------|
| No customers match eligibility | Incentive moves to ACTIVE with 0 eligible. Admin notified. |
| Base batch deactivated while incentive is SCHEDULED | Incentive auto-transitions to DISABLED. |
| Customer data (propensity/decile) missing in DB | Customer excluded from eligibility. Logged for review. |
| Computed ROI goes negative | Customer excluded from incentive. Logged. |
| Computed PF goes negative | Customer excluded from incentive. Logged. |
| Admin disables SCHEDULED incentive | Allowed. Incentive never activates. |
| Admin disables ACTIVE incentive | Allowed. No future customers receive outcome. Already-applied outcomes are not reverted. |
| Admin tries to disable EXPIRED incentive | Not allowed. No operational effect. |

---

## 10. Current Requirement Mapping

The current bank logic maps to phase-1 as follows:

| Current Manual Logic | Phase-1 Configuration |
|---------------------|----------------------|
| Propensity 1–5 customers get ROI - 1%, if ROI > 12% | **Incentive 1:** Eligibility: Propensity RANGE 1–5, Current ROI GT 12. Outcome: ROI Relative = Current ROI - 1% |
| Decile 0–2 customers get PF = Rs 0 | **Incentive 2:** Eligibility: Decile RANGE 0–2. Outcome: Processing Fee Flat = Rs 0 |
| Both conditions are mutually inclusive | Both incentives exist independently; customer can qualify for either or both |

---

## 11. Success Metrics

| Metric | Target |
|--------|--------|
| Manual file generation eliminated | 100% for EMI journeys |
| Incentive creation errors | < 1% (vs manual error rate) |
| Time from bank instruction to offer live | Admin self-serve, no data team dependency |
| Offer-to-base batch traceability | 100% — every incentive linked to parent |
| Conversion rate visibility | Per-incentive analytics available |

---

## Appendix A: Outcome Type Reference (Phase-1)

| Key | Label | Sub-types | Input |
|-----|-------|-----------|-------|
| `roi` | ROI | `relative` (Current ROI - x%), `absolute` (Set ROI = x%) | Numeric |
| `pf` | Processing Fee | `flat` (Rs x), `relative` (Current PF - Rs x) | Numeric |

## Appendix B: Eligibility Criteria Reference (Phase-1)

| Key | Label | Input Type | Operators |
|-----|-------|-----------|-----------|
| `journeyStatus` | Journey Status | Toggle buttons | NOT_STARTED, IN_PROGRESS |
| `smartTags` | Smart Tags | Searchable multi-select | — (inclusion-based) |
| `propensity` | Propensity | Operator dropdown + numeric | RANGE, GT, GTE, LT, LTE, E |
| `decile` | Decile | Operator dropdown + numeric | RANGE, GT, GTE, LT, LTE, E |
| `currentRoi` | Current ROI | Operator dropdown + numeric | GT, GTE, LT, LTE, E |

---

## Future Scope

The following items are planned for subsequent phases, building on the phase-1 foundation.

| Feature | Description | Phase |
|---------|-------------|-------|
| **Processing Charge outcome** | Flat and Relative sub-types for Plan Change journeys | Phase-2 |
| **Merchant Offer outcome** | Multi-select from merchant offer catalog, applicable across all journey types | Phase-2 |
| **Event Rules (behavioral targeting)** | Eligibility filter based on user events — event type, target, frequency, time window. E.g., "clicked Apply Now >= 2 times within last 7 days" | Phase-2 |
| **Frontend compatibility warning** | Soft warning in admin UI when selected outcome type is in `variables` but not in `frontendSupported` for the journey variant | Phase-2 |
| **Cancel incentive action** | Allow admin to cancel a SCHEDULED incentive before it activates (distinct from disable) | Phase-2 |
| **Non-EMI journey support** | Extend incentive automation to Plan Change, RBI Consent, Custom, and other journey types | Phase-2+ |
| **Incentive cloning** | Duplicate an existing incentive with pre-filled values for quick creation | Phase-2 |
| **Bulk incentive operations** | Enable/disable multiple incentives at once from the list view | Phase-3 |
| **A/B testing** | Split eligible customers into control/treatment groups to measure incentive effectiveness | Phase-3 |
| **Incentive budget caps** | Set a maximum number of customers or total cost for an incentive, auto-disable when reached | Phase-3 |
| **Approval workflow** | Require manager approval before a SCHEDULED incentive can activate | Phase-3 |
