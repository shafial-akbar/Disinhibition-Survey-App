import React from 'react';
import Chapter4Section from './Chapter4Section';
import APATable from './APATable';

/**
 * Section 4.1: Introduction and Data Screening
 * Renders academic narrative + Table 1 (Data Screening and Sample Retention Summary).
 */
export default function SectionDataScreening({
  narrative,
  catalog,
  apaSettings,
  hasData,
  onSaveSectionOverride,
  onResetSectionOverride,
}) {
  const table1 = catalog?.table1;

  return (
    <Chapter4Section
      sectionId="4.1"
      domId="section-4-1"
      narrative={narrative}
      apaSettings={apaSettings}
      onSaveSectionOverride={onSaveSectionOverride}
      onResetSectionOverride={onResetSectionOverride}
    >
      {hasData && table1 && (
        <APATable
          number={table1.number}
          title={table1.title}
          headers={table1.headers}
          rows={table1.rows}
          note={table1.note}
          apaSettings={apaSettings}
        />
      )}
    </Chapter4Section>
  );
}
