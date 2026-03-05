import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Copy, Pencil, ShoppingBag, AlertTriangle } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import StatusBadge from '../components/StatusBadge';
import AnalyticsCards from '../components/AnalyticsCards';
import FunnelChart from '../components/FunnelChart';
import { baseBatch, incentives } from '../data/mockData';
import { format } from 'date-fns';

export default function IncentiveDetail() {
  const { id } = useParams();
  const [isDisabled, setIsDisabled] = useState(false);
  const [showConfirmDisable, setShowConfirmDisable] = useState(false);
  const [editing, setEditing] = useState(false);

  const incentive = incentives.find(inc => inc.id === id);

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editErrors, setEditErrors] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleToggleClick = () => {
    if (isDisabled) return;
    setShowConfirmDisable(true);
  };

  const confirmDisable = () => {
    setIsDisabled(true);
    setShowConfirmDisable(false);
  };

  const cancelDisable = () => {
    setShowConfirmDisable(false);
  };

  if (!incentive) {
    return (
      <div className="page-container">
        <div className="card" style={{ marginTop: 40 }}>
          <div className="empty-state">
            <div className="empty-state-title">Incentive not found</div>
            <Link to="/">Back to base batch</Link>
          </div>
        </div>
      </div>
    );
  }

  const startDateLocked = incentive.status !== 'SCHEDULED';

  const toDatetimeLocal = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const startEditing = () => {
    setEditTitle(incentive.title);
    setEditDescription(incentive.description || '');
    setEditStartDate(toDatetimeLocal(incentive.startDate));
    setEditEndDate(toDatetimeLocal(incentive.endDate));
    setEditErrors({});
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditErrors({});
  };

  const saveEdits = () => {
    const errs = {};
    if (!editTitle.trim()) errs.title = 'Title is required';
    if (!editStartDate) errs.startDate = 'Start date is required';
    if (!editEndDate) errs.endDate = 'End date is required';
    if (editStartDate && editEndDate && new Date(editStartDate) >= new Date(editEndDate)) {
      errs.endDate = 'End date must be after start date';
    }
    setEditErrors(errs);
    if (Object.keys(errs).length > 0) return;

    // Mock save — update in-memory
    incentive.title = editTitle.trim();
    incentive.description = editDescription.trim();
    if (!startDateLocked) {
      incentive.startDate = new Date(editStartDate).toISOString();
    }
    incentive.endDate = new Date(editEndDate).toISOString();
    incentive.lastUpdatedAt = new Date().toISOString();
    incentive.lastUpdatedBy = 'You';

    setEditing(false);
    setToast('Basic details updated successfully');
    setTimeout(() => setToast(null), 2500);
  };

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), 'dd MMM, yyyy - HH:mm');
    } catch {
      return dateStr;
    }
  };

  const renderEligibility = (eligibility) => {
    const rows = [];
    rows.push({ key: 'status', label: 'Journey Status', value: eligibility.journeyStatus });

    if (eligibility.smartTags && eligibility.smartTags.length > 0) {
      rows.push({ key: 'tags', label: 'Smart Tags', tags: eligibility.smartTags });
    }

    if (eligibility.propensityRange) {
      rows.push({ key: 'propensity', label: 'Propensity Range', value: `${eligibility.propensityRange.min} - ${eligibility.propensityRange.max}` });
    }

    if (eligibility.decileRange) {
      rows.push({ key: 'decile', label: 'Decile Range', value: `${eligibility.decileRange.min} - ${eligibility.decileRange.max}` });
    }

    if (eligibility.currentRoi) {
      rows.push({ key: 'roi', label: 'Current ROI', value: `${eligibility.currentRoi.operator} ${eligibility.currentRoi.value}%` });
    }

    if (eligibility.events && eligibility.events.length > 0) {
      eligibility.events.forEach((evt, i) => {
        let display = `${evt.eventType} on "${evt.eventTarget}"`;
        if (evt.frequency) {
          display += ` ${evt.frequency.operator} ${evt.frequency.value} times`;
        }
        if (evt.timeWindow) {
          display += ` within last ${evt.timeWindow.value} ${evt.timeWindow.unit}`;
        }
        rows.push({ key: `event_${i}`, label: `Event Rule ${i + 1}`, value: display });
      });
    }

    return rows.map((row, i) => (
      <div key={row.key}>
        <div className="offer-summary-row">
          <span className="offer-summary-label">{row.label}</span>
          {row.tags ? (
            <span className="offer-summary-value" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {row.tags.map((tag, ti) => (
                <span key={ti} style={{ padding: '2px 8px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 4, fontSize: 12, color: '#1d4ed8' }}>{tag}</span>
              ))}
            </span>
          ) : (
            <span className="offer-summary-value">{row.value}</span>
          )}
        </div>
        {i < rows.length - 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.05em', flexShrink: 0 }}>AND</span>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          </div>
        )}
      </div>
    ));
  };

  const getOutcomeLabel = (outcome) => {
    if (outcome.subType) {
      const typeLabels = { roi: 'ROI', pf: 'Processing Fee', proc_charge: 'Processing Charge' };
      const subLabels = { relative: 'Relative', absolute: 'Absolute', flat: 'Flat' };
      return `${typeLabels[outcome.type] || outcome.type} — ${subLabels[outcome.subType] || outcome.subType}`;
    }
    return outcome.label || outcome.type;
  };

  const renderOutcome = (outcome) => {
    let display = outcome.display;

    if (outcome.type === 'merchant_offer' && outcome.merchantOffers) {
      return (
        <div className="offer-summary-row">
          <span className="offer-summary-label">
            <ShoppingBag size={13} style={{ marginRight: 4, verticalAlign: 'middle', color: '#6b7280' }} />
            Merchant Offer
          </span>
          <span className="offer-summary-value" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {outcome.merchantOffers.map((name, i) => (
              <span key={i} style={{ padding: '2px 8px', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 4, fontSize: 12, color: '#7c3aed' }}>{name}</span>
            ))}
          </span>
        </div>
      );
    }

    return (
      <div className="offer-summary-row">
        <span className="offer-summary-label">
          {getOutcomeLabel(outcome)}
        </span>
        <span className="offer-summary-value">{display}</span>
      </div>
    );
  };

  return (
    <div className="page-container">
      <Breadcrumb items={[
        { label: 'Journeys', to: '/' },
        { label: 'OS to EMI - Jun 25', to: '/' },
        { label: incentive.title },
      ]} />

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title-row">
            <h1 className="page-title">{incentive.title}</h1>
          </div>
          <p className="page-description">Incentive under {baseBatch.title}</p>
        </div>
        <div className="header-actions">
          <StatusBadge status={incentive.status} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: isDisabled ? '#dc2626' : '#059669', fontWeight: 500 }}>
              {isDisabled ? 'Disabled' : 'Enabled'}
            </span>
            <button
              className={`toggle-switch ${isDisabled ? '' : 'active'} ${isDisabled ? 'permanently-disabled' : ''}`}
              onClick={handleToggleClick}
              title={isDisabled ? 'This incentive has been permanently disabled' : 'Disable incentive'}
              style={isDisabled ? { cursor: 'not-allowed', opacity: 0.5 } : {}}
            />
          </div>
        </div>
      </div>

      <div style={{ opacity: isDisabled ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        {/* Basic Details */}
        <div className="detail-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #e5e7eb', marginBottom: 20 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Basic Details</span>
            {!editing && !isDisabled && (
              <button className="section-edit-btn" onClick={startEditing} title="Edit basic details">
                <Pencil size={14} />
              </button>
            )}
          </div>

          {!editing ? (
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Incentive ID</span>
                <span className="detail-value">
                  {incentive.id}
                  <button className="copy-btn"><Copy size={14} /></button>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Title</span>
                <span className="detail-value">{incentive.title}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Start Date</span>
                <span className="detail-value">{formatDate(incentive.startDate)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">End Date</span>
                <span className="detail-value">{formatDate(incentive.endDate)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Eligible Customers</span>
                <span className="detail-value">{incentive.eligibleCustomers.toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="form-group">
                <label className="form-label">Title <span className="required">*</span></label>
                <input
                  type="text"
                  className={`form-input ${editErrors.title ? 'error' : ''}`}
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  maxLength={100}
                />
                {editErrors.title && <span className="form-error">{editErrors.title}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  maxLength={500}
                  rows={2}
                />
              </div>

              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    Start Date & Time <span className="required">*</span>
                    {startDateLocked && (
                      <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, marginLeft: 6 }}>(locked — only editable in scheduled state)</span>
                    )}
                  </label>
                  <input
                    type="datetime-local"
                    className={`form-input ${editErrors.startDate ? 'error' : ''}`}
                    value={editStartDate}
                    onChange={e => setEditStartDate(e.target.value)}
                    disabled={startDateLocked}
                  />
                  {editErrors.startDate && <span className="form-error">{editErrors.startDate}</span>}
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">End Date & Time <span className="required">*</span></label>
                  <input
                    type="datetime-local"
                    className={`form-input ${editErrors.endDate ? 'error' : ''}`}
                    value={editEndDate}
                    onChange={e => setEditEndDate(e.target.value)}
                  />
                  {editErrors.endDate && <span className="form-error">{editErrors.endDate}</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button className="btn btn-primary" onClick={saveEdits}>Save Changes</button>
                <button className="btn btn-secondary" onClick={cancelEditing}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Eligibility Criteria */}
        <div className="detail-section">
          <div className="detail-section-title">Eligibility Criteria</div>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 16px' }}>These filters will be applied with the base batch cohort as the starting set.</p>
          <div className="offer-summary">
            {renderEligibility(incentive.eligibility)}
          </div>
        </div>

        {/* Outcome */}
        <div className="detail-section">
          <div className="detail-section-title">Outcome</div>
          <div className="offer-summary">
            {renderOutcome(incentive.outcome)}
          </div>
        </div>

        {/* Audit Info */}
        <div className="detail-section">
          <div className="detail-section-title">Audit Info</div>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Created By</span>
              <span className="detail-value">{incentive.createdBy}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Created On</span>
              <span className="detail-value">{formatDate(incentive.createdAt)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Last Updated By</span>
              <span className="detail-value">{incentive.lastUpdatedBy}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Last Updated On</span>
              <span className="detail-value">{formatDate(incentive.lastUpdatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="detail-section">
          <div className="detail-section-title">Analytics</div>
          <AnalyticsCards analytics={incentive.analytics} />
          <FunnelChart data={incentive.funnel} />
        </div>
      </div>

      {/* Disable Confirmation Modal */}
      {showConfirmDisable && (
        <div className="modal-overlay" onClick={cancelDisable}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-icon-wrapper">
              <AlertTriangle size={28} color="#dc2626" />
            </div>
            <h3 className="modal-title">Disable Incentive?</h3>
            <p className="modal-description">
              This action is <strong>irreversible</strong>. Once disabled, this incentive cannot be
              enabled again. Disabling will stop this incentive from being applied to any future eligible customers.
            </p>
            <p className="modal-description" style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
              Re-enabling is not supported because backtracing previously applied incentives would be operationally complex and error-prone.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={cancelDisable}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDisable}>
                Disable Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
