import React, { useState, useMemo } from 'react';
import { X, Eye } from 'lucide-react';
import PageTitle from '../../../components/common/PageTitle';
import FilterBar from '../../../components/common/FilterBar';
import Pagination from '../../../components/common/Pagination';
import AdminTable from '../../../components/admin/AdminTable';
import AdminEmptyState from '../../../components/admin/AdminEmptyState';
import { QUESTIONNAIRE_CONFIG } from '../../../config/questionnaireConfig';
import { formatDateTime } from '../../../utils/formatters/dateFormatter';
import { formatNumber } from '../../../utils/formatters/numberFormatter';

export default function AllResponses({
  analysis,
  filters,
  filterOptions,
  isFiltered,
  onUpdateFilter,
  onResetFilters,
  onRefresh,
}) {
  const [page, setPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState(null);
  const pageSize = 15;

  const { cleaning, scoring } = analysis;
  const scoredById = useMemo(
    () => new Map((scoring.scoredRows || []).map(r => [r.id, r])),
    [scoring.scoredRows]
  );

  const auditedRows = cleaning.auditedRows || [];
  const totalPages = Math.max(1, Math.ceil(auditedRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = auditedRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const columns = [
    {
      key: 'id',
      label: 'Response ID',
      render: r => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{String(r.id).slice(0, 8)}...</span>,
    },
    {
      key: 'submitted_at',
      label: 'Submitted',
      render: r => formatDateTime(r.submitted_at),
    },
    { key: 'age_group', label: 'Age' },
    { key: 'gender', label: 'Gender' },
    { key: 'primary_ai_tool', label: 'Primary AI Tool' },
    {
      key: 'pcw',
      label: 'PCW Mean',
      numeric: true,
      render: r => formatNumber(scoredById.get(r.id)?.PCW_mean ?? r.warmth_mean, 2),
    },
    {
      key: 'pt',
      label: 'PT Mean',
      numeric: true,
      render: r => formatNumber(scoredById.get(r.id)?.PT_mean ?? r.trust_mean, 2),
    },
    {
      key: 'wsd',
      label: 'WSD Mean',
      numeric: true,
      render: r => formatNumber(scoredById.get(r.id)?.WSD_mean ?? r.disclosure_mean, 2),
    },
    {
      key: 'status',
      label: 'Analysis Status',
      render: r => {
        if (!r._audit.includedInAnalysis) {
          return <span style={{ color: '#b91c1c', fontWeight: 700 }}>Excluded</span>;
        }
        return r._audit.isLocked ? (
          <span style={{ color: '#15803d', fontWeight: 700 }}>Included · Locked</span>
        ) : (
          <span style={{ color: '#b45309', fontWeight: 700 }}>Included · 3-Day Window</span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Inspect',
      render: r => (
        <button
          type="button"
          className="admin-btn admin-btn-sm"
          onClick={e => {
            e.stopPropagation();
            setSelectedRow(r);
          }}
        >
          <Eye size={13} /> Details
        </button>
      ),
    },
  ];

  return (
    <>
      <PageTitle
        title="All Participant Responses"
        subtitle="Browse individual anonymized submissions, check 3-day lock status, and inspect all 18 item scores."
      />

      <FilterBar
        filters={filters}
        filterOptions={filterOptions}
        onUpdateFilter={(k, v) => {
          setPage(1);
          onUpdateFilter(k, v);
        }}
        onResetFilters={() => {
          setPage(1);
          onResetFilters();
        }}
        isFiltered={isFiltered}
      />

      {auditedRows.length === 0 ? (
        <AdminEmptyState onRefresh={onRefresh} />
      ) : (
        <div className="admin-card">
          <AdminTable
            columns={columns}
            rows={pagedRows}
            onRowClick={r => setSelectedRow(r)}
          />
          <Pagination
            page={safePage}
            pageSize={pageSize}
            totalItems={auditedRows.length}
            onPageChange={setPage}
          />
        </div>
      )}

      {selectedRow && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                  Participant Response Inspector
                </h3>
                <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace', marginTop: 2 }}>
                  ID: {selectedRow.id}
                </div>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn-sm"
                onClick={() => setSelectedRow(null)}
              >
                <X size={14} /> Close
              </button>
            </div>

            <div className="analysis-grid-2" style={{ marginBottom: 16, fontSize: 13 }}>
              <div>
                <strong>Demographics</strong>
                <div style={{ marginTop: 6, color: '#334155', lineHeight: 1.7 }}>
                  <div>Age Group: {selectedRow.age_group}</div>
                  <div>Gender: {selectedRow.gender || '—'}</div>
                  <div>Education: {selectedRow.education}</div>
                  <div>Occupation: {selectedRow.occupation || '—'}</div>
                </div>
              </div>
              <div>
                <strong>AI Experience</strong>
                <div style={{ marginTop: 6, color: '#334155', lineHeight: 1.7 }}>
                  <div>Primary Tool: {selectedRow.primary_ai_tool || '—'}</div>
                  <div>Tools Used: {Array.isArray(selectedRow.ai_tools) ? selectedRow.ai_tools.join(', ') : '—'}</div>
                  <div>Frequency: {selectedRow.ai_frequency}</div>
                  <div>Duration: {selectedRow.ai_duration}</div>
                  <div>Familiarity: {selectedRow.ai_familiarity}</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 14, fontSize: 13 }}>
              <strong>Purposes:</strong>{' '}
              {Array.isArray(selectedRow.ai_purpose) ? selectedRow.ai_purpose.join(', ') : '—'}
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Item Key</th>
                    <th>Score (1–5)</th>
                  </tr>
                </thead>
                <tbody>
                  {QUESTIONNAIRE_CONFIG.allItemKeys.map(key => (
                    <tr key={key}>
                      <td><strong>{key.toUpperCase()}</strong></td>
                      <td className="num">{selectedRow[key] ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
