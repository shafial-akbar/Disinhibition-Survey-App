import React from 'react';
import { Database, RefreshCw } from 'lucide-react';

export default function AdminEmptyState({
  title = 'No data available yet.',
  description = 'Once participants submit questionnaire responses, real-time analytics, tables, and Chapter 4 interpretations will appear here automatically.',
  onRefresh,
}) {
  return (
    <div className="admin-card" style={{ textAlign: 'center', padding: '44px 24px' }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          background: '#eff6ff',
          color: '#1d4ed8',
          display: 'grid',
          placeItems: 'center',
          margin: '0 auto 14px',
        }}
      >
        <Database size={22} />
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
        {title}
      </h3>
      <p style={{ margin: '0 auto 18px', maxWidth: 520, fontSize: 13.5, lineHeight: 1.6, color: '#475569' }}>
        {description}
      </p>
      {onRefresh && (
        <button type="button" className="admin-btn admin-btn-primary" onClick={onRefresh}>
          <RefreshCw size={14} /> Check for New Responses
        </button>
      )}
    </div>
  );
}
