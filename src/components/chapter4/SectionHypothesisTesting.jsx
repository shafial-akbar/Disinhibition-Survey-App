import React from 'react';
import Chapter4Section from './Chapter4Section';
import APATable from './APATable';

/**
 * Section 4.7: Hypothesis Testing
 * Renders academic narrative + Table 11 (Confirmatory Hypothesis Testing Summary for H1, H2, H3).
 */
export default function SectionHypothesisTesting({
  narrative,
  catalog,
  apaSettings,
  hasData,
  onSaveSectionOverride,
  onResetSectionOverride,
}) {
  const table11 = catalog?.table11;

  return (
    <Chapter4Section
      sectionId="4.7"
      domId="section-4-7"
      narrative={narrative}
      apaSettings={apaSettings}
      onSaveSectionOverride={onSaveSectionOverride}
      onResetSectionOverride={onResetSectionOverride}
    >
      {hasData && table11 && (
        <APATable
          number={table11.number}
          title={table11.title}
          headers={table11.headers}
          rows={table11.rows}
          note={table11.note}
          apaSettings={apaSettings}
        />
      )}
    </Chapter4Section>
  );
}
