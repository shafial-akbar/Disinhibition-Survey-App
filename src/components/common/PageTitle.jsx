import React from 'react';

export default function PageTitle({ title, subtitle, meta, actions }) {
  return (
    <div className="admin-page-head">
      <div>
        <h1 className="admin-page-title">{title}</h1>
        {subtitle && <p className="admin-page-subtitle">{subtitle}</p>}
        {meta && <div className="admin-meta-line" style={{ marginTop: 6 }}>{meta}</div>}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {actions}
        </div>
      )}
    </div>
  );
}
