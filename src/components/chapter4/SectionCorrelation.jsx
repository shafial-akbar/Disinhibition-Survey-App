import React from 'react';
import Chapter4Section from './Chapter4Section';
import APATable from './APATable';
import APAFigure from './APAFigure';
import ChartContainer from './ChartContainer';

/**
 * Section: Correlation Analysis
 * Renders academic narrative + Tables 8 to 10 + Figures 13 to 16 using centralized numbering.
 */
export default function SectionCorrelation({
  narrative,
  stats,
  catalog,
  apaSettings,
  hasData,
  onSaveSectionOverride,
  onResetSectionOverride,
}) {
  const table8 = catalog?.table8;
  const table9 = catalog?.table9;
  const table10 = catalog?.table10;
  const F = catalog?.figures || {};

  const pairH1 = stats?.correlation?.pairs?.find(p => p.id === 'H1');
  const pairH2 = stats?.correlation?.pairs?.find(p => p.id === 'H2');
  const pairH3 = stats?.correlation?.pairs?.find(p => p.id === 'H3');

  return (
    <Chapter4Section
      sectionId="4.6"
      domId="section-4-6"
      narrative={narrative}
      apaSettings={apaSettings}
      onSaveSectionOverride={onSaveSectionOverride}
      onResetSectionOverride={onResetSectionOverride}
    >
      {hasData && (
        <>
          {table8 && (
            <APATable
              number={table8.number}
              title={table8.title}
              headers={table8.headers}
              rows={table8.rows}
              note={table8.note}
              apaSettings={apaSettings}
            />
          )}

          {table9 && (
            <APATable
              number={table9.number}
              title={table9.title}
              headers={table9.headers}
              rows={table9.rows}
              note={table9.note}
              apaSettings={apaSettings}
            />
          )}

          {table10 && (
            <APATable
              number={table10.number}
              title={table10.title}
              headers={table10.headers}
              rows={table10.rows}
              note={table10.note}
              apaSettings={apaSettings}
            />
          )}

          <APAFigure
            figureId="fig-13"
            number={F.fig13?.number}
            title={F.fig13?.title}
            note={F.fig13?.note}
            apaSettings={apaSettings}
          >
            <ChartContainer
              type="heatmap"
              matrixCodes={stats?.correlation?.codes || ['PCW', 'PT', 'WSD']}
              matrixData={stats?.correlation?.pearsonMatrix || {}}
            />
          </APAFigure>

          <APAFigure
            figureId="fig-14"
            number={F.fig14?.number}
            title={F.fig14?.title}
            note={F.fig14?.note}
            apaSettings={apaSettings}
          >
            <ChartContainer
              type="scatter"
              data={pairH1?.scatterPoints || []}
              regression={pairH1?.regression}
              xLabel="Perceived Conversational Warmth (PCW)"
              yLabel="Perceived Trust (PT)"
            />
          </APAFigure>

          <APAFigure
            figureId="fig-15"
            number={F.fig15?.number}
            title={F.fig15?.title}
            note={F.fig15?.note}
            apaSettings={apaSettings}
          >
            <ChartContainer
              type="scatter"
              data={pairH2?.scatterPoints || []}
              regression={pairH2?.regression}
              xLabel="Perceived Trust (PT)"
              yLabel="Willingness to Self-Disclose (WSD)"
            />
          </APAFigure>

          <APAFigure
            figureId="fig-16"
            number={F.fig16?.number}
            title={F.fig16?.title}
            note={F.fig16?.note}
            apaSettings={apaSettings}
          >
            <ChartContainer
              type="scatter"
              data={pairH3?.scatterPoints || []}
              regression={pairH3?.regression}
              xLabel="Perceived Conversational Warmth (PCW)"
              yLabel="Willingness to Self-Disclose (WSD)"
            />
          </APAFigure>
        </>
      )}
    </Chapter4Section>
  );
}
