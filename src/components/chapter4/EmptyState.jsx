import React from 'react';
import { FileText, RefreshCw } from 'lucide-react';

/**
 * Empty state notice when public.survey_responses currently has 0 valid responses.
 * Ensures the academic report never fabricates or hardcodes sample statistics.
 */
export default function EmptyState({ retrievedN = 0, excludedN = 0, onRefresh }) {
  return (
    <div
      className="admin-card no-print"
      style={{
        background: '#f8fafc',
        border: '1px dashed #cbd5e1',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <FileText size={20} style={{ color: '#1d4ed8', flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
            Live Database Connected — 0 Valid Participant Responses Currently Recorded (Retrieved: {retrievedN}, Excluded: {excludedN})
          </div>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
            Per academic integrity rules, no statistical values are hardcoded. The Chapter 4 manuscript structure below updates automatically as soon as valid responses are submitted.
          </div>
        </div>
      </div>
      {onRefresh && (
        <button type="button" className="admin-btn" onClick={onRefresh}>
          <RefreshCw size={14} /> Check for New Responses
        </button>
      )}
    </div>
  );
}
