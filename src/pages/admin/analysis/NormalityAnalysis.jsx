import React from 'react';
import PageTitle from '../../../components/common/PageTitle';
import AdminCard from '../../../components/admin/AdminCard';
import AdminTable from '../../../components/admin/AdminTable';
import AdminChart from '../../../components/admin/AdminChart';
import AdminEmptyState from '../../../components/admin/AdminEmptyState';
import InterpretationBox from '../../../components/analysis/InterpretationBox';
import { formatNumber, formatPValue } from '../../../utils/formatters/numberFormatter';

export default function NormalityAnalysis({ analysis, onRefresh }) {
  const { cleaning, normality, settings } = analysis;
  const scales = normality.scales || [];

  const columns = [
    { key: 'name', label: 'Construct', render: r => <strong>{r.name} ({r.code})</strong> },
    { key: 'n', label: 'n', numeric: true },
    { key: 'wStatistic', label: 'Shapiro-Wilk W', numeric: true, render: r => formatNumber(r.wStatistic, 3) },
    { key: 'pValue', label: 'p-value', numeric: true, render: r => formatPValue(r.pValue) },
    { key: 'skewness', label: 'Skewness', numeric: true, render: r => formatNumber(r.skewness, 3) },
    { key: 'kurtosis', label: 'Kurtosis', numeric: true, render: r => formatNumber(r.kurtosis, 3) },
    {
      key: 'interpretation',
      label: 'Assessment',
      render: r => <span style={{ fontSize: 12.5 }}>{r.warning || r.interpretation}</span>,
    },
  ];

  return (
    <>
      <PageTitle
        title="Normality Assessment (Shapiro-Wilk, Skewness, Histograms & Q-Q Plots)"
        subtitle="Distributional diagnostics for PCW, PT, and WSD composite mean scores."
      />

      {cleaning.validCount === 0 ? (
        <AdminEmptyState onRefresh={onRefresh} />
      ) : (
        <>
          <div className="admin-banner admin-banner-info">
            {normality.methodologyNote}
          </div>

          <AdminCard title="Table 4.4 — Shapiro-Wilk Normality & Shape Statistics">
            <AdminTable columns={columns} rows={scales} rowKey={r => r.code} apa />
          </AdminCard>

          <div className="analysis-grid-3">
            {scales.map(s => (
              <AdminChart
                key={`${s.code}-hist`}
                title={`${s.code} Histogram`}
                subtitle={`W = ${formatNumber(s.wStatistic, 3)}, p ${formatPValue(s.pValue) === '< .001' ? '< .001' : `= ${formatPValue(s.pValue)}`}`}
                type="bar"
                data={s.histogram}
                xKey="rangeLabel"
                yKey="count"
                height={230}
                filename={`${s.code}_normality_histogram.png`}
              />
            ))}
          </div>

          <div className="analysis-grid-3">
            {scales.map(s => (
              <AdminChart
                key={`${s.code}-qq`}
                title={`${s.code} Normal Q-Q Plot`}
                subtitle="Points near the diagonal line indicate approximate normality"
                type="qq"
                data={s.qqPoints}
                height={250}
                filename={`${s.code}_qq_plot.png`}
              />
            ))}
          </div>

          <InterpretationBox
            showBanglaDefault={settings.showBanglaExplanations}
            whatItIs="Normality testing checks whether participant composite scores roughly follow a bell-shaped normal distribution."
            whyUseIt="Parametric tests like Pearson's r work best when distributions are roughly symmetric without severe outliers; if data are strongly skewed, Spearman's rho provides a safe non-parametric check."
            howCalculated="Shapiro-Wilk compares ordered sample scores against expected normal order statistics to compute W (closer to 1.00 = more normal). Skewness and excess kurtosis summarize asymmetry and peak shape."
            highVsLow="If Shapiro-Wilk p >= .05, there is no strong statistical evidence against normality in this sample. If p < .05, the sample shows statistically detectable departure from strict normality."
            howToInterpret="Do not rely on p-value alone! Inspect the Q-Q plots and skewness (|skew| < 1–2 is common in psychology survey composites), and report both Pearson r and Spearman rho side by side."
            thesisText={`Distributional normality was examined via Shapiro-Wilk tests alongside skewness, kurtosis, histograms, and Q-Q plots: ${scales
              .map(
                s =>
                  `${s.code} (W = ${formatNumber(s.wStatistic, 3)}, p ${
                    formatPValue(s.pValue) === '< .001' ? '< .001' : `= ${formatPValue(s.pValue)}`
                  })`
              )
              .join(', ')}. Both parametric and non-parametric correlations are therefore presented.`}
            banglaSummary="নর্মালিটি টেস্ট (Shapiro-Wilk, Skewness ও Q-Q Plot) যাচাই করে ডেটা সাধারণ বেল-শেপড বণ্টন অনুসরণ করছে কি না, যাতে Pearson নাকি Spearman ব্যবহার করা ভালো হবে তা বোঝা যায়।"
          />
        </>
      )}
    </>
  );
}
