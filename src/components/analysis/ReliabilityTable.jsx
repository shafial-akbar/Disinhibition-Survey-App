import React from 'react';
import AdminTable from '../admin/AdminTable';
import { formatNumber } from '../../utils/formatters/numberFormatter';

export default function ReliabilityTable({ scale }) {
  if (!scale) return null;

  const columns = [
    {
      key: 'key',
      label: 'Item',
      render: r => (
        <div>
          <strong>{r.key.toUpperCase()}</strong>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{r.label}</div>
        </div>
      ),
    },
    { key: 'mean', label: 'Item Mean', numeric: true, render: r => formatNumber(r.mean, 2) },
    { key: 'sd', label: 'Item SD', numeric: true, render: r => formatNumber(r.sd, 2) },
    {
      key: 'correctedItemTotalCorrelation',
      label: 'Corrected Item-Total r',
      numeric: true,
      render: r => formatNumber(r.correctedItemTotalCorrelation, 3),
    },
    {
      key: 'alphaIfDeleted',
      label: "Cronbach's α if Item Deleted",
      numeric: true,
      render: r => formatNumber(r.alphaIfDeleted, 3),
    },
  ];

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div>
          <h3 className="admin-card-title">
            {scale.name} ({scale.code}) — {scale.itemCount} Items
          </h3>
          <p className="admin-card-sub">
            Complete cases n = {scale.validN} · Missing excluded = {scale.excludedMissingN} · Overall Cronbach&apos;s α ={' '}
            <strong style={{ color: '#0f172a' }}>{formatNumber(scale.alpha, 3)}</strong> ({scale.interpretation?.label || 'Not calculable'})
          </p>
        </div>
      </div>

      {scale.warning && (
        <div className="admin-banner admin-banner-warn" style={{ marginBottom: 12 }}>
          {scale.warning}
        </div>
      )}

      <AdminTable columns={columns} rows={scale.items || []} rowKey={r => r.key} apa />
    </div>
  );
}
