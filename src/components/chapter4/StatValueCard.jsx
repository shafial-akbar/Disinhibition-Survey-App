import React from 'react';

/**
 * Compact statistical metadata card used in the Chapter 4 page header.
 */
export default function StatValueCard({ label, value, subtitle }) {
  return (
    <div className="chapter4-stat-card">
      <span className="chapter4-stat-card-label">{label}</span>
      <span className="chapter4-stat-card-value">{value}</span>
      {subtitle && <span className="chapter4-stat-card-sub">{subtitle}</span>}
    </div>
  );
}
