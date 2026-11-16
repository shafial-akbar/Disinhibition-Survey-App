import React, { useState } from 'react';
import PageTitle from '../../../components/common/PageTitle';
import AdminCard from '../../../components/admin/AdminCard';
import AdminTable from '../../../components/admin/AdminTable';
import AdminEmptyState from '../../../components/admin/AdminEmptyState';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { formatDateTime } from '../../../utils/formatters/dateFormatter';

export default function DataCleaningReport({ analysis, onToggleExclusion, onRefresh }) {
  const { cleaning } = analysis;
  const [dialogTarget, setDialogTarget] = useState(null);
  const [reasonInput, setReasonInput] = useState('');

  const issueColumns = [
    {
      key: 'name',
      label: 'Data Quality Check',
      render: r => (
        <div>
          <strong>{r.name}</strong>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{r.description}</div>
        </div>
      ),
    },
    {
      key: 'affectedCount',
      label: 'Flagged Rows',
      numeric: true,
      render: r => (
        <strong style={{ color: r.affectedCount > 0 ? '#b45309' : '#15803d' }}>
          {r.affectedCount}
        </strong>
      ),
    },
    {
      key: 'affectedIds',
      label: 'Sample IDs',
      render: r =>
        r.affectedIds.length
          ? r.affectedIds.slice(0, 3).map(id => `${String(id).slice(0, 8)}...`).join(', ')
          : 'None',
    },
    { key: 'recommendedAction', label: 'Recommended Handling' },
  ];

  const rowColumns = [
    {
      key: 'id',
      label: 'Response ID',
      render: r => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{String(r.id).slice(0, 12)}...</span>,
    },
    { key: 'submitted_at', label: 'Submitted', render: r => formatDateTime(r.submitted_at) },
    { key: 'age_group', label: 'Age' },
    { key: 'primary_ai_tool', label: 'Primary Tool' },
    {
      key: 'issues',
      label: 'Flags Detected',
      render: r =>
        r._audit.issues.length ? r._audit.issues.join(', ') : 'Clean (0 flags)',
    },
    {
      key: 'included',
      label: 'Analysis Status',
      render: r =>
        r._audit.includedInAnalysis ? (
          <span style={{ color: '#15803d', fontWeight: 700 }}>Included</span>
        ) : (
          <span style={{ color: '#b91c1c', fontWeight: 700 }}>
            Excluded ({r._audit.exclusionReason})
          </span>
        ),
    },
    {
      key: 'action',
      label: 'Action',
      render: r => (
        <button
          type="button"
          className={`admin-btn admin-btn-sm ${r._audit.isAdminExcluded ? '' : 'admin-btn-danger'}`}
          onClick={() => {
            setDialogTarget(r);
            setReasonInput(
              r._audit.isAdminExcluded
                ? ''
                : r._audit.issues.length
                ? `Flagged during cleaning (${r._audit.issues.join(', ')})`
                : 'Manual researcher exclusion'
            );
          }}
        >
          {r._audit.isAdminExcluded ? 'Restore to Analysis' : 'Exclude from Analysis'}
        </button>
      ),
    },
  ];

  return (
    <>
      <PageTitle
        title="Data Cleaning & Screening Report"
        subtitle="Non-destructive screening of all participant responses. Raw Supabase records are never modified or deleted here."
      />

      {cleaning.totalSubmitted === 0 ? (
        <AdminEmptyState onRefresh={onRefresh} />
      ) : (
        <>
          <div className="admin-banner admin-banner-info">
            <strong>Data Preservation Guarantee:</strong> Excluding a record here marks an analytical flag only. Your original participant record in <code>public.survey_responses</code> stays completely untouched.
          </div>

          <AdminCard
            title="10-Point Automated Screening Audit"
            subtitle={`Total Submitted: ${cleaning.totalSubmitted} · Valid for Analysis: ${cleaning.validCount} · Excluded: ${cleaning.excludedCount}`}
          >
            <AdminTable columns={issueColumns} rows={cleaning.issues} rowKey={r => r.id} />
          </AdminCard>

          <AdminCard
            title="Participant Screening Log & Manual Exclusion Flags"
            subtitle="Review flagged rows (such as straight-lining or potential duplicates) and toggle analytical inclusion."
          >
            <AdminTable columns={rowColumns} rows={cleaning.auditedRows} />
          </AdminCard>
        </>
      )}

      <ConfirmDialog
        open={Boolean(dialogTarget)}
        title={
          dialogTarget?._audit?.isAdminExcluded
            ? 'Restore Participant to Statistical Analysis'
            : 'Exclude Participant from Statistical Analysis'
        }
        message={
          dialogTarget?._audit?.isAdminExcluded
            ? `Restore response ${dialogTarget?.id} so it is included in descriptive, reliability, and hypothesis analyses again?`
            : `Exclude response ${dialogTarget?.id} from analytical calculations? The raw row in Supabase will NOT be deleted.`
        }
        confirmLabel={
          dialogTarget?._audit?.isAdminExcluded ? 'Restore Response' : 'Exclude from Analysis'
        }
        onCancel={() => setDialogTarget(null)}
        onConfirm={() => {
          if (dialogTarget) {
            onToggleExclusion(
              dialogTarget.id,
              !dialogTarget._audit.isAdminExcluded,
              reasonInput
            );
          }
          setDialogTarget(null);
        }}
      >
        {dialogTarget && !dialogTarget._audit.isAdminExcluded && (
          <div className="admin-form-group">
            <label htmlFor="exclusion-reason">Documented Reason (for Thesis Screening Log)</label>
            <input
              id="exclusion-reason"
              type="text"
              className="admin-input"
              value={reasonInput}
              onChange={e => setReasonInput(e.target.value)}
            />
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}
