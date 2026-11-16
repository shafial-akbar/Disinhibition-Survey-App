import React from 'react';
import PageTitle from '../../../components/common/PageTitle';
import FilterBar from '../../../components/common/FilterBar';
import FrequencyTable from '../../../components/analysis/FrequencyTable';
import AdminChart from '../../../components/admin/AdminChart';
import AdminEmptyState from '../../../components/admin/AdminEmptyState';
import InterpretationBox from '../../../components/analysis/InterpretationBox';

export default function DemographicReport({
  analysis,
  filters,
  filterOptions,
  isFiltered,
  onUpdateFilter,
  onResetFilters,
  onRefresh,
}) {
  const { cleaning, descriptive, settings } = analysis;
  const demo = descriptive.demographics;

  const toSeries = tbl =>
    (tbl?.categories || []).filter(c => c.count > 0).map(c => ({ name: c.category, value: c.count }));

  return (
    <>
      <PageTitle
        title="Demographic Analysis (Sample Profile)"
        subtitle="Frequency distributions and APA demographic tables for Age Group, Gender, Education Level, and Occupation."
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
            <FrequencyTable title="Table 4.1a — Age Group Distribution" tableData={demo.age_group} />
            <AdminChart
              title="Age Group Distribution"
              type="bar"
              data={toSeries(demo.age_group)}
              filename="demographic_age_group.png"
            />

            <FrequencyTable title="Table 4.1b — Gender Distribution" tableData={demo.gender} />
            <AdminChart
              title="Gender Composition"
              type="pie"
              data={toSeries(demo.gender)}
              filename="demographic_gender.png"
            />

            <FrequencyTable title="Table 4.1c — Education Level" tableData={demo.education} />
            <AdminChart
              title="Education Level"
              type="bar"
              data={toSeries(demo.education)}
              filename="demographic_education.png"
            />

            <FrequencyTable title="Table 4.1d — Occupation" tableData={demo.occupation} />
            <AdminChart
              title="Occupation Breakdown"
              type="horizontalBar"
              data={toSeries(demo.occupation)}
              filename="demographic_occupation.png"
            />
          </div>

          <InterpretationBox
            showBanglaDefault={settings.showBanglaExplanations}
            whatItIs="Frequency tables count how many participants belong to each demographic category (n) along with exact percentages."
            whyUseIt="Psychology and social science theses report sample demographics first so readers know who participated and how broadly findings apply."
            howCalculated="Percentage = (Category Count / Total Sample n) × 100. Valid Percent uses only non-missing responses in the denominator."
            howToInterpret="Check whether any group dominates the sample (for example, university students aged 18–24) and note that in your Chapter 5 limitations."
            thesisText={`The final analytical sample consisted of N = ${cleaning.validCount} adult conversational AI users in Bangladesh. Demographic characteristics across age group, gender, educational attainment, and occupation are summarized in Table 4.1.`}
            banglaSummary="ডেমোগ্রাফিক বিশ্লেষণ অংশগ্রহণকারীদের বয়স, লিঙ্গ, শিক্ষাগত যোগ্যতা এবং পেশার সংখ্যা ও শতকরা হার দেখায়, যা গবেষণার নমুনার পরিচিতি তুলে ধরে।"
          />
        </>
      )}
    </>
  );
}
