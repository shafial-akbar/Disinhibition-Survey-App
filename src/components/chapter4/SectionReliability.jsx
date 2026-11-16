import React from 'react';
import APATable from './APATable';

/**
 * Part A of Section 4.5: Internal Consistency Reliability (Cronbach's Alpha)
 * Renders Table 5 (Scale Reliability Summary) and Table 6 (Item-Level Diagnostics across 18 items).
 */
export default function SectionReliability({ catalog, apaSettings, hasData }) {
  if (!hasData) return null;

  const table5 = catalog?.table5;
  const table6 = catalog?.table6;

  return (
    <>
      {table5 && (
        <APATable
          number={table5.number}
          title={table5.title}
          headers={table5.headers}
          rows={table5.rows}
          note={table5.note}
          apaSettings={apaSettings}
        />
      )}

      {table6 && (
        <APATable
          number={table6.number}
          title={table6.title}
          headers={table6.headers}
          rows={table6.rows}
          note={table6.note}
          apaSettings={apaSettings}
        />
      )}
    </>
  );
}
