import React from 'react';
import Chapter4Section from './Chapter4Section';
import APATable from './APATable';
import APAFigure from './APAFigure';
import ChartContainer from './ChartContainer';

/**
 * Section: Conversational AI Usage Characteristics
 * Renders academic narrative + Table 3 + Figures 5 and 6 using centralized numbering.
 */
export default function SectionAIUsage({
  narrative,
  stats,
  catalog,
  apaSettings,
  hasData,
  onSaveSectionOverride,
  onResetSectionOverride,
}) {
  const table3 = catalog?.table3;
  const F = catalog?.figures || {};

  const primaryToolData = (stats?.aiUsage?.primary_ai_tool?.categories || []).map(c => ({
    label: c.category,
    count: c.count,
  }));
  const freqData = (stats?.aiUsage?.ai_frequency?.categories || []).map(c => ({
    label: c.category,
    count: c.count,
  }));

  return (
    <Chapter4Section
      sectionId="4.3"
      domId="section-4-3"
      narrative={narrative}
      apaSettings={apaSettings}
      onSaveSectionOverride={onSaveSectionOverride}
      onResetSectionOverride={onResetSectionOverride}
    >
      {hasData && table3 && (
        <>
          <APATable
            number={table3.number}
            title={table3.title}
            headers={table3.headers}
            rows={table3.rows}
            note={table3.note}
            apaSettings={apaSettings}
          />

          <APAFigure
            figureId="fig-5"
            number={F.fig5?.number}
            title={F.fig5?.title}
            note={F.fig5?.note}
            apaSettings={apaSettings}
          >
            <ChartContainer type="horizontalBar" data={primaryToolData} xKey="label" yKey="count" />
          </APAFigure>

          <APAFigure
            figureId="fig-6"
            number={F.fig6?.number}
            title={F.fig6?.title}
            note={F.fig6?.note}
            apaSettings={apaSettings}
          >
            <ChartContainer type="bar" data={freqData} xKey="label" yKey="count" />
          </APAFigure>
        </>
      )}
    </Chapter4Section>
  );
}
