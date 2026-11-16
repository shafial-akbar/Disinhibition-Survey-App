import React from 'react';

export default function AdminStatCard({ label, value, hint, icon: Icon }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-label">
        <span>{label}</span>
        {Icon && <Icon size={15} color="#475569" />}
      </div>
      <div className="admin-stat-value">{value}</div>
      {hint && <div className="admin-stat-hint">{hint}</div>}
    </div>
  );
}
