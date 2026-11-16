import React from 'react';

export default function AdminCard({ title, subtitle, actions, children, className = '' }) {
  return (
    <section className={`admin-card ${className}`}>
      {(title || subtitle || actions) && (
        <div className="admin-card-header">
          <div>
            {title && <h2 className="admin-card-title">{title}</h2>}
            {subtitle && <p className="admin-card-sub">{subtitle}</p>}
          </div>
          {actions && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
