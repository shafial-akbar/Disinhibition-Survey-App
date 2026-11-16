import React from 'react';
import PageTitle from '../../../components/common/PageTitle';
import FilterBar from '../../../components/common/FilterBar';
import FrequencyTable from '../../../components/analysis/FrequencyTable';
import AdminChart from '../../../components/admin/AdminChart';
import AdminEmptyState from '../../../components/admin/AdminEmptyState';
import InterpretationBox from '../../../components/analysis/InterpretationBox';

export default function AIUsageReport({
  analysis,
  filters,
  filterOptions,
  isFiltered,
  onUpdateFilter,
  onResetFilters,
  onRefresh,
}) {
  const { cleaning, descriptive, settings } = analysis;
  const ai = descriptive.aiUsage;

  const toSeries = tbl =>
    (tbl?.categories || []).filter(c => c.count > 0).map(c => ({ name: c.category, value: c.count }));
  const toMultiSeries = tbl =>
    (tbl?.options || []).map(o => ({ name: o.option, value: o.count }));

  return (
    <>
      <PageTitle
        title="Conversational AI Usage Analysis"
        subtitle="Primary conversational AI tool, all tools ever used, usage frequency, duration, familiarity, and multi-select purposes."
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
          <div className="analysis-grid-2">
            <FrequencyTable
              title="Table 4.2a — Most Frequently Used Primary AI Tool"
              tableData={ai.primary_ai_tool}
            />
            <AdminChart
              title="Primary AI Tool"
              type="bar"
              data={toSeries(ai.primary_ai_tool)}
              filename="ai_primary_tool.png"
            />

            <FrequencyTable
              title="Table 4.2b — All Conversational AI Tools Used (Multi-Select)"
              tableData={ai.ai_tools}
              isMultiSelect
            />
            <AdminChart
              title="All AI Tools Used (Multi-Select Count)"
              type="horizontalBar"
              data={toMultiSeries(ai.ai_tools)}
              filename="ai_tools_multiselect.png"
            />

            <FrequencyTable title="Table 4.2c — Usage Frequency" tableData={ai.ai_frequency} />
            <AdminChart
              title="AI Usage Frequency"
              type="bar"
              data={toSeries(ai.ai_frequency)}
              filename="ai_frequency.png"
            />

            <FrequencyTable title="Table 4.2d — Usage Duration" tableData={ai.ai_duration} />
            <AdminChart
              title="AI Usage Duration"
              type="bar"
              data={toSeries(ai.ai_duration)}
              filename="ai_duration.png"
            />

            <FrequencyTable title="Table 4.2e — Familiarity with Conversational AI" tableData={ai.ai_familiarity} />
            <FrequencyTable
              title="Table 4.2f — Purpose of Using Conversational AI (Multi-Select)"
              tableData={ai.ai_purpose}
              isMultiSelect
            />
          </div>

          <InterpretationBox
            showBanglaDefault={settings.showBanglaExplanations}
            whatItIs="This report breaks down how participants interact with conversational AI tools, separating single-choice questions from multi-select checklists."
            whyUseIt="Because questionnaire items ask participants to evaluate the AI tool they use most frequently, reporting their primary tool, experience duration, and purpose provides essential context."
            howCalculated="For single-choice fields, percentages sum to 100%. For multi-select fields (Tools Used, Purpose), '% of Respondents' divides each option count by N (so percentages can exceed 100%), while '% of Selections' divides by total boxes checked."
            howToInterpret="Notice which primary tool dominates (e.g., ChatGPT) and whether participants are mostly daily/experienced users."
            thesisText={`Participants' conversational AI usage patterns (n = ${cleaning.validCount}) are summarized across primary AI platform, usage frequency, experience duration, self-reported familiarity, and multi-select purposes of use.`}
            banglaSummary="এই অংশে অংশগ্রহণকারীরা কোন এআই টুল সবচেয়ে বেশি ব্যবহার করেন, কত দিন ধরে এবং কী উদ্দেশ্যে ব্যবহার করেন তার বিস্তারিত পরিসংখ্যান দেখানো হয়েছে।"
          />
        </>
      )}
    </>
  );
}
