import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import PageTitle from '../../../components/common/PageTitle';
import AdminCard from '../../../components/admin/AdminCard';
import { ADMIN_READ_RPC_SQL } from '../../../services/supabase/responseService';
import { QUESTIONNAIRE_CONFIG } from '../../../config/questionnaireConfig';
import { formatDateTime } from '../../../utils/formatters/dateFormatter';

export default function AdminSettings({ session, analysis }) {
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
    <>
      <PageTitle
        title="Admin & System Settings"
        subtitle="Session authentication info, Supabase admin read RPC SQL, and active questionnaire schema summary."
      />

      <div className="analysis-grid-2">
        <AdminCard title="Active Admin Session">
          <div style={{ fontSize: 13.5, lineHeight: 1.85, color: '#1e293b' }}>
            <div><strong>Username:</strong> {session?.username || 'admin'}</div>
            <div><strong>Role:</strong> {session?.role || 'research_admin'}</div>
            <div><strong>Auth Mode:</strong> {session?.authMode || 'static-dev'} (isolated in <code>adminAuthService.js</code> for easy upgrade to Supabase Auth later)</div>
            <div><strong>Signed In At:</strong> {formatDateTime(session?.loggedInAt)}</div>
          </div>
        </AdminCard>

        <AdminCard title="Active Questionnaire Instrument">
          <div style={{ fontSize: 13.5, lineHeight: 1.85, color: '#1e293b' }}>
            <div><strong>Version:</strong> {QUESTIONNAIRE_CONFIG.version}</div>
            <div><strong>Active Items:</strong> {QUESTIONNAIRE_CONFIG.totalItemCount} (PCW: 4, PT: 6, WSD: 8)</div>
            <div><strong>Scale Range:</strong> {QUESTIONNAIRE_CONFIG.likertMin}–{QUESTIONNAIRE_CONFIG.likertMax} Likert</div>
            <div><strong>Total Rows Loaded:</strong> {analysis?.cleaning?.totalSubmitted ?? 0}</div>
          </div>
        </AdminCard>
      </div>

      <AdminCard
        title="Supabase Safe Admin Read SQL Function"
        subtitle="Run this migration once in Supabase SQL Editor if RLS blocks reading public.survey_responses. It strictly excludes withdrawal_code_hash."
        actions={
          <button type="button" className="admin-btn admin-btn-sm admin-btn-primary" onClick={handleCopySql}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'SQL Copied' : 'Copy SQL'}
          </button>
        }
      >
        <pre className="admin-code-block">{ADMIN_READ_RPC_SQL}</pre>
      </AdminCard>
    </>
  );
}
