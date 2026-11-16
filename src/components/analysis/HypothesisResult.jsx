import React from 'react';
import { formatNumber, formatPValue, formatCI } from '../../utils/formatters/numberFormatter';

export default function HypothesisResult({ hypothesis }) {
  if (!hypothesis) return null;

  const statusClass =
    hypothesis.supported === true
      ? 'decision-supported'
      : hypothesis.supported === false
      ? 'decision-not-supported'
      : 'decision-insufficient';

  return (
    <div className="hypothesis-card">
      <div className="hypothesis-top">
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#1e40af' }}>
            {hypothesis.id} · {hypothesis.title}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginTop: 3 }}>
            {hypothesis.statement}
          </div>
        </div>
        <div className={`decision-text ${statusClass}`}>
          {hypothesis.decision}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 10,
          padding: '10px 12px',
          background: '#f8fafc',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          fontSize: 12.5,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <div>
          <span style={{ color: '#64748b', display: 'block' }}>Method</span>
          <strong>{hypothesis.methodUsed}</strong>
        </div>
        <div>
          <span style={{ color: '#64748b', display: 'block' }}>Coefficient</span>
          <strong>{formatNumber(hypothesis.coefficient, 3)}</strong>
        </div>
        <div>
          <span style={{ color: '#64748b', display: 'block' }}>p-value (2-tailed)</span>
          <strong>{formatPValue(hypothesis.pValue)}</strong>
        </div>
        <div>
          <span style={{ color: '#64748b', display: 'block' }}>95% CI / Sample</span>
          <strong>{formatCI(hypothesis.ci, 2)} (n={hypothesis.n})</strong>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: '#1e293b' }}>
        {hypothesis.explanation}
      </p>
      {hypothesis.statementBn && (
        <div style={{ fontFamily: 'Noto Sans Bengali, sans-serif', fontSize: 13, color: '#475569' }}>
          {hypothesis.statementBn}
        </div>
      )}
    </div>
  );
}
