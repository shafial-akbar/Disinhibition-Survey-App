import React from 'react';
import Chapter4Section from './Chapter4Section';
import APATable from './APATable';
import APAFigure from './APAFigure';
import ChartContainer from './ChartContainer';

/**
 * Section: Demographic Characteristics of Participants
 * Renders academic narrative + Table 2 + Figures 1 to 4 using centralized numbering.
 */
export default function SectionDemographics({
  narrative,
  stats,
  catalog,
  apaSettings,
  hasData,
  onSaveSectionOverride,
  onResetSectionOverride,
}) {
  const table2 = catalog?.table2;
  const F = catalog?.figures || {};

  const ageData = (stats?.demographics?.age_group?.categories || []).map(c => ({
    label: c.category,
    count: c.count,
  }));
  const genderData = (stats?.demographics?.gender?.categories || [])
    .filter(c => c.count > 0)
    .map(c => ({
      label: c.category,
      count: c.count,
    }));
  const eduData = (stats?.demographics?.education?.categories || []).map(c => ({
    label: c.category,
    count: c.count,
  }));
  const occData = (stats?.demographics?.occupation?.categories || []).map(c => ({
    label: c.category,
    count: c.count,
  }));

  return (
    <Chapter4Section
      sectionId="4.2"
      domId="section-4-2"
      narrative={narrative}
      apaSettings={apaSettings}
      onSaveSectionOverride={onSaveSectionOverride}
      onResetSectionOverride={onResetSectionOverride}
    >
      {hasData && table2 && (
        <>
          <APATable
            number={table2.number}
            title={table2.title}
            headers={table2.headers}
            rows={table2.rows}
            note={table2.note}
            apaSettings={apaSettings}
          />

          <APAFigure
            figureId="fig-1"
            number={F.fig1?.number}
            title={F.fig1?.title}
            note={F.fig1?.note}
            apaSettings={apaSettings}
          >
            <ChartContainer type="bar" data={ageData} xKey="label" yKey="count" />
          </APAFigure>

          <APAFigure
            figureId="fig-2"
            number={F.fig2?.number}
            title={F.fig2?.title}
            note={F.fig2?.note}
            apaSettings={apaSettings}
          >
            <ChartContainer type="pie" data={genderData} xKey="label" yKey="count" />
          </APAFigure>

          <APAFigure
            figureId="fig-3"
            number={F.fig3?.number}
            title={F.fig3?.title}
            note={F.fig3?.note}
            apaSettings={apaSettings}
          >
            <ChartContainer type="bar" data={eduData} xKey="label" yKey="count" />
          </APAFigure>

          <APAFigure
            figureId="fig-4"
            number={F.fig4?.number}
            title={F.fig4?.title}
            note={F.fig4?.note}
            apaSettings={apaSettings}
          >
            <ChartContainer type="horizontalBar" data={occData} xKey="label" yKey="count" />
          </APAFigure>
        </>
      )}
    </Chapter4Section>
  );
}
