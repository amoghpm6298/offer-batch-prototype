import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, Pencil, MoreHorizontal, Plus, Eye } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import StatusBadge from '../components/StatusBadge';
import AnalyticsCards from '../components/AnalyticsCards';
import FunnelChart from '../components/FunnelChart';
import { baseBatch, offerBatches } from '../data/mockData';
import { format } from 'date-fns';

export default function BaseBatchView() {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), 'dd MMM, yyyy - HH:mm');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="page-container">
      <Breadcrumb items={[
        { label: 'Journeys', to: '/' },
        { label: 'Credit Limit Increase - Jun 25', to: '/' },
        { label: 'Journey Details' },
      ]} />

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title-row">
            <h1 className="page-title">{baseBatch.title}</h1>
            <span className="tag tag-test">{baseBatch.tag}</span>
          </div>
          <p className="page-description">{baseBatch.description}</p>
        </div>
        <div className="header-actions">
          <StatusBadge status="Active" />
          <span className="type-badge">{baseBatch.type}</span>
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
          {/* Journey Details */}
          <div className="section">
            <div className="section-title" style={{ marginBottom: 16 }}>Journey Details</div>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Batch ID</span>
                <span className="detail-value">
                  {baseBatch.id}
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
              <button className="section-edit-btn"><Pencil size={14} /></button>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Batch Start Date</span>
                <span className="detail-value">{baseBatch.startDate} → {baseBatch.endDate}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">User Base</span>
                <span className="detail-value"><a href="#">View Details</a></span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Expected Conversion</span>
                <span className="detail-value">{baseBatch.expectedConversion}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Notification Setup</span>
                <span className="detail-value" style={{ fontSize: 13 }}>{baseBatch.notificationSetup}</span>
              </div>
            </div>
          </div>

          {/* Sub-Batches Section */}
          <div className="section">
            <div className="section-header">
              <span className="section-title">Sub-Batches</span>
              <Link to="/create-sub-batch" style={{ textDecoration: 'none' }}>
                <button className="btn btn-primary btn-sm">
                  <Plus size={15} /> Create Sub-Batch
                </button>
              </Link>
            </div>

            {offerBatches.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Sub-Batch Title</th>
                      <th>Status</th>
                      <th>Duration</th>
                      <th>Eligible Customers</th>
                      <th>Incentives</th>
                      <th>Created By</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offerBatches.map((ob) => (
                      <tr key={ob.id} onClick={() => navigate(`/sub-batch/${ob.id}`)}>
                        <td className="table-link">{ob.title}</td>
                        <td><span className={`status-badge status-${ob.status}`}>{ob.status.charAt(0) + ob.status.slice(1).toLowerCase()}</span></td>
                        <td style={{ fontSize: 12 }}>{formatDate(ob.startDate)} → {formatDate(ob.endDate)}</td>
                        <td>{ob.eligibleCustomers.toLocaleString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {(ob.offerDefinitions || []).map((def) => (
                              <span key={def.id} style={{
                                padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                                background: '#f5f3ff',
                                color: '#6d28d9',
                                border: '1px solid #ddd6fe',
                              }}>
                                {def.name} ({def.outcomes.length})
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>{ob.createdBy}</td>
                        <td style={{ fontSize: 12 }}>{formatDate(ob.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-title">No sub-batches yet</div>
                  <div className="empty-state-desc">Create your first sub-batch to run promotional incentives for this journey.</div>
                  <Link to="/create-sub-batch" style={{ textDecoration: 'none' }}>
                    <button className="btn btn-primary btn-sm"><Plus size={15} /> Create Sub-Batch</button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Analytics */}
          <div className="section">
            <div className="section-title" style={{ marginBottom: 16 }}>Analytics</div>
            <AnalyticsCards analytics={baseBatch.analytics} />
            <FunnelChart data={baseBatch.funnel} />
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
    </div>
  );
}
