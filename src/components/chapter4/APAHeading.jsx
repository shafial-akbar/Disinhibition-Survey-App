import React from 'react';
import { getStyleCss } from '../../services/chapter4/apa7Formatter';

/**
 * Reusable APA 7th Edition Heading Component
 * Supports style keys: 'documentTitle', 'chapterTitle', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'.
 */
export default function APAHeading({ level = 'h2', apaSettings, id, children }) {
  const css = getStyleCss(apaSettings, level);

  const tagMap = {
    documentTitle: 'h1',
    chapterTitle: 'h1',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
  };

  const Tag = tagMap[level] || 'h2';

  return (
    <Tag id={id} style={css}>
      {children}
    </Tag>
  );
}
