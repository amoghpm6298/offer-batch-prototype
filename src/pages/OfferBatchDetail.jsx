import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Copy, Pencil, MoreHorizontal, Eye, Tag, ShoppingBag, AlertTriangle } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import StatusBadge from '../components/StatusBadge';
import AnalyticsCards from '../components/AnalyticsCards';
import FunnelChart from '../components/FunnelChart';
import { baseBatch, offerBatches } from '../data/mockData';
import { format } from 'date-fns';

export default function OfferBatchDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [disabledDefs, setDisabledDefs] = useState({});
  const [confirmDisableId, setConfirmDisableId] = useState(null);

  const handleToggleClick = (defId) => {
    if (disabledDefs[defId]) return; // Already disabled — cannot re-enable
    setConfirmDisableId(defId);
  };

  const confirmDisable = () => {
    if (confirmDisableId) {
      setDisabledDefs(prev => ({ ...prev, [confirmDisableId]: true }));
      setConfirmDisableId(null);
    }
  };

  const cancelDisable = () => {
    setConfirmDisableId(null);
  };

  const batch = offerBatches.find(ob => ob.id === id);
  if (!batch) {
    return (
      <div className="page-container">
        <div className="card" style={{ marginTop: 40 }}>
          <div className="empty-state">
            <div className="empty-state-title">Sub-Batch not found</div>
            <Link to="/">Back to base batch</Link>
          </div>
        </div>
      </div>
    );
  }

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
          <div style={{ textAlign: 'center', margin: '2px 0' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.05em' }}>AND</span>
          </div>
        )}
      </div>
    ));
  };

  const getOutcomeLabel = (outcome) => {
    if (outcome.subType) {
      const typeLabels = { roi: 'ROI', pf: 'Processing Fee', proc_charge: 'Processing Charge' };
      const subLabels = { relative: 'Relative', absolute: 'Absolute', flat: 'Flat' };
      return `${typeLabels[outcome.type] || outcome.type} \u2014 ${subLabels[outcome.subType] || outcome.subType}`;
    }
    return outcome.label || outcome.type;
  };

  const renderOutcome = (outcome, index) => {
    let display = outcome.display;

    if (outcome.type === 'smart_tag' && outcome.smartTags) {
      display = outcome.smartTags.join(', ');
    }

    if (outcome.type === 'merchant_offer' && outcome.merchantOffers) {
      return (
        <div key={index} className="offer-summary-row">
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
      <div key={index} className="offer-summary-row">
        <span className="offer-summary-label">
          {outcome.type === 'smart_tag' && <Tag size={13} style={{ marginRight: 4, verticalAlign: 'middle', color: '#6b7280' }} />}
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
        { label: 'Credit Limit Increase - Jun 25', to: '/' },
        { label: batch.title },
      ]} />

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title-row">
            <h1 className="page-title">{batch.title}</h1>
          </div>
          <p className="page-description">Sub-Batch under {baseBatch.title}</p>
        </div>
        <div className="header-actions">
          <StatusBadge status={batch.status} />
          <button className="more-btn"><MoreHorizontal size={16} /></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`tab ${activeTab === 'campaign' ? 'active' : ''}`} onClick={() => setActiveTab('campaign')}>Sub-Batch Strategy</button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Sub-Batch Details */}
          <div className="section">
            <div className="section-title" style={{ marginBottom: 16 }}>Sub-Batch Details</div>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Batch ID</span>
                <span className="detail-value">
                  {batch.id}
                  <button className="copy-btn"><Copy size={14} /></button>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Journey Type</span>
                <span className="detail-value">{baseBatch.journeyType}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Issuer</span>
                <span className="detail-value">{baseBatch.issuer}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Journey Variant</span>
                <span className="detail-value">
                  {baseBatch.journeyVariant}
                  <span className="view-steps-link"><Eye size={13} /> View Steps</span>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Generic URLs</span>
                <span className="detail-value">
                  <span className="enabled-badge">Enabled</span>
                </span>
              </div>
            </div>
          </div>

          {/* Batch Details */}
          <div className="section">
            <div className="section-header">
              <span className="section-title">Batch Details</span>
              {batch.status === 'SCHEDULED' && (
                <button className="section-edit-btn"><Pencil size={14} /></button>
              )}
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Batch Start Date</span>
                <span className="detail-value">{formatDate(batch.startDate)} \u2192 {formatDate(batch.endDate)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">User Base</span>
                <span className="detail-value"><a href="#">View Details</a></span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Expected Conversion</span>
                <span className="detail-value">50%</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Notification Setup</span>
                <span className="detail-value" style={{ fontSize: 13 }}>{baseBatch.notificationSetup}</span>
              </div>
            </div>
          </div>

          {/* Incentive Definitions */}
          <div className="section">
            <div className="section-title" style={{ marginBottom: 16 }}>
              Incentive Definitions ({batch.offerDefinitions?.length || 0})
            </div>

            {batch.offerDefinitions && batch.offerDefinitions.length > 0 ? (
              batch.offerDefinitions.map((def, index) => {
                const isDisabled = disabledDefs[def.id];
                return (
                  <div key={def.id} className="offer-summary" style={{ opacity: isDisabled ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div className="offer-summary-title" style={{ marginBottom: 0 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', background: '#f3f4f6', fontSize: 11, fontWeight: 600, color: '#6b7280', marginRight: 8 }}>
                          {index + 1}
                        </span>
                        {def.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: isDisabled ? '#dc2626' : '#059669', fontWeight: 500 }}>
                          {isDisabled ? 'Disabled' : 'Enabled'}
                        </span>
                        <button
                          className={`toggle-switch ${isDisabled ? '' : 'active'} ${isDisabled ? 'permanently-disabled' : ''}`}
                          onClick={() => handleToggleClick(def.id)}
                          title={isDisabled ? 'This definition has been permanently disabled' : 'Disable definition'}
                          style={isDisabled ? { cursor: 'not-allowed', opacity: 0.5 } : {}}
                        />
                      </div>
                    </div>
                    {renderEligibility(def.eligibility)}
                    <div style={{ height: 1, background: '#e5e7eb', margin: '8px 0' }} />
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>
                      OUTCOME
                    </div>
                    {def.outcomes.map((outcome, oi) => renderOutcome(outcome, oi))}
                  </div>
                );
              })
            ) : (
              <div className="offer-summary" style={{ textAlign: 'center', color: '#9ca3af' }}>
                No incentive definitions configured.
              </div>
            )}
          </div>

          {/* Analytics */}
          <div className="section">
            <div className="section-title" style={{ marginBottom: 16 }}>Analytics</div>
            <AnalyticsCards analytics={batch.analytics} />
            <FunnelChart data={batch.funnel} />
          </div>
        </>
      )}

      {activeTab === 'campaign' && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-title">Sub-Batch Strategy</div>
            <div className="empty-state-desc">Sub-Batch strategy configuration will appear here.</div>
          </div>
        </div>
      )}

      {/* Disable Confirmation Modal */}
      {confirmDisableId && (
        <div className="modal-overlay" onClick={cancelDisable}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-icon-wrapper">
              <AlertTriangle size={28} color="#dc2626" />
            </div>
            <h3 className="modal-title">Disable Incentive Definition?</h3>
            <p className="modal-description">
              This action is <strong>irreversible</strong>. Once disabled, this incentive definition cannot be
              enabled again. Disabling will stop this definition from being applied to any future eligible customers.
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
    </div>
  );
}
