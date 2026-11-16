import { PAPER_SIZES, createApa7DefaultSettings } from './apa7SettingsService.js';

/**
 * APA 7th Edition Formatting & Style Conversion Utility
 * Converts APA 7 settings into CSS inline styles, page dimensions, and APA statistical strings.
 */

/**
 * Returns paper width, height, and margin dimensions in inches and CSS pixels (at 96 DPI).
 */
export function getPaperDimensions(settings) {
  const safe = settings || createApa7DefaultSettings();
  const paperObj = PAPER_SIZES.find(p => p.value === safe.page?.paperSize) || PAPER_SIZES[0];
  const isLandscape = safe.page?.orientation === 'landscape';

  const widthIn = isLandscape ? paperObj.heightIn : paperObj.widthIn;
  const heightIn = isLandscape ? paperObj.widthIn : paperObj.heightIn;

  const margins = {
    top: Math.max(0.25, Math.min(3, Number(safe.page?.margins?.top ?? 1))),
    bottom: Math.max(0.25, Math.min(3, Number(safe.page?.margins?.bottom ?? 1))),
    left: Math.max(0.25, Math.min(3, Number(safe.page?.margins?.left ?? 1))),
    right: Math.max(0.25, Math.min(3, Number(safe.page?.margins?.right ?? 1))),
  };

  return {
    paperSize: paperObj.value,
    orientation: isLandscape ? 'landscape' : 'portrait',
    widthIn,
    heightIn,
    widthPx: Math.round(widthIn * 96),
    minHeightPx: Math.round(heightIn * 96),
    margins,
    paddingCss: `${margins.top}in ${margins.right}in ${margins.bottom}in ${margins.left}in`,
  };
}

/**
 * Converts one of the 20 text style configurations into a React CSS style object.
 * Never allows justified alignment per APA 7 rules.
 */
export function getStyleCss(settings, styleKey) {
  const safe = settings || createApa7DefaultSettings();
  const styleCfg = safe.styles?.[styleKey] || safe.styles?.normalParagraph || {};
  const paragraphCfg = safe.paragraph || {};

  const fontSizePt = Math.max(1, Math.min(100, Number(styleCfg.fontSize) || 12));
  const lineSpacing = Number(styleCfg.lineSpacing) || 2.0;
  const firstLineIndentIn = Number(styleCfg.firstLineIndent) || 0;
  const leftIndentIn = styleKey === 'normalParagraph' ? Number(paragraphCfg.leftIndent) || 0 : 0;
  const rightIndentIn = styleKey === 'normalParagraph' ? Number(paragraphCfg.rightIndent) || 0 : 0;
  const spaceBeforePt = Number(styleCfg.spaceBefore) || 0;
  const spaceAfterPt = Number(styleCfg.spaceAfter) || 0;

  const rawAlign = styleCfg.textAlign || 'left';
  const safeAlign = rawAlign === 'justify' ? 'left' : rawAlign;

  return {
    fontFamily: `"${styleCfg.fontFamily || 'Times New Roman'}", Times, serif`,
    fontSize: `${fontSizePt}pt`,
    fontWeight: styleCfg.bold ? 700 : 400,
    fontStyle: styleCfg.italic ? 'italic' : 'normal',
    textDecoration: styleCfg.underline ? 'underline' : 'none',
    textTransform: styleCfg.uppercase ? 'uppercase' : 'none',
    textAlign: safeAlign,
    lineHeight: String(lineSpacing),
    textIndent: firstLineIndentIn > 0 ? `${firstLineIndentIn}in` : '0in',
    marginLeft: leftIndentIn > 0 ? `${leftIndentIn}in` : '0in',
    marginRight: rightIndentIn > 0 ? `${rightIndentIn}in` : '0in',
    marginTop: `${spaceBeforePt}pt`,
    marginBottom: `${spaceAfterPt}pt`,
    color: '#000000',
  };
}

/**
 * Formats a number to fixed decimal places, returning '—' when null/NaN.
 */
export function formatApaStat(value, decimals = 2) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return '—';
  }
  return Number(value).toFixed(decimals);
}

/**
 * Formats a correlation or alpha coefficient without a leading zero (per APA 7: r = .54, α = .82).
 */
export function formatApaNoLeadingZero(value, decimals = 2) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return '—';
  }
  const num = Number(value);
  const fixed = num.toFixed(decimals);
  if (Math.abs(num) < 1) {
    return fixed.replace(/^0\./, '.').replace(/^-0\./, '-.');
  }
  return fixed;
}

/**
 * Formats a two-tailed p-value per APA 7 rules:
 * Exact 3 decimals without leading zero (e.g., ".042"), or "< .001" if below 0.001.
 * When withOperator = true, returns "< .001" or "= .042" so "p ${formatApaPValue(p, true)}"
 * always renders "p < .001" or "p = .042" (never "p = < .001").
 */
export function formatApaPValue(pValue, withOperator = false) {
  if (pValue === null || pValue === undefined || !Number.isFinite(Number(pValue))) {
    return withOperator ? '= —' : '—';
  }
  const p = Number(pValue);
  if (p < 0.001) {
    return '< .001';
  }
  const formatted = p.toFixed(3).replace(/^0\./, '.');
  return withOperator ? `= ${formatted}` : formatted;
}
