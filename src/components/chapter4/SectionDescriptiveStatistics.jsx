import React from 'react';
import Chapter4Section from './Chapter4Section';
import APATable from './APATable';

/**
 * Section 4.4: Descriptive Statistics of Study Variables
 * Renders academic narrative + Table 4 (Composite Mean Scores, SD, Median, Min, Max, Skewness, Kurtosis).
 */
export default function SectionDescriptiveStatistics({
  narrative,
  catalog,
  apaSettings,
  hasData,
  onSaveSectionOverride,
  onResetSectionOverride,
}) {
  const table4 = catalog?.table4;

  return (
    <Chapter4Section
      sectionId="4.4"
      domId="section-4-4"
      narrative={narrative}
      apaSettings={apaSettings}
      onSaveSectionOverride={onSaveSectionOverride}
      onResetSectionOverride={onResetSectionOverride}
    >
      {hasData && table4 && (
        <APATable
          number={table4.number}
          title={table4.title}
          headers={table4.headers}
          rows={table4.rows}
          note={table4.note}
          apaSettings={apaSettings}
        />
      )}
    </Chapter4Section>
  );
}
