import React from 'react';
import { getStyleCss } from '../../services/chapter4/apa7Formatter';

/**
 * Reusable APA 7th Edition Body Paragraph Component
 * Applies configured font family, size, line spacing, alignment, and 0.5in first-line indent.
 */
export default function APAParagraph({ apaSettings, styleKey = 'normalParagraph', children }) {
  if (!children) return null;
  const css = getStyleCss(apaSettings, styleKey);

  return <p style={css}>{children}</p>;
}
