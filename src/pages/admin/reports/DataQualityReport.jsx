import React, { useMemo } from 'react';
import PageTitle from '../../../components/common/PageTitle';
import AdminCard from '../../../components/admin/AdminCard';
import AdminTable from '../../../components/admin/AdminTable';
import AdminEmptyState from '../../../components/admin/AdminEmptyState';
import { QUESTIONNAIRE_CONFIG } from '../../../config/questionnaireConfig';
import { formatPercentage } from '../../../utils/formatters/percentageFormatter';
import { formatDateTime } from '../../../utils/formatters/dateFormatter';

export default function DataQualityReport({ rawRows, analysis, onRefresh }) {
  const { cleaning, snapshotMeta } = analysis;

  const itemCompletenessRows = useMemo(() => {
    const total = rawRows.length;
    return QUESTIONNAIRE_CONFIG.allItemKeys.map(key => {
      let validCount = 0;
      for (const r of rawRows) {
        const val = Number(r?.[key]);
        if (Number.isInteger(val) && val >= 1 && val <= 5) {
          validCount += 1;
        }
      }
      return {
        key: key.toUpperCase(),
        validCount,
        missingCount: total - validCount,
        completeness: formatPercentage(validCount, total, 1),
      };
    });
  }, [rawRows]);

  const versionBreakdown = useMemo(() => {
    const counts = new Map();
    for (const r of rawRows) {
      const v = r?.questionnaire_version || 'untagged';
      counts.set(v, (counts.get(v) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([version, count]) => ({
      version,
      count,
      share: formatPercentage(count, rawRows.length, 1),
    }));
  }, [rawRows]);

  return (
    <>
      <PageTitle
        title="Data Quality & Reproducibility Report"
        subtitle="Item-level completeness audit, questionnaire version consistency, withdrawal window locks, and analysis snapshot details."
      />

      {rawRows.length === 0 ? (
        <AdminEmptyState onRefresh={onRefresh} />
      ) : (
        <>
          <div className="analysis-grid-2">
            <AdminCard title="Questionnaire Version Integrity">
              <AdminTable
                columns={[
                  { key: 'version', label: 'Questionnaire Version' },
                  { key: 'count', label: 'Records (n)', numeric: true },
                  { key: 'share', label: 'Share (%)', numeric: true },
                ]}
                rows={versionBreakdown}
                rowKey={r => r.version}
              />
            </AdminCard>

            <AdminCard title="Withdrawal & Reproducibility Snapshot">
              <div style={{ fontSize: 13.5, lineHeight: 1.85, color: '#1e293b', fontVariantNumeric: 'tabular-nums' }}>
                <div><strong>Analyzed Timestamp:</strong> {formatDateTime(snapshotMeta.analyzedAt)}</div>
                <div><strong>Active Version Standard:</strong> {snapshotMeta.version} ({QUESTIONNAIRE_CONFIG.totalItemCount} items)</div>
                <div><strong>Locked Post-Withdrawal Records:</strong> {cleaning.lockedCount}</div>
                <div><strong>Pending 3-Day Window Records:</strong> {cleaning.pendingWithdrawalCount}</div>
                <div><strong>Missing Data Rule:</strong> {snapshotMeta.missingDataRule}</div>
                <div><strong>Correlation Deletion:</strong> {snapshotMeta.correlationDeletion}</div>
              </div>
            </AdminCard>
          </div>

          <AdminCard
            title="Item-Level Completeness Across All 18 Likert Items"
            subtitle="Verifies valid integer responses (1–5) for cw_1..cw_4, pt_1..pt_6, and sd_1..sd_8."
          >
            <AdminTable
              columns={[
                { key: 'key', label: 'Item Column' },
                { key: 'validCount', label: 'Valid (1–5)', numeric: true },
                { key: 'missingCount', label: 'Missing / Invalid', numeric: true },
                { key: 'completeness', label: 'Completeness', numeric: true },
              ]}
              rows={itemCompletenessRows}
              rowKey={r => r.key}
            />
          </AdminCard>
        </>
      )}
    </>
  );
}
