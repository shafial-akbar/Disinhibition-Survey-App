import React, { useState } from 'react';
import { AlertTriangle, Copy, Check, RefreshCw } from 'lucide-react';
import { ADMIN_READ_RPC_SQL } from '../../services/supabase/responseService';

export default function AdminError({ error, needsAdminSql, onRetry }) {
  const [copied, setCopied] = useState(false);

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(ADMIN_READ_RPC_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="admin-card">
      <div className="admin-banner admin-banner-error" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <strong>Unable to load live survey responses</strong>
          <div style={{ marginTop: 4 }}>{error}</div>
        </div>
        {onRetry && (
          <button type="button" className="admin-btn admin-btn-sm" onClick={onRetry}>
            <RefreshCw size={13} /> Retry
          </button>
        )}
      </div>

      {needsAdminSql && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
              One-Time Supabase Setup Required for Admin Read Access
            </div>
            <button type="button" className="admin-btn admin-btn-sm admin-btn-primary" onClick={handleCopySql}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'SQL Copied' : 'Copy SQL Function'}
            </button>
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 13, color: '#475569', lineHeight: 1.55 }}>
            Because <code>public.survey_responses</code> protects participant anonymity by revoking direct anonymous <code>SELECT</code>, run this SQL once in your Supabase SQL Editor to create the safe <code>admin_get_survey_responses()</code> RPC (which excludes <code>withdrawal_code_hash</code>):
          </p>
          <pre className="admin-code-block">{ADMIN_READ_RPC_SQL}</pre>
        </div>
      )}
    </div>
  );
}
