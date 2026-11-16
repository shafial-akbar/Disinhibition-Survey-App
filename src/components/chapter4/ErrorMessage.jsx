import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Error banner for database retrieval or schema validation warnings in Chapter 4.
 */
export default function ErrorMessage({ title = 'Unable to load Chapter 4 data', message, onRetry }) {
  if (!message) return null;
  return (
    <div
      className="admin-card"
      style={{
        borderLeft: '4px solid #dc2626',
        background: '#fef2f2',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <AlertTriangle size={18} style={{ color: '#dc2626', marginTop: 2, flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#991b1b' }}>{title}</div>
          <div style={{ fontSize: 12, color: '#7f1d1d', marginTop: 2 }}>{message}</div>
        </div>
      </div>
      {onRetry && (
        <button type="button" className="admin-btn" onClick={onRetry}>
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}
