import React from 'react';
import PageTitle from '../../../components/common/PageTitle';
import FilterBar from '../../../components/common/FilterBar';
import AdminCard from '../../../components/admin/AdminCard';
import AdminChart from '../../../components/admin/AdminChart';
import DescriptiveTable from '../../../components/analysis/DescriptiveTable';
import AdminEmptyState from '../../../components/admin/AdminEmptyState';
import InterpretationBox from '../../../components/analysis/InterpretationBox';
import { formatNumber } from '../../../utils/formatters/numberFormatter';

export default function DescriptiveAnalysis({
  analysis,
  filters,
  filterOptions,
  isFiltered,
  onUpdateFilter,
  onResetFilters,
  onRefresh,
}) {
  const { cleaning, descriptive, settings } = analysis;
  const decimals = settings.decimals || 2;

  const meanRows = descriptive.compositeSummaries.map(c => c.meanSummary);
  const totalRows = descriptive.compositeSummaries.map(c => c.totalSummary);

  const pcw = meanRows[0];
  const pt = meanRows[1];
  const wsd = meanRows[2];

  return (
    <>
      <PageTitle
        title="Descriptive Statistics"
        subtitle="Mean, sample SD (n − 1), median, mode, min, max, skewness, and kurtosis for composite scores and all 18 raw items."
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
          <AdminCard
            title="Table 4.3a — Descriptive Statistics for Composite Mean Scores (1.00–5.00 Scale)"
            subtitle={descriptive.varianceMethodNote}
          >
            <DescriptiveTable rows={meanRows} decimals={decimals} />
          </AdminCard>

          <AdminCard
            title="Table 4.3b — Descriptive Statistics for Composite Total Scores"
            subtitle="PCW (4–20), PT (6–30), and WSD (8–40)"
          >
            <DescriptiveTable rows={totalRows} decimals={decimals} />
          </AdminCard>

          <div className="analysis-grid-3">
            {descriptive.compositeSummaries.map(c => (
              <AdminChart
                key={c.code}
                title={`${c.code} Mean Distribution`}
                subtitle={`M = ${formatNumber(c.meanSummary.mean, 2)}, SD = ${formatNumber(c.meanSummary.sd, 2)}`}
                type="bar"
                data={c.histogram}
                xKey="rangeLabel"
                yKey="count"
                height={240}
                filename={`${c.code}_descriptive_histogram.png`}
              />
            ))}
          </div>

          <AdminCard
            title="Table 4.3c — Item-Level Descriptive Statistics (All 18 Active Statements)"
            subtitle="Individual item means, standard deviations, and distributional indices."
          >
            <DescriptiveTable rows={descriptive.itemSummaries} showStatement decimals={decimals} />
          </AdminCard>

          <InterpretationBox
            showBanglaDefault={settings.showBanglaExplanations}
            whatItIs="Descriptive statistics summarize the center (Mean, Median, Mode) and spread (Standard Deviation, Min, Max) of your sample's answers."
            whyUseIt="Before testing relationships, readers need to know whether participants generally rated AI high or low on Warmth, Trust, and Self-Disclosure, and how much people differed from one another."
            howCalculated="Mean = average score; Sample SD uses denominator (n − 1) to measure average spread around the mean; Skewness measures asymmetry; Excess Kurtosis measures tail heaviness."
            highVsLow="Higher Mean (above 3.00 on a 1–5 scale) shows general agreement. Higher SD means participants disagreed more with each other."
            howToInterpret="Compare the Mean and Median: if they are very close and skewness is near 0, scores are fairly balanced. Watch items with unusually low means or high SDs."
            thesisText={`Descriptive statistics (n = ${cleaning.validCount}) showed mean composite ratings of M = ${formatNumber(pcw?.mean, 2)} (SD = ${formatNumber(pcw?.sd, 2)}) for Perceived Conversational Warmth, M = ${formatNumber(pt?.mean, 2)} (SD = ${formatNumber(pt?.sd, 2)}) for Perceived Trust, and M = ${formatNumber(wsd?.mean, 2)} (SD = ${formatNumber(wsd?.sd, 2)}) for Willingness to Self-Disclose.`}
            banglaSummary="বর্ণনামূলক পরিসংখ্যান (Mean, SD, Median) দেখায় অংশগ্রহণকারীরা গড়ে এআই-এর আন্তরিকতা, বিশ্বাস ও আত্মপ্রকাশে কত নম্বর দিয়েছেন এবং তাদের উত্তরের মধ্যে কতটা বৈচিত্র্য রয়েছে।"
          />
        </>
      )}
    </>
  );
}
