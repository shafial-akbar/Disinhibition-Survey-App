/**
 * Centralized APA 7th Edition Page, Table, and Figure Numbering Service
 * Provides a single source of truth for page numbers, table numbers, figure numbers,
 * and in-text cross-references across Live Preview, Word (.docx), PDF, and Print Preview.
 */

export const PAGE_NUMBER_POSITIONS = [
  { value: 'top-right', label: 'Top Right (APA 7) — Default' },
  { value: 'top-left', label: 'Top Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-left', label: 'Bottom Left' },
];

export const PAGE_NUMBER_FORMATS = [
  { value: 'arabic', label: '1, 2, 3, 4... (Default)' },
  { value: 'roman-lower', label: 'i, ii, iii, iv...' },
  { value: 'roman-upper', label: 'I, II, III, IV...' },
  { value: 'alpha-lower', label: 'a, b, c, d...' },
  { value: 'alpha-upper', label: 'A, B, C, D...' },
];

export const NUMBERING_STYLE_OPTIONS = [
  { value: 'sequential', label: 'Sequential across entire document (Table 1, 2... — Default)' },
  { value: 'chapter', label: 'Chapter-based numbering (Table 4.1, 4.2...)' },
];

export const FIGURE_NUMBERING_STYLE_OPTIONS = [
  { value: 'sequential', label: 'Sequential across entire document (Figure 1, 2... — Default)' },
  { value: 'chapter', label: 'Chapter-based numbering (Figure 4.1, 4.2...)' },
];

/**
 * Converts a positive integer (1+) into a Roman numeral string.
 */
export function toRoman(num, uppercase = false) {
  const n = Math.max(1, Math.min(3999, Math.floor(Number(num) || 1)));
  const lookup = [
    ['M', 1000],
    ['CM', 900],
    ['D', 500],
    ['CD', 400],
    ['C', 100],
    ['XC', 90],
    ['L', 50],
    ['XL', 40],
    ['X', 10],
    ['IX', 9],
    ['V', 5],
    ['IV', 4],
    ['I', 1],
  ];
  let result = '';
  let remaining = n;
  for (const [roman, val] of lookup) {
    while (remaining >= val) {
      result += roman;
      remaining -= val;
    }
  }
  return uppercase ? result : result.toLowerCase();
}

/**
 * Parses a Roman numeral string (e.g. 'iv' or 'IV') into a positive integer.
 */
export function fromRoman(str) {
  const clean = String(str || '').trim().toUpperCase();
  if (!clean || !/^[MDCLXVI]+$/.test(clean)) return null;
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < clean.length; i += 1) {
    const curr = map[clean[i]];
    const next = map[clean[i + 1]] || 0;
    if (curr < next) {
      total -= curr;
    } else {
      total += curr;
    }
  }
  return total > 0 ? total : null;
}

/**
 * Converts a positive integer (1+) into an alphabetic sequence (1 -> a, 26 -> z, 27 -> aa).
 */
export function toAlphabetic(num, uppercase = false) {
  let n = Math.max(1, Math.floor(Number(num) || 1));
  let result = '';
  while (n > 0) {
    n -= 1;
    result = String.fromCharCode(97 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return uppercase ? result.toUpperCase() : result;
}

/**
 * Parses an alphabetic string ('a', 'B', etc.) into a positive integer.
 */
export function fromAlphabetic(str) {
  const clean = String(str || '').trim().toLowerCase();
  if (!clean || !/^[a-z]+$/.test(clean)) return null;
  let num = 0;
  for (let i = 0; i < clean.length; i += 1) {
    num = num * 26 + (clean.charCodeAt(i) - 96);
  }
  return num > 0 ? num : null;
}

/**
 * Parses a user-entered starting page value (integer, Roman numeral, or alphabetic)
 * into a 1-based positive integer.
 */
export function parseStartPageNumber(input, format = 'arabic') {
  if (typeof input === 'number' && Number.isFinite(input)) {
    return Math.max(1, Math.floor(input));
  }
  const str = String(input ?? '').trim();
  if (!str) return 1;
  const asInt = Number(str);
  if (Number.isFinite(asInt) && asInt >= 1) {
    return Math.floor(asInt);
  }
  if (format === 'roman-lower' || format === 'roman-upper') {
    const r = fromRoman(str);
    if (r) return r;
  }
  if (format === 'alpha-lower' || format === 'alpha-upper') {
    const a = fromAlphabetic(str);
    if (a) return a;
  }
  const fallbackRoman = fromRoman(str);
  if (fallbackRoman) return fallbackRoman;
  const fallbackAlpha = fromAlphabetic(str);
  if (fallbackAlpha) return fallbackAlpha;
  return 1;
}

/**
 * Formats a 1-based numeric page value according to the selected page number format.
 */
export function formatNumericValueByFormat(numericPage, format = 'arabic') {
  const n = Math.max(1, Math.floor(Number(numericPage) || 1));
  switch (format) {
    case 'roman-lower':
      return toRoman(n, false);
    case 'roman-upper':
      return toRoman(n, true);
    case 'alpha-lower':
      return toAlphabetic(n, false);
    case 'alpha-upper':
      return toAlphabetic(n, true);
    case 'arabic':
    default:
      return String(n);
  }
}

/**
 * Computes the formatted page number string for a given 0-based page offset.
 * If pageOffset === 0 (first/title page of the chapter) and showOnTitlePage === false,
 * returns '' while pageOffset === 1 still continues at startPageNumber + 1.
 */
export function formatPageNumberAtOffset(pageOffset = 0, pageNumbering = {}) {
  const showOnFirst = pageNumbering?.showOnTitlePage !== false;
  if (pageOffset === 0 && !showOnFirst) {
    return '';
  }
  const startNum = parseStartPageNumber(
    pageNumbering?.startPageNumber ?? 1,
    pageNumbering?.format || 'arabic'
  );
  const actualNumber = startNum + Math.max(0, Math.floor(pageOffset));
  return formatNumericValueByFormat(actualNumber, pageNumbering?.format || 'arabic');
}

/**
 * Returns the formatted label for the k-th table in Chapter 4 (1-indexed: 1..11).
 * Independent of Figure numbering.
 */
export function getTableLabel(ordinalIndex = 1, apaSettings = {}) {
  const tblCfg = apaSettings?.tableNumbering || {};
  const startNum = Math.max(1, Math.floor(Number(tblCfg.startTableNumber) || 1));
  const computedNum = startNum + Math.max(0, Math.floor(ordinalIndex) - 1);

  if (tblCfg.numberingStyle === 'chapter') {
    return `Table 4.${computedNum}`;
  }
  return `Table ${computedNum}`;
}

/**
 * Returns the raw number string for the k-th table (e.g., "1", "9", or "4.1").
 */
export function getTableNumberToken(ordinalIndex = 1, apaSettings = {}) {
  const tblCfg = apaSettings?.tableNumbering || {};
  const startNum = Math.max(1, Math.floor(Number(tblCfg.startTableNumber) || 1));
  const computedNum = startNum + Math.max(0, Math.floor(ordinalIndex) - 1);
  return tblCfg.numberingStyle === 'chapter' ? `4.${computedNum}` : String(computedNum);
}

/**
 * Returns the formatted label for the k-th figure in Chapter 4 (1-indexed: 1..16).
 * Independent of Table numbering.
 */
export function getFigureLabel(ordinalIndex = 1, apaSettings = {}) {
  const figCfg = apaSettings?.figureNumbering || {};
  const startNum = Math.max(1, Math.floor(Number(figCfg.startFigureNumber) || 1));
  const computedNum = startNum + Math.max(0, Math.floor(ordinalIndex) - 1);

  if (figCfg.numberingStyle === 'chapter') {
    return `Figure 4.${computedNum}`;
  }
  return `Figure ${computedNum}`;
}

/**
 * Returns the raw number string for the k-th figure (e.g., "1", "6", or "4.1").
 */
export function getFigureNumberToken(ordinalIndex = 1, apaSettings = {}) {
  const figCfg = apaSettings?.figureNumbering || {};
  const startNum = Math.max(1, Math.floor(Number(figCfg.startFigureNumber) || 1));
  const computedNum = startNum + Math.max(0, Math.floor(ordinalIndex) - 1);
  return figCfg.numberingStyle === 'chapter' ? `4.${computedNum}` : String(computedNum);
}

/**
 * Builds the complete dictionary of Table and Figure labels and in-text cross-reference helpers
 * for Chapter 4 so that changing startTableNumber or startFigureNumber updates all labels and text.
 */
export function buildChapter4NumberingMap(apaSettings = {}) {
  const tables = {};
  for (let i = 1; i <= 11; i += 1) {
    tables[`t${i}`] = getTableLabel(i, apaSettings);
    tables[`t${i}Num`] = getTableNumberToken(i, apaSettings);
  }

  const figures = {};
  for (let j = 1; j <= 16; j += 1) {
    figures[`f${j}`] = getFigureLabel(j, apaSettings);
    figures[`f${j}Num`] = getFigureNumberToken(j, apaSettings);
  }

  return {
    tables,
    figures,
    tablePair: (a, b) =>
      `Tables ${getTableNumberToken(a, apaSettings)} and ${getTableNumberToken(b, apaSettings)}`,
    tableRange: (a, b) =>
      `Tables ${getTableNumberToken(a, apaSettings)} to ${getTableNumberToken(b, apaSettings)}`,
    figurePair: (a, b) =>
      `Figures ${getFigureNumberToken(a, apaSettings)} and ${getFigureNumberToken(b, apaSettings)}`,
    figureRange: (a, b) =>
      `Figures ${getFigureNumberToken(a, apaSettings)} to ${getFigureNumberToken(b, apaSettings)}`,
  };
}
