import React from 'react';
import AdminTable from '../admin/AdminTable';
import { formatNumber } from '../../utils/formatters/numberFormatter';

export default function DescriptiveTable({ rows = [], showStatement = false, decimals = 2 }) {
  const columns = [
    {
      key: 'label',
      label: showStatement ? 'Item' : 'Variable',
      render: r => (
        <div>
          <strong>{r.label}</strong>
          {showStatement && r.statement && (
            <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{r.statement}</div>
          )}
        </div>
      ),
    },
    { key: 'validN', label: 'n', numeric: true },
    { key: 'missingN', label: 'Missing', numeric: true },
    { key: 'mean', label: 'Mean', numeric: true, render: r => formatNumber(r.mean, decimals) },
    { key: 'sd', label: 'SD', numeric: true, render: r => formatNumber(r.sd, decimals) },
    { key: 'median', label: 'Median', numeric: true, render: r => formatNumber(r.median, decimals) },
    { key: 'mode', label: 'Mode', numeric: true, render: r => r.modesText || '—' },
    { key: 'min', label: 'Min', numeric: true, render: r => formatNumber(r.min, showStatement ? 0 : decimals) },
    { key: 'max', label: 'Max', numeric: true, render: r => formatNumber(r.max, showStatement ? 0 : decimals) },
    { key: 'skewness', label: 'Skew', numeric: true, render: r => formatNumber(r.skewness, decimals) },
    { key: 'kurtosis', label: 'Kurt', numeric: true, render: r => formatNumber(r.kurtosis, decimals) },
  ];

  return <AdminTable columns={columns} rows={rows} rowKey={r => r.key || r.label} apa />;
}
