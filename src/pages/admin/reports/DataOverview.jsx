import React, { useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  ShieldAlert,
  Lock,
  Clock,
  HeartHandshake,
  ShieldCheck,
  MessageSquareHeart,
} from 'lucide-react';
import PageTitle from '../../../components/common/PageTitle';
import FilterBar from '../../../components/common/FilterBar';
import AdminStatCard from '../../../components/admin/AdminStatCard';
import AdminChart from '../../../components/admin/AdminChart';
import AdminEmptyState from '../../../components/admin/AdminEmptyState';
import ExportButtons from '../../../components/analysis/ExportButtons';
import { formatNumber } from '../../../utils/formatters/numberFormatter';
import { formatDateTime } from '../../../utils/formatters/dateFormatter';

export default function DataOverview({
  rawRows,
  analysis,
  filters,
  filterOptions,
  isFiltered,
  onUpdateFilter,
  onResetFilters,
  onRefresh,
}) {
  const { cleaning, descriptive, snapshotMeta } = analysis;

  const pcwMean = descriptive.compositeSummaries.find(c => c.code === 'PCW')?.meanSummary?.mean;
  const ptMean = descriptive.compositeSummaries.find(c => c.code === 'PT')?.meanSummary?.mean;
  const wsdMean = descriptive.compositeSummaries.find(c => c.code === 'WSD')?.meanSummary?.mean;

  const toChartSeries = freqTable =>
    (freqTable?.categories || [])
      .filter(c => c.count > 0)
      .map(c => ({ name: c.category, value: c.count }));

  const timelineData = useMemo(() => {
    const countsByDate = new Map();
    for (const row of cleaning.validRows) {
      if (!row?.submitted_at) continue;
      const day = String(row.submitted_at).slice(0, 10);
      countsByDate.set(day, (countsByDate.get(day) || 0) + 1);
    }
    return Array.from(countsByDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));
  }, [cleaning.validRows]);

  return (
    <>
      <PageTitle
        title="Research Data Overview"
        subtitle="Live study monitoring, participant composition, and construct summary scores grounded directly in Supabase records."
        meta={`Version: ${snapshotMeta.version} · Latest Analysis: ${formatDateTime(snapshotMeta.analyzedAt)}`}
        actions={
          cleaning.totalSubmitted > 0 ? (
            <ExportButtons rawRows={rawRows} analysis={analysis} />
          ) : null
        }
      />

      <FilterBar
        filters={filters}
        filterOptions={filterOptions}
        onUpdateFilter={onUpdateFilter}
        onResetFilters={onResetFilters}
        isFiltered={isFiltered}
      />

      {cleaning.totalSubmitted === 0 ? (
        <AdminEmptyState onRefresh={onRefresh} />
      ) : (
        <>
          <div className="admin-stat-grid">
            <AdminStatCard
              label="Total Submitted"
              value={cleaning.totalSubmitted}
              hint="Active rows retrieved"
              icon={Users}
            />
            <AdminStatCard
              label="Valid Analytical Sample (n)"
              value={cleaning.validCount}
              hint="Included in statistics"
              icon={CheckCircle2}
            />
            <AdminStatCard
              label="Excluded During Screening"
              value={cleaning.excludedCount}
              hint="Non-destructive flags"
              icon={ShieldAlert}
            />
            <AdminStatCard
              label="Locked for Analysis"
              value={cleaning.lockedCount}
              hint={`${cleaning.pendingWithdrawalCount} in 3-day window`}
              icon={Lock}
            />
            <AdminStatCard
              label="Pending Withdrawal Window"
              value={cleaning.pendingWithdrawalCount}
              hint="Within 3 calendar days"
              icon={Clock}
            />
            <AdminStatCard
              label="Mean Warmth (PCW)"
              value={formatNumber(pcwMean, 2)}
              hint="Scale 1.00 – 5.00 (4 items)"
              icon={HeartHandshake}
            />
            <AdminStatCard
              label="Mean Trust (PT)"
              value={formatNumber(ptMean, 2)}
              hint="Scale 1.00 – 5.00 (6 items)"
              icon={ShieldCheck}
            />
            <AdminStatCard
              label="Mean Self-Disclosure (WSD)"
              value={formatNumber(wsdMean, 2)}
              hint="Scale 1.00 – 5.00 (8 items)"
              icon={MessageSquareHeart}
            />
          </div>

          <div className="analysis-grid-2">
            <AdminChart
              title="Age Group Distribution"
              subtitle={`Valid responses (n = ${cleaning.validCount})`}
              type="bar"
              data={toChartSeries(descriptive.demographics.age_group)}
              filename="age_group_distribution.png"
            />
            <AdminChart
              title="Gender Distribution"
              subtitle={`Valid responses (n = ${cleaning.validCount})`}
              type="pie"
              data={toChartSeries(descriptive.demographics.gender)}
              filename="gender_distribution.png"
            />
            <AdminChart
              title="Education Level"
              subtitle={`Valid responses (n = ${cleaning.validCount})`}
              type="bar"
              data={toChartSeries(descriptive.demographics.education)}
              filename="education_distribution.png"
            />
            <AdminChart
              title="Occupation Breakdown"
              subtitle={`Valid responses (n = ${cleaning.validCount})`}
              type="horizontalBar"
              data={toChartSeries(descriptive.demographics.occupation)}
              filename="occupation_distribution.png"
            />
            <AdminChart
              title="Most Frequently Used Primary AI Tool"
              subtitle="Single-choice primary conversational AI tool"
              type="bar"
              data={toChartSeries(descriptive.aiUsage.primary_ai_tool)}
              filename="primary_ai_tool_distribution.png"
            />
            <AdminChart
              title="Conversational AI Usage Frequency"
              subtitle="How often participants interact with AI"
              type="bar"
              data={toChartSeries(descriptive.aiUsage.ai_frequency)}
              filename="ai_frequency_distribution.png"
            />
            <AdminChart
              title="Conversational AI Usage Duration"
              subtitle="Length of experience with conversational AI"
              type="bar"
              data={toChartSeries(descriptive.aiUsage.ai_duration)}
              filename="ai_duration_distribution.png"
            />
            <AdminChart
              title="Response Submission Trend Over Time"
              subtitle="Daily valid submissions (UTC date)"
              type="line"
              data={timelineData}
              xKey="date"
              yKey="count"
              filename="submission_trend_over_time.png"
            />
          </div>
        </>
      )}
    </>
  );
}
