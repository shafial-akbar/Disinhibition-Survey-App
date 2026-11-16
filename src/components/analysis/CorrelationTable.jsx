import React from 'react';
import { formatNumber, formatPValue } from '../../utils/formatters/numberFormatter';

export default function CorrelationTable({ title, codes = [], matrix = {}, metricKey = 'r' }) {
  if (!codes.length) return null;

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div>
          <h3 className="admin-card-title">{title}</h3>
          <p className="admin-card-sub">Two-tailed correlation coefficients and exact APA p-values.</p>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table apa-table">
          <thead>
            <tr>
              <th>Construct</th>
              {codes.map(c => (
                <th key={c} className="matrix-cell">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {codes.map(rowCode => (
              <tr key={rowCode}>
                <td><strong>{rowCode}</strong></td>
                {codes.map(colCode => {
                  const cell = matrix?.[rowCode]?.[colCode];
                  if (rowCode === colCode) {
                    return (
                      <td key={colCode} className="matrix-cell">
                        <strong>1.000</strong>
                      </td>
                    );
                  }
                  const val = cell?.[metricKey];
                  const p = cell?.pValue;
                  const n = cell?.n ?? 0;
                  return (
                    <td key={colCode} className="matrix-cell">
                      <div>
                        <strong>{formatNumber(val, 3)}</strong>
                      </div>
                      <div style={{ fontSize: 11.5, color: '#475569' }}>
                        p {formatPValue(p) === '< .001' ? '< .001' : `= ${formatPValue(p)}`} · n={n}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
