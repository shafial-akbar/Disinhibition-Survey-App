import React from 'react';
import PageTitle from '../../../components/common/PageTitle';
import AdminCard from '../../../components/admin/AdminCard';
import AdminTable from '../../../components/admin/AdminTable';
import AdminEmptyState from '../../../components/admin/AdminEmptyState';
import InterpretationBox from '../../../components/analysis/InterpretationBox';
import { formatNumber } from '../../../utils/formatters/numberFormatter';

export default function ScoringAnalysis({ analysis, onRefresh }) {
  const { cleaning, scoring, settings } = analysis;

  const summaryColumns = [
    { key: 'code', label: 'Code', render: r => <strong>{r.code}</strong> },
    { key: 'name', label: 'Construct Name' },
    { key: 'itemCount', label: 'Items (k)', numeric: true },
    { key: 'formulaTotal', label: 'Total Formula' },
    {
      key: 'possibleTotal',
      label: 'Possible Total',
      numeric: true,
      render: r => `${r.possibleTotalMin}–${r.possibleTotalMax}`,
    },
    {
      key: 'actualTotal',
      label: 'Observed Total',
      numeric: true,
      render: r =>
        r.actualTotalMin !== null
          ? `${formatNumber(r.actualTotalMin, 0)}–${formatNumber(r.actualTotalMax, 0)}`
          : '—',
    },
    {
      key: 'actualMean',
      label: 'Observed Mean (1–5)',
      numeric: true,
      render: r =>
        r.actualMeanMin !== null
          ? `${formatNumber(r.actualMeanMin, 2)}–${formatNumber(r.actualMeanMax, 2)}`
          : '—',
    },
    { key: 'validN', label: 'Valid n', numeric: true },
  ];

  const participantColumns = [
    {
      key: 'id',
      label: 'Participant ID',
      render: r => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{String(r.id).slice(0, 10)}...</span>,
    },
    { key: 'primary_ai_tool', label: 'Primary Tool' },
    { key: 'PCW_total', label: 'PCW Total (4–20)', numeric: true, render: r => formatNumber(r.PCW_total, 2) },
    { key: 'PCW_mean', label: 'PCW Mean (1–5)', numeric: true, render: r => formatNumber(r.PCW_mean, 2) },
    { key: 'PT_total', label: 'PT Total (6–30)', numeric: true, render: r => formatNumber(r.PT_total, 2) },
    { key: 'PT_mean', label: 'PT Mean (1–5)', numeric: true, render: r => formatNumber(r.PT_mean, 2) },
    { key: 'WSD_total', label: 'WSD Total (8–40)', numeric: true, render: r => formatNumber(r.WSD_total, 2) },
    { key: 'WSD_mean', label: 'WSD Mean (1–5)', numeric: true, render: r => formatNumber(r.WSD_mean, 2) },
  ];

  return (
    <>
      <PageTitle
        title="Psychometric Scoring Analysis"
        subtitle="Construct total and mean scores computed directly from individual 1–5 Likert items (4 PCW, 6 PT, 8 WSD)."
      />

      {cleaning.validCount === 0 ? (
        <AdminEmptyState onRefresh={onRefresh} />
      ) : (
        <>
          <AdminCard
            title="Construct Scoring Blueprint & Observed Ranges"
            subtitle={`Active missing-data rule: ${settings.missingDataRule} · Reverse-coded items: None in active 18-item instrument`}
          >
            <AdminTable
              columns={summaryColumns}
              rows={scoring.constructSummaries}
              rowKey={r => r.code}
              apa
            />
          </AdminCard>

          <AdminCard
            title="Participant-Level Calculated Composite Scores"
            subtitle="Verified composite totals and means (1.00–5.00 scale) computed from raw items without altering raw records."
          >
            <AdminTable
              columns={participantColumns}
              rows={scoring.scoredRows.slice(0, 50)}
            />
            {scoring.scoredRows.length > 50 && (
              <div style={{ marginTop: 10, fontSize: 12, color: '#64748b' }}>
                Showing first 50 rows. Export Cleaned CSV or Excel Workbook for all {scoring.scoredRows.length} scored rows.
              </div>
            )}
          </AdminCard>

          <InterpretationBox
            showBanglaDefault={settings.showBanglaExplanations}
            whatItIs="Construct scoring combines individual survey items belonging to the same psychological concept into a Total Score and a Mean Score."
            whyUseIt="Single Likert items are noisy; averaging multiple related items gives a more reliable measure of Perceived Conversational Warmth, Trust, and Self-Disclosure."
            howCalculated="PCW Total = CW1+...+CW4 (4–20), Mean = Total / 4. PT Total = PT1+...+PT6 (6–30), Mean = Total / 6. WSD Total = SD1+...+SD8 (8–40), Mean = Total / 8."
            highVsLow="Mean scores closer to 5.00 represent strong agreement (higher warmth, trust, or willingness to self-disclose); scores near 1.00 represent strong disagreement."
            howToInterpret="Use the Mean Score (1.00–5.00) when comparing constructs directly because each construct has a different number of questions (4 vs. 6 vs. 8)."
            thesisText="Composite scale scores were computed for Perceived Conversational Warmth (4 items, range 4–20), Perceived Trust (6 items, range 6–30), and Willingness to Self-Disclose (8 items, range 8–40), alongside 1.00–5.00 mean composites."
            banglaSummary="প্রতিটি অংশগ্রহণকারীর আলাদা প্রশ্নের উত্তর যোগ করে Total এবং গড় করে Mean স্কোর বের করা হয়েছে। তুলনার জন্য ১ থেকে ৫ স্কেলের Mean স্কোর ব্যবহার করা সবচেয়ে সহজ ও নির্ভুল।"
          />
        </>
      )}
    </>
  );
}
