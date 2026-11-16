import React from 'react';

export default function AdminLoading({ message = 'Loading live research responses from Supabase...' }) {
  return (
    <div className="admin-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
        {message}
      </div>
      <div style={{ fontSize: 12.5, color: '#64748b' }}>
        Computing descriptive, reliability, normality, and correlation statistics...
      </div>
    </div>
  );
}
