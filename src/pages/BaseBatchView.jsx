import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, Pencil, MoreHorizontal, Plus, Eye } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import StatusBadge from '../components/StatusBadge';
import AnalyticsCards from '../components/AnalyticsCards';
import FunnelChart from '../components/FunnelChart';
import { baseBatch, incentives } from '../data/mockData';
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
        { label: 'OS to EMI - Jun 25', to: '/' },
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
        <button className={`tab ${activeTab === 'campaign' ? 'active' : ''}`} onClick={() => setActiveTab('campaign')}>Campaign Strategy</button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Journey Details */}
          <div className="detail-section">
            <div className="detail-section-title">Journey Details</div>
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
          <div className="detail-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #e5e7eb', marginBottom: 20 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Batch Details</span>
              <button className="section-edit-btn"><Pencil size={14} /></button>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Batch Duration</span>
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

          {/* Incentives Section */}
          <div className="detail-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #e5e7eb', marginBottom: 20 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Incentives</span>
              <Link to="/create-incentive" style={{ textDecoration: 'none' }}>
                <button className="btn btn-primary btn-sm">
                  <Plus size={15} /> Create Incentive
                </button>
              </Link>
            </div>

            {incentives.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Incentive Title</th>
                      <th>Status</th>
                      <th>Duration</th>
                      <th>Eligible Customers</th>
                      <th>Outcome</th>
                      <th>Created By</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incentives.map((inc) => (
                      <tr key={inc.id} onClick={() => navigate(`/incentive/${inc.id}`)}>
                        <td className="table-link">{inc.title}</td>
                        <td><span className={`status-badge status-${inc.status}`}>{inc.status.charAt(0) + inc.status.slice(1).toLowerCase()}</span></td>
                        <td style={{ fontSize: 12 }}>{formatDate(inc.startDate)} → {formatDate(inc.endDate)}</td>
                        <td>{inc.eligibleCustomers.toLocaleString()}</td>
                        <td>
                          <span style={{
                            padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                            background: '#f5f3ff',
                            color: '#6d28d9',
                            border: '1px solid #ddd6fe',
                          }}>
                            {inc.outcome.label || inc.outcome.type}
                          </span>
                        </td>
                        <td>{inc.createdBy}</td>
                        <td style={{ fontSize: 12 }}>{formatDate(inc.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-title">No incentives yet</div>
                  <div className="empty-state-desc">Create your first incentive to run promotional offers for this journey.</div>
                  <Link to="/create-incentive" style={{ textDecoration: 'none' }}>
                    <button className="btn btn-primary btn-sm"><Plus size={15} /> Create Incentive</button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Analytics */}
          <div className="detail-section">
            <div className="detail-section-title">Analytics</div>
            <AnalyticsCards analytics={baseBatch.analytics} />
            <FunnelChart data={baseBatch.funnel} />
          </div>
        </>
      )}

      {activeTab === 'campaign' && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-title">Campaign Strategy</div>
            <div className="empty-state-desc">Campaign strategy configuration will appear here.</div>
          </div>
        </div>
      )}
    </div>
  );
}
