import React from 'react';
import { getPaperDimensions, getStyleCss } from '../../services/chapter4/apa7Formatter';
import {
  formatPageNumberAtOffset,
  getTableLabel,
  getFigureLabel,
} from '../../services/chapter4/apa7NumberingService';

/**
 * Live Document Preview Panel inside the APA 7 Formatting Settings Drawer.
 * Updates immediately whenever the user changes page setup, page/table/figure numbering,
 * general typography, heading styles, or table/figure formatting.
 */
export default function LiveDocumentPreview({ draftSettings }) {
  const dims = getPaperDimensions(draftSettings);
  const headerCss = getStyleCss(draftSettings, 'header');
  const h1Css = getStyleCss(draftSettings, 'h1');
  const h2Css = getStyleCss(draftSettings, 'h2');
  const h3Css = getStyleCss(draftSettings, 'h3');
  const paraCss = getStyleCss(draftSettings, 'normalParagraph');
  const tblNumCss = getStyleCss(draftSettings, 'tableNumber');
  const tblTitleCss = getStyleCss(draftSettings, 'tableTitle');
  const tblHeaderCss = getStyleCss(draftSettings, 'tableHeader');
  const tblBodyCss = getStyleCss(draftSettings, 'tableBody');
  const tblNoteCss = getStyleCss(draftSettings, 'tableNote');
  const figNumCss = getStyleCss(draftSettings, 'figureNumber');
  const figTitleCss = getStyleCss(draftSettings, 'figureTitle');
  const figNoteCss = getStyleCss(draftSettings, 'figureNote');
  const footerCss = getStyleCss(draftSettings, 'footer');

  const pageNumCfg = draftSettings?.pageNumbering || {};
  const pagePos = pageNumCfg.position || 'top-right';
  const isTopPageNum = pagePos.startsWith('top');
  const page1Str = formatPageNumberAtOffset(0, pageNumCfg);
  const page2Str = formatPageNumberAtOffset(1, pageNumCfg);

  const firstTableLabel = getTableLabel(1, draftSettings);
  const firstFigureLabel = getFigureLabel(1, draftSettings);

  return (
    <div className="apa-preview-pane">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
          fontWeight: 700,
          color: '#334155',
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        <span>Live Manuscript Preview</span>
        <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b' }}>
          {dims.paperSize} · {dims.orientation.toUpperCase()} · Page 1: {page1Str || 'Hidden'} → Page 2: {page2Str}
        </span>
      </div>

      <div
        className="apa-preview-sheet-mini"
        style={{
          padding: `${Math.max(12, dims.margins.top * 20)}px ${Math.max(12, dims.margins.right * 20)}px ${Math.max(12, dims.margins.bottom * 20)}px ${Math.max(12, dims.margins.left * 20)}px`,
        }}
      >
        {isTopPageNum && (
          <div
            style={{
              ...headerCss,
              textIndent: '0in',
              textAlign: pagePos === 'top-left' ? 'left' : 'right',
              borderBottom: '1px dashed #e2e8f0',
              paddingBottom: 4,
              marginBottom: 8,
            }}
          >
            {page1Str || '(Hidden on Page 1)'}
          </div>
        )}

        {/* Single-line Chapter Title (H1) */}
        <div style={h1Css}>Chapter 4: Results</div>

        {/* Flush-left Title Case H2 without numerical prefix */}
        <div style={h2Css}>Descriptive Statistics of Study Variables</div>

        {/* Flush-left Bold Italic Title Case H3 */}
        <div style={h3Css}>Scale Central Tendency and Dispersion</div>

        <p style={paraCss}>
          Composite mean scores were computed for Perceived Conversational Warmth (PCW), Perceived
          Trust (PT), and Willingness to Self-Disclose (WSD) across the analytical sample ({firstTableLabel} and {firstFigureLabel}).
        </p>

        <div style={{ marginTop: 8 }}>
          <div style={{ ...tblNumCss, textAlign: 'left', textIndent: '0in' }}>
            {firstTableLabel}
          </div>
          <div style={{ ...tblTitleCss, textAlign: 'left', textIndent: '0in' }}>
            Descriptive Statistics of Study Variables
          </div>
          <table className="apa-table" style={{ marginTop: 4 }}>
            <thead>
              <tr>
                <th style={{ ...tblHeaderCss, textIndent: '0in' }}>Construct</th>
                <th style={{ ...tblHeaderCss, textIndent: '0in' }}>Items</th>
                <th style={{ ...tblHeaderCss, textIndent: '0in' }}>Range</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...tblBodyCss, textIndent: '0in' }}>Perceived Warmth (PCW)</td>
                <td style={{ ...tblBodyCss, textIndent: '0in' }}>4</td>
                <td style={{ ...tblBodyCss, textIndent: '0in' }}>1.00–5.00</td>
              </tr>
              <tr>
                <td style={{ ...tblBodyCss, textIndent: '0in' }}>Perceived Trust (PT)</td>
                <td style={{ ...tblBodyCss, textIndent: '0in' }}>6</td>
                <td style={{ ...tblBodyCss, textIndent: '0in' }}>1.00–5.00</td>
              </tr>
            </tbody>
          </table>
          <p style={{ ...tblNoteCss, textAlign: 'left', textIndent: '0in' }}>
            <span style={{ fontStyle: 'italic' }}>Note. </span>
            PCW = Perceived Conversational Warmth; PT = Perceived Trust; WSD = Willingness to Self-Disclose.
          </p>
        </div>

        <div style={{ marginTop: 8 }}>
          <div style={{ ...figNumCss, textAlign: 'left', textIndent: '0in' }}>
            {firstFigureLabel}
          </div>
          <div style={{ ...figTitleCss, textAlign: 'left', textIndent: '0in' }}>
            Age Group Distribution of Participants
          </div>
          <p style={{ ...figNoteCss, textAlign: 'left', textIndent: '0in' }}>
            <span style={{ fontStyle: 'italic' }}>Note. </span>
            Frequencies of valid respondents across age categories.
          </p>
        </div>

        {!isTopPageNum && (
          <div
            style={{
              ...footerCss,
              textIndent: '0in',
              textAlign:
                pagePos === 'bottom-left'
                  ? 'left'
                  : pagePos === 'bottom-center'
                  ? 'center'
                  : 'right',
              borderTop: '1px dashed #e2e8f0',
              paddingTop: 6,
              marginTop: 10,
            }}
          >
            {page1Str || '(Hidden on Page 1)'}
          </div>
        )}
      </div>
    </div>
  );
}
