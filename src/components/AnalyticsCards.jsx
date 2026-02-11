import { Info } from 'lucide-react';

export default function AnalyticsCards({ analytics }) {
  const cards = [
    { label: 'Final Batch Data', value: analytics.finalBatchData.toLocaleString() },
    { label: 'Conversions', value: analytics.conversions.toLocaleString() },
    { label: 'Conversion Rate', value: `${analytics.conversionRate}%` },
    { label: 'Days to Journey End', value: analytics.daysToJourneyEnd },
  ];

  return (
    <div className="analytics-cards">
      {cards.map((card, i) => (
        <div key={i} className="analytics-card">
          <div className="analytics-card-label">
            {card.label} <Info size={13} style={{ color: '#9ca3af' }} />
          </div>
          <div className="analytics-card-value">{card.value}</div>
        </div>
      ))}
    </div>
  );
}
