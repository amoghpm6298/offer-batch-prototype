import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Breadcrumb({ items }) {
  return (
    <div className="breadcrumb">
      {items.map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {i > 0 && <ChevronRight size={14} className="separator" />}
          {item.to ? (
            <Link to={item.to}>{item.label}</Link>
          ) : (
            <span className={i === items.length - 1 ? 'current' : ''}>{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
