import React, { useState, useMemo } from 'react';
import { Download, ArrowUpDown } from 'lucide-react';
import PageTitle from '../../../components/common/PageTitle';
import FilterBar from '../../../components/common/FilterBar';
import Pagination from '../../../components/common/Pagination';
import AdminEmptyState from '../../../components/admin/AdminEmptyState';
import { SAFE_RESPONSE_COLUMNS } from '../../../services/supabase/responseService';
import { exportRawDataCsv } from '../../../services/export/csvExportService';
import { formatDateTime } from '../../../utils/formatters/dateFormatter';

export default function RawDataReport({
  rawRows,
  filteredRawRows,
  filters,
  filterOptions,
  isFiltered,
  onUpdateFilter,
  onResetFilters,
  onRefresh,
}) {
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState('submitted_at');
  const [sortAsc, setSortAsc] = useState(false);
  const pageSize = 20;

  const sortedRows = useMemo(() => {
    const copy = [...filteredRawRows];
    copy.sort((a, b) => {
      const av = a?.[sortCol] ?? '';
      const bv = b?.[sortCol] ?? '';
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortAsc ? av - bv : bv - av;
      }
      return sortAsc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [filteredRawRows, sortCol, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = col => {
    if (sortCol === col) {
      setSortAsc(v => !v);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  return (
    <>
      <PageTitle
        title="Raw Survey Data Table (Sanitized)"
        subtitle="Complete database columns excluding withdrawal_code_hash. Original database rows remain immutable."
        actions={
          rawRows.length > 0 ? (
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => exportRawDataCsv(sortedRows)}
            >
              <Download size={14} /> Export Filtered Raw CSV ({sortedRows.length})
            </button>
          ) : null
        }
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

      {sortedRows.length === 0 ? (
        <AdminEmptyState onRefresh={onRefresh} />
      ) : (
        <div className="admin-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  {SAFE_RESPONSE_COLUMNS.map(col => (
                    <th key={col}>
                      <button
                        type="button"
                        onClick={() => toggleSort(col)}
                        style={{
                          border: 0,
                          background: 'transparent',
                          padding: 0,
                          font: 'inherit',
                          color: 'inherit',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {col}
                        <ArrowUpDown size={11} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row, idx) => (
                  <tr key={row.id || idx}>
                    {SAFE_RESPONSE_COLUMNS.map(col => {
                      const val = row[col];
                      if (col === 'id') {
                        return (
                          <td key={col} style={{ fontFamily: 'monospace', fontSize: 11.5 }}>
                            {String(val).slice(0, 8)}...
                          </td>
                        );
                      }
                      if (col === 'submitted_at' || col === 'withdrawal_deadline') {
                        return <td key={col} style={{ whiteSpace: 'nowrap' }}>{formatDateTime(val)}</td>;
                      }
                      if (Array.isArray(val)) {
                        return <td key={col}>{val.join(', ')}</td>;
                      }
                      return <td key={col}>{val === null || val === undefined ? '—' : String(val)}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={safePage}
            pageSize={pageSize}
            totalItems={sortedRows.length}
            onPageChange={setPage}
          />
        </div>
      )}
    </>
  );
}
