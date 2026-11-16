import React from 'react';
import { getStyleCss } from '../../services/chapter4/apa7Formatter';
import APATableNote from './APATableNote';

/**
 * Reusable APA 7th Edition Table Component
 * Line 1: Table X (bold, flush-left, no colon or period, no indentation)
 * Line 2: Table Title (italic, Title Case, flush-left, no period at the end, no indentation)
 * Line 3+: Horizontal-rule-only table (top border, header bottom border, bottom border; zero vertical/interior borders)
 * Below: Table Note (flush-left, no indentation, beginning with italicized "Note.")
 */
export default function APATable({
  number,
  title,
  headers = [],
  rows = [],
  note,
  apaSettings,
}) {
  const numberCss = getStyleCss(apaSettings, 'tableNumber');
  const titleCss = getStyleCss(apaSettings, 'tableTitle');
  const headerCss = getStyleCss(apaSettings, 'tableHeader');
  const bodyCss = getStyleCss(apaSettings, 'tableBody');

  const cleanNumber = String(number || '').replace(/[:.]$/, '');
  const cleanTitle = String(title || '').replace(/\.$/, '');

  return (
    <div
      className="apa-table-block"
      style={{
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
      }}
    >
      {cleanNumber && (
        <div
          style={{
            ...numberCss,
            textAlign: 'left',
            textIndent: '0in',
          }}
        >
          {cleanNumber}
        </div>
      )}
      {cleanTitle && (
        <div
          style={{
            ...titleCss,
            textAlign: 'left',
            textIndent: '0in',
          }}
        >
          {cleanTitle}
        </div>
      )}

      <div className="apa-table-scroll">
        <table className="apa-table">
          <thead>
            <tr>
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  style={{
                    ...headerCss,
                    textIndent: '0in',
                    textAlign: idx === 0 ? 'left' : headerCss.textAlign || 'left',
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(1, headers.length)}
                  style={{ ...bodyCss, textIndent: '0in', textAlign: 'center' }}
                >
                  No records available.
                </td>
              </tr>
            ) : (
              rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      style={{
                        ...bodyCss,
                        textIndent: '0in',
                        textAlign: cIdx === 0 ? 'left' : bodyCss.textAlign || 'left',
                      }}
                    >
                      {cell ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <APATableNote note={note} apaSettings={apaSettings} styleKey="tableNote" />
    </div>
  );
}
