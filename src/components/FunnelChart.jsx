import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function FunnelChart({ data }) {
  return (
    <div className="funnel-container">
      <div className="funnel-title">Overall Funnel</div>
      <div className="funnel-subtitle">
        Track conversion rates across stages and identify key areas for improvement.
      </div>
      <div className="funnel-labels">
        {data.map((d, i) => (
          <div key={i} className="funnel-label">{d.name}</div>
        ))}
      </div>
      <div className="funnel-chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="name" hide />
            <YAxis
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              axisLine={false}
              tickLine={false}
              fontSize={12}
              color="#9ca3af"
            />
            <Tooltip
              formatter={(value) => [value.toLocaleString(), 'Customers']}
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={index === 0 ? '#2563eb' : '#93c5fd'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
