import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="admin-breadcrumb" aria-label="Breadcrumb">
      {items.map((item, idx) => (
        <React.Fragment key={`${item}-${idx}`}>
          {idx > 0 && <ChevronRight size={14} />}
          {idx === items.length - 1 ? (
            <strong>{item}</strong>
          ) : (
            <span>{item}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
