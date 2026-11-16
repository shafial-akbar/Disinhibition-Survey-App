import React from 'react';

export default function AdminTable({
  columns = [],
  rows = [],
  emptyText = 'No data available yet.',
  apa = false,
  rowKey = (row, idx) => row?.id ?? idx,
  onRowClick,
}) {
  if (!rows.length) {
    return (
      <div className="admin-banner" style={{ textAlign: 'center', color: '#64748b' }}>
        {emptyText}
      </div>
    );
  }

  return (
    <div className="admin-table-wrap">
      <table className={`admin-table ${apa ? 'apa-table' : ''}`}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} className={col.numeric ? 'num' : ''}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={rowKey(row, idx)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={onRowClick ? { cursor: 'pointer' } : undefined}
            >
              {columns.map(col => (
                <td key={col.key} className={col.numeric ? 'num' : ''}>
                  {col.render ? col.render(row, idx) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
