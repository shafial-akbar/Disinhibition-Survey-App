import React from 'react';
import PageTitle from '../../../components/common/PageTitle';
import FilterBar from '../../../components/common/FilterBar';
import AdminCard from '../../../components/admin/AdminCard';
import AdminTable from '../../../components/admin/AdminTable';
import AdminChart from '../../../components/admin/AdminChart';
import CorrelationTable from '../../../components/analysis/CorrelationTable';
import AdminEmptyState from '../../../components/admin/AdminEmptyState';
import InterpretationBox from '../../../components/analysis/InterpretationBox';
import { formatNumber, formatPValue, formatCI } from '../../../utils/formatters/numberFormatter';

function getHeatBg(val) {
  if (val === null || val === undefined || !Number.isFinite(val)) return '#f8fafc';
  const abs = Math.min(1, Math.abs(val));
  const alpha = (0.1 + abs * 0.35).toFixed(2);
  return val >= 0 ? `rgba(29, 78, 216, ${alpha})` : `rgba(185, 28, 28, ${alpha})`;
}

export default function CorrelationAnalysis({
  analysis,
  filters,
  filterOptions,
  isFiltered,
  onUpdateFilter,
  onResetFilters,
  onRefresh,
}) {
  const { cleaning, correlation, settings } = analysis;

  const pairColumns = [
    { key: 'id', label: 'Pair', render: r => <strong>{r.id}</strong> },
    { key: 'label', label: 'Variables' },
    { key: 'n', label: 'n', numeric: true },
    {
      key: 'pearson_r',
      label: 'Pearson r',
      numeric: true,
      render: r => <strong>{formatNumber(r.pearson?.r, 3)}</strong>,
    },
    {
      key: 'pearson_p',
      label: 'Pearson p',
      numeric: true,
      render: r => formatPValue(r.pearson?.pValue),
    },
    {
      key: 'pearson_ci',
      label: '95% CI',
      numeric: true,
      render: r => formatCI(r.pearson?.ci, 2),
    },
    {
      key: 'spearman_rho',
      label: 'Spearman ρ',
      numeric: true,
      render: r => <strong>{formatNumber(r.spearman?.rho, 3)}</strong>,
    },
    {
      key: 'spearman_p',
      label: 'Spearman p',
      numeric: true,
      render: r => formatPValue(r.spearman?.pValue),
    },
    {
      key: 'strength',
      label: 'Strength & Direction',
      render: r =>
        r.pearson?.interpretation
          ? `${r.pearson.interpretation.direction} (${r.pearson.interpretation.strength})`
          : '—',
    },
  ];

  return (
    <>
      <PageTitle
        title="Correlation Analysis (Pearson r & Spearman ρ)"
        subtitle="Bivariate relationships among Perceived Conversational Warmth (PCW), Perceived Trust (PT), and Willingness to Self-Disclose (WSD)."
        meta={`Deletion mode: ${correlation.deletionMode} · Listwise valid n = ${correlation.listwiseN}`}
      />

      <FilterBar
        filters={filters}
        filterOptions={filterOptions}
        onUpdateFilter={onUpdateFilter}
        onResetFilters={onResetFilters}
        isFiltered={isFiltered}
      />

      {cleaning.validCount === 0 ? (
        <AdminEmptyState onRefresh={onRefresh} />
      ) : (
        <>
          <div className="admin-banner admin-banner-info">
            {correlation.comparisonNote}
          </div>

          <AdminCard title="Table 4.5a — Summary of Bivariate Correlations (Pearson r, 95% CI & Spearman ρ)">
            <AdminTable columns={pairColumns} rows={correlation.pairs} rowKey={r => r.id} apa />
          </AdminCard>

          <div className="analysis-grid-2">
            <CorrelationTable
              title="Table 4.5b — Pearson Correlation Matrix (r)"
              codes={correlation.codes}
              matrix={correlation.pearsonMatrix}
              metricKey="r"
            />
            <CorrelationTable
              title="Table 4.5c — Spearman Rank Correlation Matrix (ρ)"
              codes={correlation.codes}
              matrix={correlation.spearmanMatrix}
              metricKey="rho"
            />
          </div>

          <AdminCard
            title="Correlation Strength Heatmap (Pearson r)"
            subtitle="Visual intensity map across PCW, PT, and WSD composite means."
          >
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Variable</th>
                    {correlation.codes.map(c => (
                      <th key={c} className="matrix-cell">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {correlation.codes.map(rCode => (
                    <tr key={rCode}>
                      <td><strong>{rCode}</strong></td>
                      {correlation.codes.map(cCode => {
                        const rVal = correlation.pearsonMatrix?.[rCode]?.[cCode]?.r;
                        return (
                          <td
                            key={cCode}
                            className="matrix-cell"
                            style={{
                              background: getHeatBg(rVal),
                              fontWeight: 700,
                              color: '#0f172a',
                            }}
                          >
                            {formatNumber(rVal, 3)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminCard>

          <div className="analysis-grid-3">
            {correlation.pairs.map(pair => (
              <AdminChart
                key={pair.id}
                title={`${pair.id}: ${pair.varX} vs. ${pair.varY}`}
                subtitle={`r = ${formatNumber(pair.pearson?.r, 3)}, p = ${formatPValue(pair.pearson?.pValue)} (n=${pair.n})`}
                type="scatter"
                data={pair.scatterPoints}
                xKey="x"
                yKey="y"
                xLabel={`${pair.varX} Mean (1–5)`}
                yLabel={`${pair.varY} Mean (1–5)`}
                trendLine={pair.trendLine}
                height={270}
                filename={`scatter_${pair.varX}_${pair.varY}.png`}
              />
            ))}
          </div>

          <InterpretationBox
            showBanglaDefault={settings.showBanglaExplanations}
            whatItIs="Correlation measures whether two variables tend to rise and fall together across participants."
            whyUseIt="Your study tests whether people who perceive higher Conversational Warmth also report higher Trust and Willingness to Self-Disclose."
            howCalculated="Pearson's r measures straight-line covariance divided by product of sample SDs; Spearman's ρ converts scores to ranks (with tie averaging) and checks monotonic association."
            highVsLow="Values range from −1.00 to +1.00. Positive values (+0.30 to +0.80) mean higher X aligns with higher Y; 0 means no linear/monotonic pattern."
            howToInterpret="Look at r/ρ (strength & direction), p-value (whether likely beyond chance), and 95% CI. Remember: correlation does NOT prove one variable caused the other."
            thesisText={`Two-tailed bivariate correlations (${correlation.deletionMode} deletion) examined associations among PCW, PT, and WSD. ${correlation.pairs
              .map(
                p =>
                  `${p.varX}–${p.varY} showed r = ${formatNumber(p.pearson?.r, 3)}, p ${
                    formatPValue(p.pearson?.pValue) === '< .001'
                      ? '< .001'
                      : `= ${formatPValue(p.pearson?.pValue)}`
                  }, 95% CI ${formatCI(p.pearson?.ci, 2)} (ρ = ${formatNumber(p.spearman?.rho, 3)})`
              )
              .join('; ')}.`}
            banglaSummary="কোরিলেশন বিশ্লেষণ দেখায় দুটি ধারণার (যেমন আন্তরিকতা ও বিশ্বাস) মধ্যে সম্পর্ক কতটা শক্তিশালী এবং তা ধনাত্মক না ঋণাত্মক। মনে রাখবেন, কোরিলেশন সম্পর্ক দেখায় কিন্তু সরাসরি কার্যকারণ (causation) প্রমাণ করে না।"
          />
        </>
      )}
    </>
  );
}
