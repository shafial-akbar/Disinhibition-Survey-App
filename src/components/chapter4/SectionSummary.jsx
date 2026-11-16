import React from 'react';
import Chapter4Section from './Chapter4Section';

/**
 * Section 4.8: Summary of Findings
 * Renders the closing academic summary of Chapter 4.
 */
export default function SectionSummary({
  narrative,
  apaSettings,
  onSaveSectionOverride,
  onResetSectionOverride,
}) {
  return (
    <Chapter4Section
      sectionId="4.8"
      domId="section-4-8"
      narrative={narrative}
      apaSettings={apaSettings}
      onSaveSectionOverride={onSaveSectionOverride}
      onResetSectionOverride={onResetSectionOverride}
    />
  );
}
