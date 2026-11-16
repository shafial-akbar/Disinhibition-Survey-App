import React from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Loading state indicator for the Chapter 4 Thesis Report page.
 */
export default function LoadingState({ message = 'Retrieving and screening live survey responses...' }) {
  return (
    <div className="admin-card" style={{ padding: 36, textAlign: 'center' }}>
      <RefreshCw size={24} className="spin" style={{ color: '#1d4ed8', marginBottom: 10 }} />
      <h3 style={{ margin: '0 0 6px', fontSize: 16, color: '#0f172a' }}>Loading Chapter 4 Manuscript</h3>
      <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{message}</p>
    </div>
  );
}
