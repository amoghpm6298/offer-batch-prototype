# PRD: Incentive Automation for EMI Journeys

## 1. Overview

### 1.1 Background
Banks periodically run special offers on EMI journeys — reduced ROI (Rate of Interest), reduced Processing Fee, or both — targeting eligible customers within a defined duration. These offers are designed to improve conversion rates on EMI journeys, directly impacting revenue.

### 1.2 Current Workflow (Status Quo)
1. Bank communicates eligibility logic to filter customers from an existing base batch.
2. **Current shared logic example:**
   - Propensity 1–5 customers receive an offer ROI of `Current_ROI - 1`, provided `Current_ROI > 12`.
   - Decile 0–2 customers receive an offer PF of `0%`.
   - These two conditions are **mutually inclusive** (a customer can qualify for both).
3. Data team manually runs a query and generates an allocation file with updated ROI, PF, or override EMI Config IDs.
4. Ops team uploads the allocation file and creates a new batch.
5. Unique links are generated with override values.
6. Nudges are sent using this batch as the base.
7. Customers open links and see offer values.

### 1.3 Problem Statements
| # | Problem | Impact |
|---|---------|--------|
| 1 | Manual file generation leads to human error | Incorrect offer values reaching customers |
| 2 | Team bandwidth consumed by manual workflow | Ops & Data team capacity wasted on repetitive tasks |
| 3 | No correlation between offer batch and base batch | Difficult to track offer performance against the original cohort |

### 1.4 Goal
Automate incentive creation to minimize risk, errors, and human intervention — while maintaining full admin control over eligibility and outcome definitions.

---

## 2. Pre-Requisites

| # | Requirement | Current State | Required State |
|---|-------------|---------------|----------------|
| 1 | Propensity score availability | Warehouse only | Application DB |
| 2 | Decile availability | Warehouse only | Application DB |

These fields must be synced from the data warehouse into the application database before this feature can go live. Without them, the system cannot evaluate eligibility rules in real-time.

---

## 3. Constraints & Limitations

- **Duration bound to base batch:** Incentive start and end dates must fall within the bounds of the parent base batch's duration.
- **Multiple active incentives allowed:** Multiple incentives can be active simultaneously under a base batch. They are mutually inclusive — a customer can qualify for any combination of active incentives.

---

## 3.1 Journey Variant Compatibility

### Problem

Incentives are backend-configured, but their visibility depends on the journey frontend supporting that outcome type. Different issuers have different journey variants — issuer-1's variant might render Processing Fee on the frontend, but issuer-2's variant might not. If an admin creates a PF incentive for issuer-2, the incentive gets applied on the backend but the customer never sees it communicated — defeating the purpose of driving conversion through visible offers.

Additionally, journey variables (e.g., ROI, PF, Decile, Propensity) are not universal. A "Custom" journey type can have variants with completely different variable sets, so constraining variables at the journey type level doesn't work.

### Design

Both layers of compatibility are defined **per journey variant** (not per journey type):

| Layer | Field | Purpose | Effect on Create Form |
|---|---|---|---|
| **Variables** | `variables` | Data variables applicable to this variant (filters + outcomes) | Hard constraint — options not in `variables` are hidden entirely |
| **Frontend Support** | `frontendSupported` | Subset of `variables` that the variant's UI actually renders | Soft warning — option is visible but flagged with a warning |

`frontendSupported` is always a subset of `variables`. You can't display something on the frontend that isn't a variable for that variant.

### Example Configuration

```
Journey Variant: "CLI - Dark Theme"
  journeyType: "Credit Limit Increase"
  variables: [roi, pf, proc_charge, decile, propensity]
  frontendSupported: [roi, pf, merchant_offer]

Journey Variant: "CLI - Issuer 2"
  journeyType: "Credit Limit Increase"
  variables: [roi, proc_charge, decile, propensity]
  frontendSupported: [roi, merchant_offer]

Journey Variant: "Custom - Rewards Upgrade"
  journeyType: "Custom"
  variables: [merchant_offer, decile]
  frontendSupported: [merchant_offer]
```

### Behavior at Incentive Creation

1. **Fetch journey variant config** from the base batch's assigned variant.
2. **Filter the create form**: Only show eligibility filters and outcome types that exist in `variables`. If `pf` is not in `variables`, the Processing Fee outcome type and any PF-related filters don't appear.
3. **Warn on frontend gap**: If the admin selects an outcome type that is in `variables` but not in `frontendSupported`, show a soft warning:
   > _"This journey variant does not currently display {outcome type} offers. The incentive will be applied on the backend but won't be visible to customers on the frontend."_

Warning (not hard block) because:
- Journey frontends evolve — support may be added soon
- Some issuers may want silent backend benefits as a strategy
- Hard blocks create friction when ops teams know what they're doing

### Maintenance

When a frontend dev adds support for a new variable in a variant, they add it to `frontendSupported` — no journey type config change needed, no cross-variant impact.

---

## 4. Incentive Structure — Mindmap

This section provides a visual overview of the entire incentive creation model: first the **generic, extensible structure** (all possible configurations), then the **current requirement as a specific instantiation** of that structure.

### 4.1 Generic Structure (Full Configuration Model)

The system supports the following complete tree of configurable elements. Each incentive has its own basic details, eligibility criteria, and exactly **one outcome**.

```
Base Batch
 └── Incentives (1..N, mutually inclusive)
      │
      ├── Incentive 1
      │    ├── Basic Details
      │    │    ├── Title
      │    │    ├── Description
      │    │    └── Duration (configurable, bound to base batch)
      │    │
      │    ├── Eligibility Criteria (AND-joined)
      │    │    ├── Journey Status (toggle: NOT_STARTED, IN_PROGRESS)
      │    │    ├── Smart Tags (multi-select from catalog)
      │    │    ├── Propensity { RANGE(min,max) | GT | GTE | LT | LTE | E } x
      │    │    ├── Decile { RANGE(min,max) | GT | GTE | LT | LTE | E } x
      │    │    ├── Current ROI { GT | GTE | LT | LTE | E } x
      │    │    └── Event Rules (0..N)
      │    │         ├── Event Type + Event Target
      │    │         ├── Frequency (optional): { GTE | GT | LTE | LT | E } N times
      │    │         └── Time Window (optional): within last N { hours | days | weeks }
      │    │
      │    └── Outcome (exactly one, select type)
      │         ├── ROI (EMI)
      │         │    ├── Relative: Current ROI - x %
      │         │    └── Absolute: Set ROI = x %
      │         ├── Processing Fee (EMI)
      │         │    ├── Flat: Set PF = Rs x
      │         │    └── Relative: Current PF - Rs x
      │         ├── Processing Charge (Plan Change)
      │         │    ├── Flat: Set Charge = Rs x
      │         │    └── Relative: Current Charge - Rs x
      │         └── Merchant Offer (All Journeys)
      │              └── Select offers from catalog (multi-select)
      │
      ├── Incentive 2
      │    └── (same structure as above)
      │
      └── ... (additional incentives)
```

#### Key Design Notes

- **Each incentive has exactly 1 outcome.** To apply multiple incentive types (e.g., ROI reduction + PF waiver), create separate incentives.
- **Eligibility filters are AND-joined** within each incentive.
- **Incentives are independent and mutually inclusive** — a customer can qualify for one, many, or none.
- **Multiple incentives can be active simultaneously** under a base batch.
- **Propensity and Decile support the full operator set** (RANGE, GT, GTE, LT, LTE, E) — the system uses a unified numeric filter with an operator dropdown.
- **Event Rules** are an eligibility dimension for behavioral targeting (e.g., "clicked Apply Now >= 2 times within last 7 days").

### 4.2 Current Requirement — Instantiated from Generic Structure

The current bank requirement maps onto the generic model as follows:

```
Base Batch
 └── Incentives
      │
      ├── Incentive 1: "ROI Reduction"
      │    ├── Basic Details (title, description, duration)
      │    ├── Eligibility
      │    │    ├── Propensity RANGE between 1 & 5
      │    │    └── Current ROI GT 12
      │    └── Outcome
      │         └── ROI — Relative: Current ROI - 1%
      │
      └── Incentive 2: "PF Waiver"
           ├── Basic Details (title, description, duration)
           ├── Eligibility
           │    └── Decile RANGE between 0 & 2
           └── Outcome
                └── Processing Fee — Flat: Rs 0
```

### 4.3 Structure vs. Current Requirement — Mapping

| Generic Model Element | Available | Used in Current Req? | Current Value | Notes |
|---|---|---|---|---|
| **Basic Details** | | | | |
| Title | Yes | Yes | Admin-defined | Required |
| Description | Yes | Yes | Admin-defined | Optional |
| Duration | Yes | Yes | Admin-defined | Must fall within base batch bounds |
| **Incentive 1 — Eligibility** | | | | |
| Journey Status | Optional | No | — | Available but not used in this req |
| Smart Tags | Optional | No | — | Available for cohort-based targeting |
| Propensity | Optional | Yes | RANGE 1–5 | Unified numeric filter |
| Decile | Optional | No | — | Not used in ROI incentive |
| Current ROI | Optional | Yes | GT 12 | Greater-than operator |
| Event Rules | Optional | No | — | Available for behavioral targeting |
| **Incentive 1 — Outcome** | | | | |
| ROI — Relative | Selected | Yes | Current ROI - 1% | x = 1 |
| ROI — Absolute | Option | No | — | Relative used instead |
| **Incentive 2 — Eligibility** | | | | |
| Journey Status | Optional | No | — | Not used for PF incentive |
| Smart Tags | Optional | No | — | Not used for PF incentive |
| Propensity | Optional | No | — | Not used for PF incentive |
| Decile | Optional | Yes | RANGE 0–2 | Unified numeric filter |
| Current ROI | Optional | No | — | Not used for PF incentive |
| Event Rules | Optional | No | — | Not used for PF incentive |
| **Incentive 2 — Outcome** | | | | |
| Processing Fee — Flat | Selected | Yes | Rs 0 | Full PF waiver |
| Processing Fee — Relative | Option | No | — | Flat used instead |

### 4.4 Coverage Summary

- The generic structure exposes **6 eligibility filter types** (Journey Status, Smart Tags, Propensity, Decile, Current ROI, Event Rules) and **4 outcome types** with subtypes across 3 journey categories (EMI, Plan Change, All Journeys).
- The current requirement uses **2 of 6 filter types** (Propensity, Decile, Current ROI) and **2 of 4 outcome types** (ROI Relative, PF Flat).
- All unused fields remain available for future incentives **without any structural or code changes** — the model is already built to support them.

---

## 5. Feature Specification

### 5.1 Entry Point
A **"Create Incentive"** action is introduced in the existing Base Batch View screen. This opens a new page with a multi-step wizard.

### 5.2 Form Structure

The form is organized as a **3-step vertical stepper wizard**:

1. **Basic Details** — Title, description, and duration
2. **Eligibility & Outcome** — Eligibility criteria and a single outcome
3. **Review & Submit** — Read-only summary of all configured details

---

#### Step 1: Basic Details

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Title | Text input | Required, max 100 chars | Name of the incentive |
| Description | Textarea | Optional, max 500 chars | Purpose/context of the incentive |
| Duration (Start Date & Time) | Datetime picker | Required. Must be >= base batch start date | When the incentive becomes active |
| Duration (End Date & Time) | Datetime picker | Required. Must be <= base batch end date. Must be after start date. | When the incentive expires |

**Validation:** An info banner shows the base batch duration constraint. If the selected duration falls outside the base batch's start/end window, show an inline error: _"Incentive duration must be within the base batch duration ({base_start} to {base_end})."_

**Pre-fill:** The form is pre-filled with demo values for rapid prototyping (title, description, start/end dates).

---

#### Step 2: Eligibility & Outcome

Admin configures eligibility criteria and a single outcome for the incentive.

##### A. Eligibility Criteria

All selected criteria are evaluated with **AND logic**. Criteria are added via pill-shaped buttons ("+ Journey Status", "+ Smart Tags", "+ Propensity", etc.) and rendered as a flat list with AND separators between each filter block.

| Criterion | Input Type | Options / Format | Notes |
|-----------|-----------|-----------------|-------|
| Journey Status | Toggle buttons (multi-select) | `NOT_STARTED`, `IN_PROGRESS` | Optional. Select one or both. |
| Smart Tags | Searchable multi-select dropdown | Select from catalog of smart tags | Optional. Each tag shows user count. |
| Propensity | Operator dropdown + numeric input(s) | Operators: `RANGE (Between)`, `GT (>)`, `GTE (>=)`, `LT (<)`, `LTE (<=)`, `E (=)` | Optional. RANGE shows min/max inputs; others show single value input. |
| Decile | Operator dropdown + numeric input(s) | Same operator set as Propensity | Optional. Same input behavior as Propensity. |
| Current ROI | Operator dropdown + numeric input | Operators: `GT`, `GTE`, `LT`, `LTE`, `E` (default: GT). No RANGE option. | Optional. Single value input with `%` suffix. |
| Event Rule | Event type dropdown + Event target search | See Event Rule section below | Optional. Multiple event rules supported. |

**Event Rules:**

Each event rule consists of:
- **Event Type** (required): Click, Page View, Form Submit, CTA Tap, Scroll, Video Play
- **Event Target** (required): Searchable single-select from catalog (e.g., "Review Details", "Apply Now", "EMI Calculator")
- **Frequency** (optional): Operator (>=, >, <=, <, =) + value + "times" — e.g., ">= 2 times"
- **Time Window** (optional): "within last" + value + unit (hours / days / weeks) — e.g., "within last 7 days"

Frequency and Time Window are added via small toggle buttons within the event rule card and can be removed individually.

##### B. Outcome Definition

Each incentive has **exactly one outcome**. The admin selects the outcome type from a dropdown, then configures it:

| Outcome Type | Category Tag | Sub-types | Input |
|-------------|-------------|-----------|-------|
| ROI | EMI | **Relative**: Current ROI - x % | Numeric input for x |
| | | **Absolute**: Offer ROI = x % | Numeric input for x |
| Processing Fee | EMI | **Flat**: Offer PF = Rs x | Numeric input for x |
| | | **Relative**: Current PF - Rs x | Numeric input for x |
| Processing Charge | Plan Change | **Flat**: Offer Charge = Rs x | Numeric input for x |
| | | **Relative**: Current Charge - Rs x | Numeric input for x |
| Merchant Offer | All Journeys | — (no sub-type) | Searchable multi-select from merchant offer catalog |

**Sub-type selection** (for ROI, PF, Processing Charge): Rendered as toggle buttons (e.g., "Relative" / "Absolute"). The first sub-type is selected by default when the outcome type is chosen.

**Merchant Offer details:**
- Each offer shows name, merchant, and description
- Info banner: _"Selected offers will be displayed on the PWA with a disabled 'Reveal Promo Code' button. The button is enabled once the customer completes the journey."_

---

#### Step 3: Review & Submit

A read-only summary page showing:

1. **Basic Details**: Title, description, start date, end date
2. **Eligibility & Outcome**: Eligibility criteria (AND-joined, rendered as summary text) + outcome summary (type, sub-type, and value/selections)

A **"Create Incentive"** button submits the form, shows a success toast, and navigates back to the base batch view.

---

### 5.3 Stepper Navigation

| Behavior | Description |
|----------|-------------|
| Forward | Requires validation of current step to pass before advancing |
| Backward | Always allowed — click "Back" button or click a completed step number |
| Completed steps | Show green check mark, are clickable |
| Current step | Shows filled circle with step number |
| Future steps | Grayed out, not clickable |

---

### 5.4 Incentive Lifecycle

```
[Admin creates incentive]
        |
        v
   Status: SCHEDULED
        |
        v
[Start date/time reached]
        |
        v
   System auto-generates allocation file
   with override EMI configs for eligible customers
        |
        v
   Child batch is created under the base batch
   Unique links generated for eligible customers
        |
        v
   Status: ACTIVE
        |
        v
   Nudges sent using child batch as base
   Customers access offer via unique links
        |
        v
[End date/time reached]
        |
        v
   Status: EXPIRED
```

#### State Definitions

| Status | Description |
|--------|-------------|
| `SCHEDULED` | Incentive created, awaiting start time. Editable. |
| `ACTIVE` | Incentive is live. Allocation file generated, child batch created, links active. Not editable (except incentive disable). |
| `EXPIRED` | Incentive duration has ended. Read-only. |
| `CANCELLED` | Admin manually cancelled before activation. |

---

### 5.5 System Behavior at Incentive Start Time

When the scheduled start date/time is reached, the system must automatically:

1. **Query eligible customers** from the base batch by applying the defined eligibility criteria against application DB records.
2. **Compute override values** for each eligible customer based on the incentive's outcome.
3. **Resolve override EMI config IDs** for customers with ROI or PF overrides.
4. **Generate the allocation file** in the standard format.
5. **Create a child batch** linked to the base batch.
6. **Generate unique links** for each customer in the child batch.
7. **Mark the incentive as ACTIVE.**

If the system encounters errors, the incentive should move to an `ERROR` state with details logged for admin review.

---

### 5.6 Batch Relationship Model

```
Base Batch
  |
  |-- Incentive 1 (child)
  |     |-- Allocation File (auto-generated)
  |     |-- Unique Links
  |
  |-- Incentive 2 (child, can be active simultaneously)
  |     |-- Allocation File (auto-generated)
  |     |-- Unique Links
  |
  |-- Incentive 3 (child)
        |-- Allocation File (auto-generated)
        |-- Unique Links
```

- An incentive is always a **child** of a base batch.
- **Multiple incentives can be active simultaneously** under a base batch.
- The base batch view shows a list of all associated incentives.

---

### 5.7 Mutual Inclusivity of Incentives

Incentives within a base batch are **mutually inclusive**:
- A customer can qualify for **any combination** of incentives based on each incentive's independent eligibility criteria.
- If a customer qualifies for multiple incentives, all applicable outcomes are applied.
- If a customer qualifies for none, they are excluded.

---

### 5.8 Irreversible Incentive Disable

In the incentive detail view, the incentive has an **Enabled/Disabled toggle** in the header:

- **Enabled** (default): Incentive is active and will be applied to eligible customers.
- **Disable action**: Clicking the toggle opens a **confirmation modal**:
  - Title: "Disable Incentive?"
  - Warning: "This action is **irreversible**. Once disabled, this incentive cannot be enabled again. Disabling will stop this incentive from being applied to any future eligible customers."
  - Rationale note: "Re-enabling is not supported because backtracing previously applied incentives would be operationally complex and error-prone."
  - Actions: "Cancel" / "Disable Permanently"
- **Disabled state**: Entire overview section is grayed out (50% opacity), label shows "Disabled" in red, toggle becomes non-interactive (`cursor: not-allowed`).
- **Irreversibility**: Once disabled, re-enabling is explicitly blocked. This is by design.

---

## 6. Admin Views

### 6.1 Incentive List View (within Base Batch)

Accessible from the base batch detail page under the "Incentives" section in the Overview tab.

| Column | Description |
|--------|-------------|
| Incentive Title | Name of the incentive (clickable, navigates to detail) |
| Status | SCHEDULED / ACTIVE / EXPIRED / CANCELLED / ERROR |
| Duration | Start date – End date |
| Eligible Customers | Count of customers who matched eligibility criteria |
| Outcome | Chip showing the outcome type label |
| Created By | Admin who created the incentive |
| Created At | Timestamp |

Empty state: "No incentives yet" with a CTA to create the first one.

### 6.2 Incentive Detail View

Clicking into an individual incentive opens a detail page. The page shows only information collected during incentive creation (CRUD), plus analytics. There are no tabs — all content is displayed on a single scrollable page. The header shows the incentive title, status badge, and enable/disable toggle (no 3-dot menu).

**Sections** are displayed with Figma-style bold headings and a bottom border separator.

**Basic Details** (with edit button)

| Field | Description |
|-------|-------------|
| Incentive ID | System-generated incentive ID (with copy button) |
| Title | Name of the incentive |
| Start Date | When the incentive becomes active |
| End Date | When the incentive expires |
| Eligible Customers | Count of customers who matched eligibility criteria |

**Inline Edit Mode:** Clicking the edit (pencil) icon switches Basic Details to an inline form with Title, Description, Start Date, and End Date fields. Validation is applied (title required, end date must be after start date). On save, Audit Info is updated automatically.

**Start Date editability:**
- `SCHEDULED`: Start date is editable
- `ACTIVE` / `EXPIRED` / other states: Start date is locked (disabled input with hint text)

**End Date** is always editable regardless of status.

The edit button is hidden when the incentive is disabled.

**Eligibility Criteria**

Displayed as a summary card with AND separators between each criterion:
| Row Type | Display Format |
|----------|---------------|
| Journey Status | `NOT_STARTED` / `IN_PROGRESS` |
| Smart Tags | Blue chips with tag names |
| Propensity Range | `{min} - {max}` |
| Decile Range | `{min} - {max}` |
| Current ROI | `{operator} {value}%` |
| Event Rule | `{eventType} on "{eventTarget}"` + optional frequency + optional time window |

**Outcome**

Displayed as a summary card:
| Type | Display |
|------|---------|
| ROI/PF/Processing Charge | Label (type — sub-type) + computed display value |
| Merchant Offer | Shopping bag icon + purple chips with offer names |

**Audit Info**

| Field | Description |
|-------|-------------|
| Created By | Admin who created the incentive |
| Created On | Timestamp of creation |
| Last Updated By | Admin who last modified the incentive |
| Last Updated On | Timestamp of last modification |

**Analytics**

Top-level metric cards (displayed in individual bordered rounded boxes):

| Metric | Description |
|--------|-------------|
| Final Batch Data | Total number of eligible customers in the incentive |
| Conversions | Number of customers who completed the journey |
| Conversion Rate | Conversions / Final Batch Data (%) |
| Days to Journey End | Remaining days until incentive end date |

**Overall Funnel**

Bar chart tracking conversion rates across stages:

| Stage | Description |
|-------|-------------|
| Total Customers | All eligible customers in the incentive |
| Visited Landing Page | Customers who opened the unique link |
| Completed Journey | Customers who finished the conversion |
| Attempted OTP Verification | Customers who reached OTP step |

---

## 7. Validation Summary

| # | Rule | When Checked | Error Behavior |
|---|------|-------------|----------------|
| 1 | Title is required | Step 1 validation | Inline error, block forward navigation |
| 2 | Title must be under 100 characters | Step 1 validation | Inline error |
| 3 | Start date is required | Step 1 validation | Inline error |
| 4 | End date is required | Step 1 validation | Inline error |
| 5 | End date must be after start date | Step 1 validation | Inline error |
| 6 | Incentive duration must be within base batch bounds | Step 1 (info banner shown, enforcement TBD) | Info banner displayed |
| 7 | Outcome type is required | Step 2 validation | Inline error |
| 8 | Outcome sub-type (variant) is required (for ROI/PF/Proc Charge) | Step 2 validation | Inline error |
| 9 | Outcome value is required (when sub-type selected) | Step 2 validation | Inline error |
| 10 | At least one merchant offer must be selected (for merchant offer outcome) | Step 2 validation | Inline error |
| 11 | Event rule: event type is required | Step 2 validation | Inline error |
| 12 | Event rule: event target is required | Step 2 validation | Inline error |
| 13 | Event rule: frequency value required if frequency enabled | Step 2 validation | Inline error |
| 14 | Event rule: time window value required if time window enabled | Step 2 validation | Inline error |

---

## 8. Current Requirement Mapping

The following table maps the current bank logic to how it would be configured in the new system:

| Current Logic | New System Configuration |
|--------------|--------------------------|
| Propensity 1–5 customers get ROI - 1, if ROI > 12 | **Incentive 1:** Eligibility: Propensity RANGE 1–5, Current ROI GT 12. Outcome: ROI Relative = Current ROI - 1% |
| Decile 0–2 customers get PF = 0% | **Incentive 2:** Eligibility: Decile RANGE 0–2. Outcome: Processing Fee Flat = Rs 0 |
| Both conditions are mutually inclusive | Both incentives exist independently; customer can qualify for either or both |

---

## 9. Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| No customers match eligibility criteria | Incentive moves to ACTIVE with 0 eligible customers. Admin is notified. No child batch created. |
| Base batch is deactivated while incentive is SCHEDULED | Incentive auto-transitions to CANCELLED. |
| Customer data (propensity/decile) is missing in DB | Customer is excluded from eligibility evaluation. Logged for admin review. |
| Incentive is SCHEDULED and admin wants to edit | Allowed — all basic detail fields editable. Start date is locked once incentive leaves SCHEDULED state. End date is always editable. |
| Admin disables an incentive | Irreversible. Confirmation modal required. Overview grayed out, cannot be re-enabled. |

---

## 10. Not Yet Implemented (Future Scope)

The following items from the original PRD or planned features are **not yet implemented** in the prototype:

| Feature | Status | Notes |
|---------|--------|-------|
| EMI Config Mapping Check | Not implemented | System-validated mapping of current to override EMI configs. Critical for production but excluded from prototype. |
| Duration enforcement against base batch | Partial | Info banner shown but validation does not actually block out-of-range dates. |
| Persistence / API integration | Not implemented | All data is in-memory mock data. Creating an incentive fires a toast but does not persist. |
| Campaign Strategy tab | Stub only | Empty state placeholder in base batch view. Incentive detail view has no tabs. |
| Edit flow for basic details | Implemented | Inline edit for title, description, start date (SCHEDULED only), end date (always). In-memory only — no API persistence. |
| Incentive lifecycle automation | Not implemented | SCHEDULED → ACTIVE → EXPIRED transitions are not automated. |
| Cancel incentive action | Not implemented | CANCELLED status exists but no cancel action in UI. |
| Override ROI > 0% validation | Not implemented | No computation-time validation of resulting offer values. |
| Override PF >= 0 validation | Not implemented | No computation-time validation of resulting offer values. |
| Journey variant compatibility | Not implemented | `variables` and `frontendSupported` fields on journey variant config. Create form filtering and soft warnings. See Section 3.1. |

---

## 11. Success Metrics

| Metric | Target |
|--------|--------|
| Reduction in manual file generation | 100% (fully automated) |
| Incentive creation errors | < 1% (vs current manual error rate) |
| Time from bank instruction to offer live | Reduced significantly (admin self-serve vs data team dependency) |
| Offer-to-base batch traceability | 100% (every incentive linked to parent) |
| Conversion rate visibility | Per-incentive analytics available |

---

## Appendix A: Outcome Type Reference

| Key | Label | Category | Sub-types | Input Format |
|-----|-------|----------|-----------|-------------|
| `roi` | ROI | EMI | `relative` (Current ROI - N%), `absolute` (Set ROI = N%) | Numeric |
| `pf` | Processing Fee | EMI | `flat` (Rs N), `relative` (Current PF - Rs N) | Numeric |
| `proc_charge` | Processing Charge | Plan Change | `flat` (Rs N), `relative` (Current Charge - Rs N) | Numeric |
| `merchant_offer` | Merchant Offer | All Journeys | — | Multi-select from catalog |

## Appendix B: Eligibility Criteria Reference

| Key | Label | Input Type | Operators |
|-----|-------|-----------|-----------|
| `journeyStatus` | Journey Status | Toggle buttons (multi-select) | `NOT_STARTED`, `IN_PROGRESS` |
| `smartTags` | Smart Tags | Searchable multi-select dropdown | — (inclusion-based) |
| `propensity` | Propensity | Operator dropdown + numeric input(s) | RANGE, GT, GTE, LT, LTE, E |
| `decile` | Decile | Operator dropdown + numeric input(s) | RANGE, GT, GTE, LT, LTE, E |
| `currentRoi` | Current ROI | Operator dropdown + numeric input | GT (default), GTE, LT, LTE, E |
| _(event rule)_ | Event Rule | Event type + target + optional frequency/time window | See Section 5.2 Step 2 A |

## Appendix C: Data Model Summary

```
Journey Variant
  ├── id, name, journeyType
  ├── variables: string[]          // e.g. ['roi', 'pf', 'decile', 'propensity']
  └── frontendSupported: string[]  // subset of variables rendered on frontend

Base Batch
  ├── id, title, description, tag, status, type
  ├── journeyType, journeyVariant, issuer, genericUrls
  ├── startDate, endDate
  ├── expectedConversion, userBase, notificationSetup
  ├── analytics { finalBatchData, conversions, conversionRate, daysToJourneyEnd }
  ├── funnel [{ name, value }]
  └── Incentives[]
       ├── id, title, status (SCHEDULED | ACTIVE | EXPIRED | CANCELLED)
       ├── startDate, endDate
       ├── eligibleCustomers, createdBy, createdAt, lastUpdatedBy, lastUpdatedAt
       ├── analytics { finalBatchData, conversions, conversionRate, daysToJourneyEnd }
       ├── funnel [{ name, value }]
       ├── eligibility
       │    ├── journeyStatus: string
       │    ├── smartTags: string[]
       │    ├── propensityRange: { min, max }
       │    ├── decileRange: { min, max }
       │    ├── currentRoi: { operator, value }
       │    └── events: [{ eventType, eventTarget, frequency?, timeWindow? }]
       └── outcome
            ├── type: 'roi' | 'pf' | 'proc_charge' | 'merchant_offer'
            ├── subType: 'relative' | 'absolute' | 'flat' | undefined
            ├── label, display
            ├── value: number | null
            └── merchantOffers?: string[]
```
