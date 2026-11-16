import React from 'react';
import { getStyleCss } from '../../services/chapter4/apa7Formatter';
import APATableNote from './APATableNote';

/**
 * Reusable APA 7th Edition Figure Component
 * Line 1: Figure X (Bold, Flush-left, no colon or period, no first-line indentation)
 * Line 2: Figure Title (Italic, Title Case, Flush-left, no period at the end, no indentation)
 * Line 3+: Actual chart/image with `data-apa-figure-id` for high-DPI Word/PDF image capture
 * Below: Figure Note (Flush-left, no indentation, beginning with italicized "Note.")
 */
export default function APAFigure({
  figureId,
  number,
  title,
  note,
  apaSettings,
  children,
}) {
  const numberCss = getStyleCss(apaSettings, 'figureNumber');
  const titleCss = getStyleCss(apaSettings, 'figureTitle');
  const figAlign = apaSettings?.figureNumbering?.alignment || 'left';

  const cleanNumber = String(number || '').replace(/[:.]$/, '');
  const cleanTitle = String(title || '').replace(/\.$/, '');

  return (
    <figure
      className="apa-figure-block"
      style={{
        margin: '18px 0 22px',
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

      <div
        className="apa-figure-canvas"
        data-apa-figure-id={figureId}
        style={{
          marginLeft: figAlign === 'center' ? 'auto' : '0',
          marginRight: figAlign === 'center' ? 'auto' : '0',
        }}
      >
        {children}
      </div>

      <APATableNote note={note} apaSettings={apaSettings} styleKey="figureNote" />
    </figure>
  );
}
