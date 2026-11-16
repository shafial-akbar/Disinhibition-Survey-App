import React from 'react';
import { Clock, Lock } from 'lucide-react';
import StatValueCard from './StatValueCard';

/**
 * Header Component for Chapter 4 - APA 7 Thesis Report Module
 * Displays title, subtitle, provisional vs. final locked dataset status,
 * valid sample size (N), total responses, excluded responses, withdrawal window counts,
 * last analysis timestamp, and questionnaire version.
 */
export default function Chapter4Header({
  validN = 0,
  totalN = 0,
  excludedN = 0,
  lockedN = 0,
  pendingN = 0,
  analyzedAt,
  questionnaireVersion = 'v1_18_items',
  presetName = 'APA 7 Default',
}) {
  const formattedTime = analyzedAt
    ? new Date(analyzedAt).toLocaleString()
    : 'Live calculation';

  const isProvisional = pendingN > 0;

  return (
    <header className="chapter4-header-card no-print">
      <div className="chapter4-header-top">
        <div className="chapter4-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1>Chapter 4: Results (APA 7)</h1>
            {isProvisional ? (
              <span
                className="admin-badge admin-badge-amber"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <Clock size={12} />
                Provisional Analysis Snapshot ({pendingN} in 3-Day Withdrawal Window)
              </span>
            ) : (
              <span
                className="admin-badge admin-badge-green"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <Lock size={12} />
                Final Locked Dataset
              </span>
            )}
            <span className="admin-badge admin-badge-slate">{presetName}</span>
          </div>
          <p>
            Dynamic APA 7th Edition Academic Thesis Manuscript · Department of Psychology, University of Dhaka
          </p>
        </div>
      </div>

      {isProvisional && (
        <div
          className="admin-banner admin-banner-warn"
          style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5 }}
        >
          <strong>Provisional Analysis Snapshot Notice:</strong> Currently{' '}
          <strong>
            {pendingN} of {validN}
          </strong>{' '}
          eligible response(s) remain within the active 3-calendar-day participant withdrawal window ({lockedN}{' '}
          locked). This report is labeled as a provisional analysis snapshot rather than the final locked
          dataset. After the 3-day withdrawal period concludes and final screening is complete, click{' '}
          <strong>Generate Report</strong> or <strong>Refresh Data</strong> to regenerate the final manuscript.
        </div>
      )}

      <div className="chapter4-meta-strip">
        <StatValueCard
          label="Valid Sample Size (N)"
          value={`N = ${validN}`}
          subtitle={isProvisional ? 'Provisional screened sample' : 'Final locked sample'}
        />
        <StatValueCard
          label="Total Responses"
          value={totalN}
          subtitle="Retrieved from database"
        />
        <StatValueCard
          label="Excluded Responses"
          value={excludedN}
          subtitle="Screening & eligibility exclusions"
        />
        <StatValueCard
          label="Withdrawal Window Status"
          value={`${pendingN} Active / ${lockedN} Locked`}
          subtitle="3-calendar-day withdrawal rule"
        />
        <StatValueCard
          label="Questionnaire Version"
          value={questionnaireVersion}
          subtitle="18 Likert items (4 PCW, 6 PT, 8 WSD)"
        />
        <StatValueCard
          label="Last Analysis Timestamp"
          value={formattedTime}
          subtitle="Live database synchronization"
        />
      </div>
    </header>
  );
}
