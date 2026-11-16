import React from 'react';
import { getStyleCss } from '../../services/chapter4/apa7Formatter';

/**
 * Reusable APA 7th Edition Table/Figure Note Component
 * Formats "Note." in italics followed by explanatory text.
 */
export default function APATableNote({ note, apaSettings, styleKey = 'tableNote' }) {
  if (!note) return null;
  const css = getStyleCss(apaSettings, styleKey);

  return (
    <p style={{ ...css, textIndent: '0in' }}>
      <span style={{ fontStyle: 'italic' }}>Note. </span>
      <span>{note}</span>
    </p>
  );
}
