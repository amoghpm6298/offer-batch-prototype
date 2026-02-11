import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Info, Check, Plus, X, ChevronRight, ChevronDown, ArrowLeft, Tag, Search, Trash2, Copy, ShoppingBag } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import { baseBatch } from '../data/mockData';

// Mock smart tags
const AVAILABLE_SMART_TAGS = [
  { id: 'st_001', name: 'High Value Customers', count: 12450 },
  { id: 'st_002', name: 'Dormant 90+ Days', count: 8320 },
  { id: 'st_003', name: 'Premium Card Holders', count: 5100 },
  { id: 'st_004', name: 'First-Time EMI Users', count: 15800 },
  { id: 'st_005', name: 'Low Utilization (<30%)', count: 22400 },
  { id: 'st_006', name: 'High Spenders (>50k/mo)', count: 9750 },
  { id: 'st_007', name: 'NTC Customers', count: 3200 },
  { id: 'st_008', name: 'Retention Risk Cohort', count: 6800 },
];

// Event eligibility catalogs
const EVENT_TYPES = [
  { value: 'click', label: 'Click' },
  { value: 'page_view', label: 'Page View' },
  { value: 'form_submit', label: 'Form Submit' },
  { value: 'cta_tap', label: 'CTA Tap' },
  { value: 'scroll', label: 'Scroll' },
  { value: 'video_play', label: 'Video Play' },
];

const EVENT_TARGETS = [
  'Review Details',
  'Apply Now',
  'EMI Calculator',
  'View Offers',
  'Check Eligibility',
  'Download Statement',
  'Contact Support',
  'Share Referral',
  'Landing Page',
  'Offer Summary',
  'Terms & Conditions',
  'FAQ Section',
];

const TIME_WINDOW_UNITS = [
  { value: 'hours', label: 'hours' },
  { value: 'days', label: 'days' },
  { value: 'weeks', label: 'weeks' },
];

const FREQUENCY_OPERATORS = [
  { value: 'GTE', label: '>=', symbol: '>=' },
  { value: 'GT', label: '>', symbol: '>' },
  { value: 'LTE', label: '<=', symbol: '<=' },
  { value: 'LT', label: '<', symbol: '<' },
  { value: 'E', label: '=', symbol: '=' },
];

// Mock merchant offers
const AVAILABLE_MERCHANT_OFFERS = [
  { id: 'mo_001', name: 'Amazon - 10% Cashback', merchant: 'Amazon', description: '10% cashback up to Rs 500 on all purchases' },
  { id: 'mo_002', name: 'Flipkart - Flat Rs 200 Off', merchant: 'Flipkart', description: 'Flat Rs 200 off on min purchase Rs 1000' },
  { id: 'mo_003', name: 'Swiggy - 20% Off', merchant: 'Swiggy', description: '20% off up to Rs 150 on orders above Rs 500' },
  { id: 'mo_004', name: 'Myntra - Buy 2 Get 1', merchant: 'Myntra', description: 'Buy 2 get 1 free on selected brands' },
  { id: 'mo_005', name: 'BookMyShow - BOGO', merchant: 'BookMyShow', description: 'Buy 1 get 1 free on movie tickets' },
  { id: 'mo_006', name: 'Zomato - Free Delivery', merchant: 'Zomato', description: 'Free delivery on all orders for 30 days' },
  { id: 'mo_007', name: 'MakeMyTrip - Rs 1000 Off', merchant: 'MakeMyTrip', description: 'Rs 1000 off on domestic flights above Rs 5000' },
  { id: 'mo_008', name: 'Uber - 3 Free Rides', merchant: 'Uber', description: '3 free rides up to Rs 150 each' },
];

const OPERATORS = [
  { value: 'RANGE', label: 'Between', symbol: '' },
  { value: 'GT', label: 'Greater than', symbol: '>' },
  { value: 'GTE', label: 'Greater than or equal', symbol: '>=' },
  { value: 'LT', label: 'Less than', symbol: '<' },
  { value: 'LTE', label: 'Less than or equal', symbol: '<=' },
  { value: 'E', label: 'Equals', symbol: '=' },
];

const STEPS = [
  { key: 'basic', label: 'Basic Details' },
  { key: 'incentives', label: 'Incentive Definitions' },
  { key: 'review', label: 'Review & Submit' },
];

const OUTCOME_TYPES = [
  {
    key: 'roi',
    label: 'ROI',
    tag: 'EMI',
    subTypes: [
      { key: 'relative', label: 'Relative', description: 'Reduce ROI by a fixed amount', inputLabel: 'Current ROI minus', inputSuffix: '%' },
      { key: 'absolute', label: 'Absolute', description: 'Set ROI to a fixed value', inputLabel: 'Offer ROI =', inputSuffix: '%' },
    ],
  },
  {
    key: 'pf',
    label: 'Processing Fee',
    tag: 'EMI',
    subTypes: [
      { key: 'flat', label: 'Flat', description: 'Set PF to a flat amount', inputLabel: 'Offer PF = Rs', inputSuffix: '' },
      { key: 'relative', label: 'Relative', description: 'Reduce PF by a fixed amount', inputLabel: 'Current PF minus Rs', inputSuffix: '' },
    ],
  },
  {
    key: 'proc_charge',
    label: 'Processing Charge',
    tag: 'Plan Change',
    subTypes: [
      { key: 'flat', label: 'Flat', description: 'Set charge to a flat amount', inputLabel: 'Offer Charge = Rs', inputSuffix: '' },
      { key: 'relative', label: 'Relative', description: 'Reduce charge by a fixed amount', inputLabel: 'Current Charge minus Rs', inputSuffix: '' },
    ],
  },
  {
    key: 'merchant_offer',
    label: 'Merchant Offer',
    tag: 'All Journeys',
    description: 'Select merchant offers to display on PWA. Promo code is revealed after journey completion.',
    inputType: 'merchant_offer_picker',
  },
  {
    key: 'smart_tag',
    label: 'Attach Smart Tag',
    tag: 'All Journeys',
    description: 'Tag eligible customers with a smart tag for downstream use',
    inputType: 'smart_tag_picker',
  },
];

const AVAILABLE_CRITERIA = [
  { key: 'journeyStatus', label: 'Journey Status' },
  { key: 'smartTags', label: 'Smart Tags' },
  { key: 'propensity', label: 'Propensity' },
  { key: 'decile', label: 'Decile' },
  { key: 'currentRoi', label: 'Current ROI' },
];

const NUMERIC_CRITERIA = {
  propensity: { label: 'Propensity', unit: '' },
  decile: { label: 'Decile', unit: '' },
  currentRoi: { label: 'Current ROI', unit: '%' },
};

const makeNumericState = () => ({ operator: 'RANGE', value: '', valueMin: '', valueMax: '' });

const makeOutcome = () => ({ type: '', subType: '', value: '', smartTags: [], merchantOffers: [] });

const makeEventRule = () => ({ eventType: '', eventTarget: '', frequency: null, timeWindow: null });

let nextDefId = 1;
const makeOfferDefinition = () => {
  const id = `od_${nextDefId++}`;
  return {
    id,
    name: '',
    collapsed: false,
    journeyStatus: [],
    criteria: [],
    propensity: makeNumericState(),
    decile: makeNumericState(),
    currentRoi: { ...makeNumericState(), operator: 'GT' },
    smartTags: [],
    events: [],
    outcomes: [makeOutcome()],
  };
};

// --- Numeric filter block ---
function NumericFilterBlock({ label, unit, state, onChange, onRemove }) {
  const isRange = state.operator === 'RANGE';

  return (
    <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8, marginBottom: 10, border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</span>
        <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }} title="Remove">
          <X size={15} />
        </button>
      </div>

      <div className="inline-group">
        <select
          className="form-input"
          value={state.operator}
          onChange={e => onChange({ ...state, operator: e.target.value, value: '', valueMin: '', valueMax: '' })}
          style={{ width: 'auto', minWidth: 160 }}
        >
          {OPERATORS.map(op => (
            <option key={op.value} value={op.value}>{op.symbol ? `${op.symbol}  ` : ''}{op.label}</option>
          ))}
        </select>

        {isRange ? (
          <>
            <input type="number" className="form-input" placeholder="Min" value={state.valueMin} onChange={e => onChange({ ...state, valueMin: e.target.value })} style={{ width: 90 }} />
            <span>and</span>
            <input type="number" className="form-input" placeholder="Max" value={state.valueMax} onChange={e => onChange({ ...state, valueMax: e.target.value })} style={{ width: 90 }} />
          </>
        ) : (
          <input type="number" className="form-input" placeholder="Value" value={state.value} onChange={e => onChange({ ...state, value: e.target.value })} style={{ width: 90 }} />
        )}
        {unit && <span>{unit}</span>}
      </div>
    </div>
  );
}

// --- Smart tag picker ---
function SmartTagPicker({ selectedTags, onAdd, onRemove, placeholder }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTags = AVAILABLE_SMART_TAGS.filter(
    t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) && !selectedTags.includes(t.id)
  );

  return (
    <div>
      {selectedTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {selectedTags.map(tagId => {
            const tag = AVAILABLE_SMART_TAGS.find(t => t.id === tagId);
            if (!tag) return null;
            return (
              <span key={tagId} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 6,
                background: '#eff6ff', border: '1px solid #bfdbfe',
                fontSize: 13, color: '#1d4ed8',
              }}>
                {tag.name}
                <span style={{ fontSize: 11, color: '#6b7280' }}>({tag.count.toLocaleString()})</span>
                <button onClick={() => onRemove(tagId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93c5fd', padding: 0, display: 'flex' }}>
                  <X size={13} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div ref={wrapperRef} style={{ position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            className="form-input"
            placeholder={placeholder || 'Search smart tags...'}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setDropdownOpen(true); }}
            onFocus={() => setDropdownOpen(true)}
            style={{ width: '100%', paddingLeft: 32 }}
          />
        </div>
        {dropdownOpen && filteredTags.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
            background: 'white', border: '1px solid #e5e7eb', borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)', zIndex: 10,
            maxHeight: 200, overflowY: 'auto',
          }}>
            {filteredTags.map(tag => (
              <div
                key={tag.id}
                onClick={() => { onAdd(tag.id); setDropdownOpen(false); setSearchQuery(''); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                  borderBottom: '1px solid #f3f4f6',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag size={13} style={{ color: '#9ca3af' }} />
                  <span style={{ color: '#111827' }}>{tag.name}</span>
                </div>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>{tag.count.toLocaleString()} users</span>
              </div>
            ))}
          </div>
        )}
        {dropdownOpen && searchQuery && filteredTags.length === 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
            background: 'white', border: '1px solid #e5e7eb', borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '16px 12px',
            textAlign: 'center', fontSize: 13, color: '#9ca3af',
          }}>
            No matching smart tags found.
          </div>
        )}
      </div>

      {selectedTags.length === 0 && (
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
          Select one or more smart tags.
        </div>
      )}
    </div>
  );
}

// --- Merchant offer picker ---
function MerchantOfferPicker({ selectedOffers, onAdd, onRemove }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOffers = AVAILABLE_MERCHANT_OFFERS.filter(
    o => (o.name.toLowerCase().includes(searchQuery.toLowerCase()) || o.merchant.toLowerCase().includes(searchQuery.toLowerCase())) && !selectedOffers.includes(o.id)
  );

  return (
    <div>
      {selectedOffers.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {selectedOffers.map(offerId => {
            const offer = AVAILABLE_MERCHANT_OFFERS.find(o => o.id === offerId);
            if (!offer) return null;
            return (
              <div key={offerId} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderRadius: 6,
                background: '#faf5ff', border: '1px solid #e9d5ff',
                fontSize: 13,
              }}>
                <div>
                  <div style={{ fontWeight: 500, color: '#7c3aed' }}>{offer.name}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{offer.description}</div>
                </div>
                <button onClick={() => onRemove(offerId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c4b5fd', padding: 0, display: 'flex', flexShrink: 0, marginLeft: 8 }}>
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div ref={wrapperRef} style={{ position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search merchant offers..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setDropdownOpen(true); }}
            onFocus={() => setDropdownOpen(true)}
            style={{ width: '100%', paddingLeft: 32 }}
          />
        </div>
        {dropdownOpen && filteredOffers.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
            background: 'white', border: '1px solid #e5e7eb', borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)', zIndex: 10,
            maxHeight: 240, overflowY: 'auto',
          }}>
            {filteredOffers.map(offer => (
              <div
                key={offer.id}
                onClick={() => { onAdd(offer.id); setSearchQuery(''); }}
                style={{
                  padding: '10px 12px', cursor: 'pointer', fontSize: 13,
                  borderBottom: '1px solid #f3f4f6',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShoppingBag size={13} style={{ color: '#9ca3af', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 500, color: '#111827' }}>{offer.name}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{offer.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {dropdownOpen && searchQuery && filteredOffers.length === 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
            background: 'white', border: '1px solid #e5e7eb', borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '16px 12px',
            textAlign: 'center', fontSize: 13, color: '#9ca3af',
          }}>
            No matching merchant offers found.
          </div>
        )}
      </div>

      {selectedOffers.length === 0 && (
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
          Select one or more merchant offers. Promo codes will be revealed after journey completion.
        </div>
      )}
    </div>
  );
}

// --- Smart tag eligibility criteria ---
function SmartTagCriteria({ selectedTags, onAdd, onRemove, onRemoveCriteria }) {
  return (
    <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8, marginBottom: 10, border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Tag size={14} style={{ color: '#6b7280' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Smart Tags</span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>User cohorts</span>
        </div>
        <button onClick={onRemoveCriteria} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }} title="Remove">
          <X size={15} />
        </button>
      </div>
      <SmartTagPicker selectedTags={selectedTags} onAdd={onAdd} onRemove={onRemove} placeholder="Search smart tags..." />
    </div>
  );
}

// --- Event target picker (searchable single-select) ---
function EventTargetPicker({ value, onChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setIsSearching(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTargets = EVENT_TARGETS.filter(
    t => t.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flex: 1 }}>
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
        <input
          type="text"
          className="form-input"
          placeholder="Search event target..."
          value={isSearching ? searchQuery : (value || '')}
          onChange={(e) => { setSearchQuery(e.target.value); setIsSearching(true); setDropdownOpen(true); }}
          onFocus={() => { setIsSearching(true); setSearchQuery(''); setDropdownOpen(true); }}
          style={{ width: '100%', paddingLeft: 32 }}
        />
      </div>
      {dropdownOpen && filteredTargets.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: 'white', border: '1px solid #e5e7eb', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)', zIndex: 10,
          maxHeight: 200, overflowY: 'auto',
        }}>
          {filteredTargets.map(target => (
            <div
              key={target}
              onClick={() => { onChange(target); setDropdownOpen(false); setSearchQuery(''); setIsSearching(false); }}
              style={{
                padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                borderBottom: '1px solid #f3f4f6',
                background: target === value ? '#f0f9ff' : 'white',
                color: '#111827',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = target === value ? '#f0f9ff' : 'white'}
            >
              {target}
            </div>
          ))}
        </div>
      )}
      {dropdownOpen && searchQuery && filteredTargets.length === 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: 'white', border: '1px solid #e5e7eb', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '16px 12px',
          textAlign: 'center', fontSize: 13, color: '#9ca3af',
        }}>
          No matching targets found.
        </div>
      )}
    </div>
  );
}

// --- Event rule card ---
function EventRuleCard({ rule, index, errors, defId, onUpdate, onRemove }) {
  const hasFrequency = rule.frequency !== null;
  const hasTimeWindow = rule.timeWindow !== null;

  return (
    <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8, marginBottom: 10, border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Event Rule {index + 1}</span>
        <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }} title="Remove">
          <X size={15} />
        </button>
      </div>

      {/* Row 1: Event Type + Target */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
        <select
          className={`form-input ${errors[`def_${defId}_evt_${index}_type`] ? 'error' : ''}`}
          value={rule.eventType}
          onChange={e => onUpdate({ ...rule, eventType: e.target.value })}
          style={{ width: 'auto', minWidth: 140 }}
        >
          <option value="">Event type...</option>
          {EVENT_TYPES.map(et => (
            <option key={et.value} value={et.value}>{et.label}</option>
          ))}
        </select>
        <span style={{ fontSize: 13, color: '#6b7280' }}>on</span>
        <EventTargetPicker
          value={rule.eventTarget}
          onChange={target => onUpdate({ ...rule, eventTarget: target })}
        />
      </div>
      {errors[`def_${defId}_evt_${index}_type`] && (
        <span className="form-error" style={{ display: 'block', marginBottom: 6 }}>{errors[`def_${defId}_evt_${index}_type`]}</span>
      )}
      {errors[`def_${defId}_evt_${index}_target`] && (
        <span className="form-error" style={{ display: 'block', marginBottom: 6 }}>{errors[`def_${defId}_evt_${index}_target`]}</span>
      )}

      {/* Optional Row 2: Frequency */}
      {hasFrequency && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <select
            className="form-input"
            value={rule.frequency.operator}
            onChange={e => onUpdate({ ...rule, frequency: { ...rule.frequency, operator: e.target.value } })}
            style={{ width: 'auto', minWidth: 80 }}
          >
            {FREQUENCY_OPERATORS.map(op => (
              <option key={op.value} value={op.value}>{op.symbol}</option>
            ))}
          </select>
          <input
            type="number"
            className={`form-input ${errors[`def_${defId}_evt_${index}_freqVal`] ? 'error' : ''}`}
            placeholder="N"
            value={rule.frequency.value}
            onChange={e => onUpdate({ ...rule, frequency: { ...rule.frequency, value: e.target.value } })}
            style={{ width: 70 }}
            min="1"
          />
          <span style={{ fontSize: 13, color: '#6b7280' }}>times</span>
          <button
            onClick={() => onUpdate({ ...rule, frequency: null })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}
            title="Remove frequency"
          >
            <X size={13} />
          </button>
        </div>
      )}
      {hasFrequency && errors[`def_${defId}_evt_${index}_freqVal`] && (
        <span className="form-error" style={{ display: 'block', marginBottom: 6 }}>{errors[`def_${defId}_evt_${index}_freqVal`]}</span>
      )}

      {/* Optional Row 3: Time Window */}
      {hasTimeWindow && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: '#6b7280' }}>within last</span>
          <input
            type="number"
            className={`form-input ${errors[`def_${defId}_evt_${index}_twVal`] ? 'error' : ''}`}
            placeholder="N"
            value={rule.timeWindow.value}
            onChange={e => onUpdate({ ...rule, timeWindow: { ...rule.timeWindow, value: e.target.value } })}
            style={{ width: 70 }}
            min="1"
          />
          <select
            className="form-input"
            value={rule.timeWindow.unit}
            onChange={e => onUpdate({ ...rule, timeWindow: { ...rule.timeWindow, unit: e.target.value } })}
            style={{ width: 'auto', minWidth: 80 }}
          >
            {TIME_WINDOW_UNITS.map(u => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
          <button
            onClick={() => onUpdate({ ...rule, timeWindow: null })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}
            title="Remove time window"
          >
            <X size={13} />
          </button>
        </div>
      )}
      {hasTimeWindow && errors[`def_${defId}_evt_${index}_twVal`] && (
        <span className="form-error" style={{ display: 'block', marginBottom: 6 }}>{errors[`def_${defId}_evt_${index}_twVal`]}</span>
      )}

      {/* Toggle buttons for optional rows */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        {!hasFrequency && (
          <button
            onClick={() => onUpdate({ ...rule, frequency: { operator: 'GTE', value: '' } })}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 4,
              border: '1px dashed #d1d5db', background: 'white',
              fontSize: 12, color: '#6b7280', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#6b7280'; }}
          >
            <Plus size={11} /> Frequency
          </button>
        )}
        {!hasTimeWindow && (
          <button
            onClick={() => onUpdate({ ...rule, timeWindow: { value: '', unit: 'days' } })}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 4,
              border: '1px dashed #d1d5db', background: 'white',
              fontSize: 12, color: '#6b7280', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#6b7280'; }}
          >
            <Plus size={11} /> Time Window
          </button>
        )}
      </div>
    </div>
  );
}

// --- Summarize helpers ---
function summarizeNumericFilter(label, state, unit) {
  const op = OPERATORS.find(o => o.value === state.operator);
  if (state.operator === 'RANGE') {
    return `${label} between ${state.valueMin || '?'} and ${state.valueMax || '?'}${unit ? ' ' + unit : ''}`;
  }
  return `${label} ${op?.symbol || ''} ${state.value || '?'}${unit ? ' ' + unit : ''}`;
}

function getOutcomeDisplayLabel(outcome) {
  const parentType = OUTCOME_TYPES.find(o => o.key === outcome.type);
  if (!parentType) return null;
  if (parentType.subTypes) {
    const sub = parentType.subTypes.find(s => s.key === outcome.subType);
    return sub ? `${parentType.label} (${sub.label})` : parentType.label;
  }
  return parentType.label;
}

function summarizeSingleOutcome(outcome) {
  const parentType = OUTCOME_TYPES.find(o => o.key === outcome.type);
  if (!parentType) return 'Not configured';

  if (parentType.inputType === 'smart_tag_picker') {
    const tagNames = outcome.smartTags.map(id => AVAILABLE_SMART_TAGS.find(t => t.id === id)?.name || id);
    return `Attach Smart Tag: ${tagNames.join(', ') || 'None selected'}`;
  }

  if (parentType.inputType === 'merchant_offer_picker') {
    const offerNames = outcome.merchantOffers.map(id => AVAILABLE_MERCHANT_OFFERS.find(o => o.id === id)?.name || id);
    return `Merchant Offer: ${offerNames.join(', ') || 'None selected'}`;
  }

  if (parentType.subTypes) {
    const sub = parentType.subTypes.find(s => s.key === outcome.subType);
    if (!sub) return `${parentType.label}: Not configured`;
    return `${parentType.label} (${sub.label}): ${sub.inputLabel} ${outcome.value || '?'}${sub.inputSuffix ? ' ' + sub.inputSuffix : ''}`;
  }

  return parentType.label;
}

function summarizeCriteria(def) {
  const parts = [];
  for (const key of def.criteria) {
    if (key === 'journeyStatus') {
      if (def.journeyStatus.length > 0) {
        parts.push(`Journey Status = ${def.journeyStatus.join(', ')}`);
      }
      continue;
    }
    if (key === 'smartTags') {
      const tags = def.smartTags;
      if (tags.length > 0) {
        const names = tags.map(id => AVAILABLE_SMART_TAGS.find(t => t.id === id)?.name || id);
        parts.push(`Smart Tags: ${names.join(', ')}`);
      }
      continue;
    }
    const config = NUMERIC_CRITERIA[key];
    if (config) {
      parts.push(summarizeNumericFilter(config.label, def[key], config.unit));
    }
  }
  return parts;
}

function summarizeEvents(def) {
  return def.events.map(rule => {
    const typeLabel = EVENT_TYPES.find(t => t.value === rule.eventType)?.label || rule.eventType;
    let str = `${typeLabel} on "${rule.eventTarget || '?'}"`;
    if (rule.frequency) {
      const opSym = FREQUENCY_OPERATORS.find(o => o.value === rule.frequency.operator)?.symbol || rule.frequency.operator;
      str += ` ${opSym} ${rule.frequency.value || '?'} times`;
    }
    if (rule.timeWindow) {
      str += ` within last ${rule.timeWindow.value || '?'} ${rule.timeWindow.unit || 'days'}`;
    }
    return str;
  });
}

// =============================================================================

export default function CreateOfferBatch() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [offerDefinitions, setOfferDefinitions] = useState([makeOfferDefinition()]);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  // --- Offer definition helpers ---
  const updateDef = (defId, updater) => {
    setOfferDefinitions(defs => defs.map(d => d.id === defId ? (typeof updater === 'function' ? updater(d) : { ...d, ...updater }) : d));
  };

  const removeDef = (defId) => {
    setOfferDefinitions(defs => defs.filter(d => d.id !== defId));
  };

  const addDef = () => {
    setOfferDefinitions(defs => [...defs, makeOfferDefinition()]);
  };

  const duplicateDef = (defId) => {
    setOfferDefinitions(defs => {
      const source = defs.find(d => d.id === defId);
      if (!source) return defs;
      const newId = `od_${nextDefId++}`;
      const clone = JSON.parse(JSON.stringify(source));
      clone.id = newId;
      clone.name = source.name ? `${source.name} (copy)` : '';
      clone.collapsed = false;
      const idx = defs.findIndex(d => d.id === defId);
      const result = [...defs];
      result.splice(idx + 1, 0, clone);
      return result;
    });
  };

  const addCriteria = (defId, criteriaKey) => {
    updateDef(defId, d => ({ ...d, criteria: [...d.criteria, criteriaKey] }));
  };

  const removeCriteria = (defId, criteriaKey) => {
    updateDef(defId, d => {
      const updated = { ...d, criteria: d.criteria.filter(k => k !== criteriaKey) };
      if (criteriaKey === 'journeyStatus') updated.journeyStatus = [];
      if (criteriaKey === 'smartTags') updated.smartTags = [];
      if (criteriaKey === 'propensity') updated.propensity = makeNumericState();
      if (criteriaKey === 'decile') updated.decile = makeNumericState();
      if (criteriaKey === 'currentRoi') updated.currentRoi = { ...makeNumericState(), operator: 'GT' };
      return updated;
    });
  };

  // --- Outcome helpers ---
  const updateOutcome = (defId, outcomeIdx, updater) => {
    updateDef(defId, d => {
      const newOutcomes = [...d.outcomes];
      newOutcomes[outcomeIdx] = typeof updater === 'function' ? updater(newOutcomes[outcomeIdx]) : { ...newOutcomes[outcomeIdx], ...updater };
      return { ...d, outcomes: newOutcomes };
    });
  };

  const addOutcome = (defId) => {
    updateDef(defId, d => ({ ...d, outcomes: [...d.outcomes, makeOutcome()] }));
  };

  const removeOutcome = (defId, outcomeIdx) => {
    updateDef(defId, d => ({ ...d, outcomes: d.outcomes.filter((_, i) => i !== outcomeIdx) }));
  };

  // --- Event helpers ---
  const addEvent = (defId) => {
    updateDef(defId, d => ({ ...d, events: [...d.events, makeEventRule()] }));
  };

  const removeEvent = (defId, idx) => {
    updateDef(defId, d => ({ ...d, events: d.events.filter((_, i) => i !== idx) }));
  };

  const updateEvent = (defId, idx, updater) => {
    updateDef(defId, d => {
      const newEvents = [...d.events];
      newEvents[idx] = typeof updater === 'function' ? updater(newEvents[idx]) : updater;
      return { ...d, events: newEvents };
    });
  };

  // --- Validation ---
  const validateStep = (stepIdx) => {
    const errs = {};
    if (stepIdx === 0) {
      if (!title.trim()) errs.title = 'Title is required';
      if (title.length > 100) errs.title = 'Title must be under 100 characters';
      if (!startDate) errs.startDate = 'Start date is required';
      if (!endDate) errs.endDate = 'End date is required';
      if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
        errs.endDate = 'End date must be after start date';
      }
    }
    if (stepIdx === 1) {
      if (offerDefinitions.length === 0) {
        errs.offers = 'At least one incentive definition is required.';
      }
      offerDefinitions.forEach((def) => {
        if (!def.name.trim()) errs[`def_${def.id}_name`] = 'Name is required';
        if (def.outcomes.length === 0) {
          errs[`def_${def.id}_outcomes`] = 'At least one outcome is required';
        }
        def.outcomes.forEach((outcome, oi) => {
          if (!outcome.type) errs[`def_${def.id}_oc_${oi}_type`] = 'Outcome type is required';
          const parentType = OUTCOME_TYPES.find(o => o.key === outcome.type);
          if (parentType?.subTypes) {
            if (!outcome.subType) errs[`def_${def.id}_oc_${oi}_subType`] = 'Variant is required';
            if (outcome.subType && (outcome.value === '' || outcome.value === null || outcome.value === undefined)) {
              errs[`def_${def.id}_oc_${oi}_value`] = 'Value is required';
            }
          }
          if (parentType?.inputType === 'smart_tag_picker' && outcome.smartTags.length === 0) {
            errs[`def_${def.id}_oc_${oi}_value`] = 'Select at least one smart tag';
          }
          if (parentType?.inputType === 'merchant_offer_picker' && outcome.merchantOffers.length === 0) {
            errs[`def_${def.id}_oc_${oi}_value`] = 'Select at least one merchant offer';
          }
        });
        // Event rule validation
        def.events.forEach((evt, ei) => {
          if (!evt.eventType) errs[`def_${def.id}_evt_${ei}_type`] = 'Event type is required';
          if (!evt.eventTarget) errs[`def_${def.id}_evt_${ei}_target`] = 'Event target is required';
          if (evt.frequency !== null && (evt.frequency.value === '' || evt.frequency.value === null || evt.frequency.value === undefined)) {
            errs[`def_${def.id}_evt_${ei}_freqVal`] = 'Frequency value is required';
          }
          if (evt.timeWindow !== null && (evt.timeWindow.value === '' || evt.timeWindow.value === null || evt.timeWindow.value === undefined)) {
            errs[`def_${def.id}_evt_${ei}_twVal`] = 'Time window value is required';
          }
        });
      });
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };
  const goBack = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = () => {
    setToast('Campaign created successfully!');
    setTimeout(() => navigate('/'), 1500);
  };

  // --- Render eligibility criteria block ---
  const renderCriteriaBlock = (def, criteriaKey) => {
    if (criteriaKey === 'journeyStatus') {
      return (
        <div key={criteriaKey} style={{ padding: 16, background: '#f9fafb', borderRadius: 8, marginBottom: 10, border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Journey Status</span>
            <button onClick={() => removeCriteria(def.id, 'journeyStatus')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }} title="Remove">
              <X size={15} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['NOT_STARTED', 'IN_PROGRESS'].map(status => {
              const selected = def.journeyStatus.includes(status);
              return (
                <button
                  key={status}
                  onClick={() => {
                    updateDef(def.id, d => {
                      const current = d.journeyStatus;
                      if (selected) {
                        return { ...d, journeyStatus: current.filter(s => s !== status) };
                      }
                      return { ...d, journeyStatus: [...current, status] };
                    });
                  }}
                  style={{
                    padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                    fontFamily: 'monospace', cursor: 'pointer', transition: 'all 0.15s',
                    border: selected ? '1.5px solid #059669' : '1px solid #d1d5db',
                    background: selected ? '#ecfdf5' : 'white',
                    color: selected ? '#059669' : '#6b7280',
                  }}
                >
                  {selected && <Check size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />}
                  {status}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
            Select one or both statuses.
          </div>
        </div>
      );
    }

    if (criteriaKey === 'smartTags') {
      return (
        <SmartTagCriteria
          key={criteriaKey}
          selectedTags={def.smartTags}
          onAdd={(tagId) => updateDef(def.id, d => ({ ...d, smartTags: [...d.smartTags, tagId] }))}
          onRemove={(tagId) => updateDef(def.id, d => ({ ...d, smartTags: d.smartTags.filter(id => id !== tagId) }))}
          onRemoveCriteria={() => removeCriteria(def.id, 'smartTags')}
        />
      );
    }

    const config = NUMERIC_CRITERIA[criteriaKey];
    if (!config) return null;

    return (
      <NumericFilterBlock
        key={criteriaKey}
        label={config.label}
        unit={config.unit}
        state={def[criteriaKey]}
        onChange={(newState) => updateDef(def.id, { [criteriaKey]: newState })}
        onRemove={() => removeCriteria(def.id, criteriaKey)}
      />
    );
  };

  // --- Render single outcome block ---
  const renderOutcomeBlock = (def, outcome, outcomeIdx) => {
    const usedTypes = def.outcomes.map(o => o.type).filter(t => t && t !== outcome.type);
    const availableTypes = OUTCOME_TYPES.filter(ot => !usedTypes.includes(ot.key));
    const selectedParent = OUTCOME_TYPES.find(o => o.key === outcome.type);
    const selectedSub = selectedParent?.subTypes?.find(s => s.key === outcome.subType);

    return (
      <div key={outcomeIdx} style={{ padding: 16, background: '#f9fafb', borderRadius: 8, marginBottom: 10, border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Outcome {def.outcomes.length > 1 ? outcomeIdx + 1 : ''}</span>
          {def.outcomes.length > 1 && (
            <button onClick={() => removeOutcome(def.id, outcomeIdx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }} title="Remove outcome">
              <X size={15} />
            </button>
          )}
        </div>

        {/* Parent type dropdown */}
        <div className="form-group" style={{ marginBottom: 12 }}>
          <select
            className={`form-input ${errors[`def_${def.id}_oc_${outcomeIdx}_type`] ? 'error' : ''}`}
            value={outcome.type}
            onChange={e => {
              const newType = e.target.value;
              const parent = OUTCOME_TYPES.find(o => o.key === newType);
              const defaultSubType = parent?.subTypes?.[0]?.key || '';
              updateOutcome(def.id, outcomeIdx, { type: newType, subType: defaultSubType, value: '', smartTags: [], merchantOffers: [] });
            }}
            style={{ maxWidth: 340 }}
          >
            <option value="">Select outcome type...</option>
            {availableTypes.map(ot => (
              <option key={ot.key} value={ot.key}>{ot.label}{ot.tag ? ` (${ot.tag})` : ''}</option>
            ))}
          </select>
          {errors[`def_${def.id}_oc_${outcomeIdx}_type`] && (
            <span className="form-error">{errors[`def_${def.id}_oc_${outcomeIdx}_type`]}</span>
          )}
        </div>

        {/* Sub-type dropdown for types with variants */}
        {selectedParent?.subTypes && (
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label" style={{ fontSize: 12 }}>Variant</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {selectedParent.subTypes.map(st => (
                <button
                  key={st.key}
                  onClick={() => updateOutcome(def.id, outcomeIdx, { subType: st.key, value: '' })}
                  style={{
                    padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.15s',
                    border: outcome.subType === st.key ? '1.5px solid #2563eb' : '1px solid #d1d5db',
                    background: outcome.subType === st.key ? '#eff6ff' : 'white',
                    color: outcome.subType === st.key ? '#2563eb' : '#374151',
                  }}
                >
                  {st.label}
                </button>
              ))}
            </div>
            {selectedSub && (
              <span className="form-hint">{selectedSub.description}</span>
            )}
            {errors[`def_${def.id}_oc_${outcomeIdx}_subType`] && (
              <span className="form-error">{errors[`def_${def.id}_oc_${outcomeIdx}_subType`]}</span>
            )}
          </div>
        )}

        {/* Numeric input for sub-type */}
        {selectedSub && (
          <div className="inline-group" style={{ maxWidth: 340 }}>
            <span>{selectedSub.inputLabel}</span>
            <input
              type="number"
              className={`form-input ${errors[`def_${def.id}_oc_${outcomeIdx}_value`] ? 'error' : ''}`}
              placeholder="e.g. 1"
              value={outcome.value}
              onChange={e => updateOutcome(def.id, outcomeIdx, { value: e.target.value })}
              style={{ width: 100 }}
            />
            {selectedSub.inputSuffix && <span>{selectedSub.inputSuffix}</span>}
          </div>
        )}

        {/* Smart tag picker */}
        {selectedParent?.inputType === 'smart_tag_picker' && (
          <div style={{ maxWidth: 400 }}>
            <SmartTagPicker
              selectedTags={outcome.smartTags}
              onAdd={(tagId) => updateOutcome(def.id, outcomeIdx, o => ({ ...o, smartTags: [...o.smartTags, tagId] }))}
              onRemove={(tagId) => updateOutcome(def.id, outcomeIdx, o => ({ ...o, smartTags: o.smartTags.filter(id => id !== tagId) }))}
              placeholder="Search tags to attach..."
            />
          </div>
        )}

        {/* Merchant offer picker */}
        {selectedParent?.inputType === 'merchant_offer_picker' && (
          <div style={{ maxWidth: 480 }}>
            <MerchantOfferPicker
              selectedOffers={outcome.merchantOffers}
              onAdd={(offerId) => updateOutcome(def.id, outcomeIdx, o => ({ ...o, merchantOffers: [...o.merchantOffers, offerId] }))}
              onRemove={(offerId) => updateOutcome(def.id, outcomeIdx, o => ({ ...o, merchantOffers: o.merchantOffers.filter(id => id !== offerId) }))}
            />
            <div className="alert alert-info" style={{ marginTop: 10, fontSize: 12 }}>
              <Info size={14} style={{ flexShrink: 0 }} />
              Selected offers will be displayed on the PWA with a disabled "Reveal Promo Code" button. The button is enabled once the customer completes the journey.
            </div>
          </div>
        )}

        {errors[`def_${def.id}_oc_${outcomeIdx}_value`] && !selectedSub && (
          <span className="form-error" style={{ display: 'block', marginTop: 6 }}>{errors[`def_${def.id}_oc_${outcomeIdx}_value`]}</span>
        )}
      </div>
    );
  };

  // --- Render single incentive definition card ---
  const renderOfferDefinitionCard = (def, index) => {
    const unusedCriteria = AVAILABLE_CRITERIA.filter(c => !def.criteria.includes(c.key));
    const usedOutcomeTypes = def.outcomes.map(o => o.type).filter(Boolean);
    const canAddOutcome = usedOutcomeTypes.length < OUTCOME_TYPES.length;

    return (
      <div key={def.id} className="form-section" style={{ position: 'relative' }}>
        {/* Card header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: def.collapsed ? 0 : 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, cursor: 'pointer' }} onClick={() => updateDef(def.id, { collapsed: !def.collapsed })}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', background: '#f3f4f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600, color: '#6b7280',
            }}>
              {index + 1}
            </div>
            <div>
              <div className="form-section-title" style={{ marginBottom: 0 }}>
                {def.name || `Incentive Definition ${index + 1}`}
              </div>
              {def.collapsed && def.outcomes.some(o => o.type) && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                  {def.outcomes.filter(o => o.type).map((o, i) => (
                    <span key={i} style={{ fontSize: 11, padding: '1px 6px', borderRadius: 3, background: '#f3f4f6', color: '#6b7280' }}>
                      {getOutcomeDisplayLabel(o) || o.type}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ marginLeft: 'auto', color: '#9ca3af', transition: 'transform 0.2s', transform: def.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
              <ChevronDown size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 8 }}>
            <button
              onClick={() => duplicateDef(def.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}
              title="Duplicate definition"
              onMouseEnter={e => e.currentTarget.style.color = '#2563eb'}
              onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
            >
              <Copy size={15} />
            </button>
            {offerDefinitions.length > 1 && (
              <button
                onClick={() => removeDef(def.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}
                title="Remove definition"
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {!def.collapsed && (
          <>
            {/* Name */}
            <div className="form-group">
              <label className="form-label">Definition Name <span className="required">*</span></label>
              <input
                type="text"
                className={`form-input ${errors[`def_${def.id}_name`] ? 'error' : ''}`}
                placeholder="e.g., ROI Reduction, PF Waiver, Merchant Reward"
                value={def.name}
                onChange={e => updateDef(def.id, { name: e.target.value })}
                maxLength={60}
              />
              {errors[`def_${def.id}_name`] && <span className="form-error">{errors[`def_${def.id}_name`]}</span>}
            </div>

            {/* Eligibility */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Eligibility Criteria</div>

              {/* Customer Attributes subsection */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>Customer Attributes</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>Filter by customer properties like status, tags, and scores.</div>

                {def.criteria.map(key => renderCriteriaBlock(def, key))}

                {unusedCriteria.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>Add criteria:</span>
                    {unusedCriteria.map(c => (
                      <button
                        key={c.key}
                        onClick={() => addCriteria(def.id, c.key)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '5px 12px', borderRadius: 20,
                          border: '1px dashed #d1d5db', background: 'white',
                          fontSize: 13, color: '#374151', cursor: 'pointer',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#374151'; }}
                      >
                        <Plus size={13} /> {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Activity subsection */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>Customer Activity</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>Target customers based on events they have performed.</div>

                {def.events.map((rule, ei) => (
                  <EventRuleCard
                    key={ei}
                    rule={rule}
                    index={ei}
                    errors={errors}
                    defId={def.id}
                    onUpdate={(updated) => updateEvent(def.id, ei, updated)}
                    onRemove={() => removeEvent(def.id, ei)}
                  />
                ))}

                <button
                  onClick={() => addEvent(def.id)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '5px 12px', borderRadius: 20,
                    border: '1px dashed #d1d5db', background: 'white',
                    fontSize: 13, color: '#374151', cursor: 'pointer',
                    marginTop: def.events.length > 0 ? 4 : 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#374151'; }}
                >
                  <Plus size={13} /> Add Event
                </button>
              </div>
            </div>

            {/* Outcomes */}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                  Outcome Definitions ({def.outcomes.length})
                </div>
              </div>

              {errors[`def_${def.id}_outcomes`] && (
                <span className="form-error" style={{ display: 'block', marginBottom: 8 }}>{errors[`def_${def.id}_outcomes`]}</span>
              )}

              {def.outcomes.map((outcome, oi) => renderOutcomeBlock(def, outcome, oi))}

              {canAddOutcome && (
                <button
                  onClick={() => addOutcome(def.id)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '5px 12px', borderRadius: 20,
                    border: '1px dashed #d1d5db', background: 'white',
                    fontSize: 13, color: '#374151', cursor: 'pointer',
                    marginTop: 4,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#374151'; }}
                >
                  <Plus size={13} /> Add Outcome
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  // =========================================================================

  return (
    <div className="page-container">
      <Breadcrumb items={[
        { label: 'Journeys', to: '/' },
        { label: 'Credit Limit Increase - Jun 25', to: '/' },
        { label: 'Create Campaign' },
      ]} />

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Create Campaign</h1>
          <p className="page-description">Create a new campaign under {baseBatch.title}</p>
        </div>
      </div>

      {/* Vertical stepper + content layout */}
      <div style={{ display: 'flex', gap: 28, marginTop: 24 }}>

      {/* Vertical Stepper sidebar */}
      <div style={{ width: 220, flexShrink: 0 }}>
        <div style={{ position: 'sticky', top: 24, padding: '20px 0' }}>
          {STEPS.map((s, i) => (
            <div key={s.key} style={{ display: 'flex', gap: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28 }}>
                <div
                  onClick={() => { if (i < step) setStep(i); }}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 600,
                    background: i < step ? '#059669' : i === step ? '#111827' : '#e5e7eb',
                    color: i <= step ? 'white' : '#9ca3af',
                    cursor: i < step ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                  }}
                >
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 2, flex: 1, minHeight: 32, background: i < step ? '#059669' : '#e5e7eb', transition: 'background 0.2s' }} />
                )}
              </div>
              <div
                onClick={() => { if (i < step) setStep(i); }}
                style={{ paddingLeft: 12, paddingBottom: i < STEPS.length - 1 ? 24 : 0, cursor: i < step ? 'pointer' : 'default' }}
              >
                <div style={{
                  fontSize: 13, fontWeight: i === step ? 600 : 400, lineHeight: '28px',
                  color: i === step ? '#111827' : i < step ? '#059669' : '#9ca3af',
                }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, minWidth: 0 }}>

      {/* Step 0: Basic Details */}
      {step === 0 && (
        <div className="form-section">
          <div className="form-section-title">Basic Details</div>
          <div className="form-section-subtitle">Configure the campaign name, description, and duration.</div>

          <div className="form-group">
            <label className="form-label">Title <span className="required">*</span></label>
            <input type="text" className={`form-input ${errors.title ? 'error' : ''}`} placeholder="e.g., June ROI Reduction Incentive" value={title} onChange={e => setTitle(e.target.value)} maxLength={100} />
            <span className="form-hint">{title.length}/100 characters</span>
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="Describe the purpose of this campaign..." value={description} onChange={e => setDescription(e.target.value)} maxLength={500} />
            <span className="form-hint">{description.length}/500 characters</span>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Start Date & Time <span className="required">*</span></label>
              <input type="datetime-local" className={`form-input ${errors.startDate ? 'error' : ''}`} value={startDate} onChange={e => setStartDate(e.target.value)} />
              {errors.startDate && <span className="form-error">{errors.startDate}</span>}
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">End Date & Time <span className="required">*</span></label>
              <input type="datetime-local" className={`form-input ${errors.endDate ? 'error' : ''}`} value={endDate} onChange={e => setEndDate(e.target.value)} />
              {errors.endDate && <span className="form-error">{errors.endDate}</span>}
            </div>
          </div>

          <div className="alert alert-info" style={{ marginTop: 16 }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            Duration must be within the base batch duration: {baseBatch.startDate} to {baseBatch.endDate}
          </div>
        </div>
      )}

      {/* Step 1: Incentive Definitions */}
      {step === 1 && (
        <>
          {errors.offers && (
            <div className="alert alert-warning">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              {errors.offers}
            </div>
          )}

          {offerDefinitions.map((def, index) => renderOfferDefinitionCard(def, index))}

          <button
            onClick={addDef}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '16px 20px', borderRadius: 10,
              border: '2px dashed #d1d5db', background: 'white',
              fontSize: 14, fontWeight: 500, color: '#6b7280', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#6b7280'; }}
          >
            <Plus size={16} /> Add Incentive Definition
          </button>
        </>
      )}

      {/* Step 2: Review & Submit */}
      {step === 2 && (
        <div className="form-section">
          <div className="form-section-title">Review Campaign</div>
          <div className="form-section-subtitle">Verify all details before creating the campaign.</div>

          <div style={{ marginTop: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 12 }}>Basic Details</div>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Title</span>
                <span className="detail-value">{title}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Description</span>
                <span className="detail-value">{description || '\u2014'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Start Date</span>
                <span className="detail-value">{startDate ? new Date(startDate).toLocaleString() : '\u2014'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">End Date</span>
                <span className="detail-value">{endDate ? new Date(endDate).toLocaleString() : '\u2014'}</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
            Incentive Definitions ({offerDefinitions.length})
          </div>

          {offerDefinitions.map((def, index) => (
            <div key={def.id} className="offer-summary">
              <div className="offer-summary-title">
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', background: '#f3f4f6', fontSize: 11, fontWeight: 600, color: '#6b7280', marginRight: 8 }}>
                  {index + 1}
                </span>
                {def.name || `Incentive Definition ${index + 1}`}
              </div>
              {summarizeCriteria(def).length > 0 && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 6 }}>CUSTOMER ATTRIBUTES</div>
                  {summarizeCriteria(def).map((line, i) => (
                    <div key={i} className="offer-summary-row">
                      <span className="offer-summary-value">{line}</span>
                    </div>
                  ))}
                </>
              )}
              {def.events.length > 0 && (
                <>
                  {summarizeCriteria(def).length > 0 && <div style={{ height: 1, background: '#f3f4f6', margin: '6px 0' }} />}
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 6 }}>CUSTOMER ACTIVITY</div>
                  {summarizeEvents(def).map((line, i) => (
                    <div key={i} className="offer-summary-row">
                      <span className="offer-summary-value">{line}</span>
                    </div>
                  ))}
                </>
              )}
              <div style={{ height: 1, background: '#e5e7eb', margin: '8px 0' }} />
              <div style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 6 }}>
                OUTCOMES ({def.outcomes.length})
              </div>
              {def.outcomes.map((outcome, oi) => (
                <div key={oi} className="offer-summary-row">
                  <span className="offer-summary-value">{summarizeSingleOutcome(outcome)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Navigation Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', borderTop: '1px solid #e5e7eb', marginTop: 8 }}>
        <div>
          {step === 0 ? (
            <Link to="/" style={{ textDecoration: 'none' }}>
              <button className="btn btn-secondary"><ArrowLeft size={15} /> Cancel</button>
            </Link>
          ) : (
            <button className="btn btn-secondary" onClick={goBack}><ArrowLeft size={15} /> Back</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={goNext}>
              Continue <ChevronRight size={15} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit}>
              Create Campaign
            </button>
          )}
        </div>
      </div>

      </div>{/* end content area */}
      </div>{/* end flex layout */}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
