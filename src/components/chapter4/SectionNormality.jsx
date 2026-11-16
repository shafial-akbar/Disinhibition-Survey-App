import React from 'react';
import APATable from './APATable';
import APAFigure from './APAFigure';
import ChartContainer from './ChartContainer';

/**
 * Part B of Reliability and Normality Analysis
 * Renders Table 7 (Shapiro-Wilk Normality Test) and Figures 7 to 12 using centralized numbering.
 */
export default function SectionNormality({ stats, catalog, apaSettings, hasData }) {
  if (!hasData) return null;

  const table7 = catalog?.table7;
  const F = catalog?.figures || {};

  const pcwHist = stats?.studyVariables?.find(v => v.code === 'PCW')?.histogram || [];
  const ptHist = stats?.studyVariables?.find(v => v.code === 'PT')?.histogram || [];
  const wsdHist = stats?.studyVariables?.find(v => v.code === 'WSD')?.histogram || [];

  const pcwQQ = stats?.normality?.scales?.find(s => s.code === 'PCW')?.qqPoints || [];
  const ptQQ = stats?.normality?.scales?.find(s => s.code === 'PT')?.qqPoints || [];
  const wsdQQ = stats?.normality?.scales?.find(s => s.code === 'WSD')?.qqPoints || [];

  return (
    <>
      {table7 && (
        <APATable
          number={table7.number}
          title={table7.title}
          headers={table7.headers}
          rows={table7.rows}
          note={table7.note}
          apaSettings={apaSettings}
        />
      )}

      <APAFigure
        figureId="fig-7"
        number={F.fig7?.number}
        title={F.fig7?.title}
        note={F.fig7?.note}
        apaSettings={apaSettings}
      >
        <ChartContainer type="histogram" data={pcwHist} xKey="rangeLabel" yKey="count" />
      </APAFigure>

      <APAFigure
        figureId="fig-8"
        number={F.fig8?.number}
        title={F.fig8?.title}
        note={F.fig8?.note}
        apaSettings={apaSettings}
      >
        <ChartContainer type="qq" data={pcwQQ} />
      </APAFigure>

      <APAFigure
        figureId="fig-9"
        number={F.fig9?.number}
        title={F.fig9?.title}
        note={F.fig9?.note}
        apaSettings={apaSettings}
      >
        <ChartContainer type="histogram" data={ptHist} xKey="rangeLabel" yKey="count" />
      </APAFigure>

      <APAFigure
        figureId="fig-10"
        number={F.fig10?.number}
        title={F.fig10?.title}
        note={F.fig10?.note}
        apaSettings={apaSettings}
      >
        <ChartContainer type="qq" data={ptQQ} />
      </APAFigure>

      <APAFigure
        figureId="fig-11"
        number={F.fig11?.number}
        title={F.fig11?.title}
        note={F.fig11?.note}
        apaSettings={apaSettings}
      >
        <ChartContainer type="histogram" data={wsdHist} xKey="rangeLabel" yKey="count" />
      </APAFigure>

      <APAFigure
        figureId="fig-12"
        number={F.fig12?.number}
        title={F.fig12?.title}
        note={F.fig12?.note}
        apaSettings={apaSettings}
      >
        <ChartContainer type="qq" data={wsdQQ} />
      </APAFigure>
    </>
  );
}
