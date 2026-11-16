/**
 * APA 7th Edition Formatting Settings Service
 * Manages default APA 7 presets, 20 configurable text styles, page setup,
 * page/table/figure numbering settings, global typography, paragraph indentation,
 * and persistent custom presets for the authenticated administrator.
 * Never modifies participant response records.
 */

const ACTIVE_SETTINGS_KEY = 'research_apa7_active_settings_v2';
const CUSTOM_PRESETS_KEY = 'research_apa7_custom_presets_v2';

export const SUPPORTED_FONTS = [
  'Times New Roman',
  'Arial',
  'Calibri',
  'Georgia',
  'Garamond',
  'Cambria',
  'DM Sans',
  'Manrope',
];

export const PAPER_SIZES = [
  { value: 'A4', label: 'A4 (210 × 297 mm / 8.27 × 11.69 in)', widthIn: 8.27, heightIn: 11.69 },
  { value: 'Letter', label: 'US Letter (8.5 × 11 in)', widthIn: 8.5, heightIn: 11.0 },
  { value: 'Legal', label: 'US Legal (8.5 × 14 in)', widthIn: 8.5, heightIn: 14.0 },
];

export const LINE_SPACING_OPTIONS = [
  { value: '2.0', label: 'Double (2.0 — APA 7 Default)' },
  { value: '1.5', label: '1.5' },
  { value: '1.15', label: '1.15' },
  { value: '1.0', label: 'Single (1.0)' },
  { value: 'custom', label: 'Custom' },
];

/**
 * Per APA 7th Edition requirements, body text alignment is left-aligned (ragged right);
 * justified alignment is never used.
 */
export const TEXT_ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Left (APA 7 Ragged-Right Default)' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

export const TABLE_BORDER_STYLE_OPTIONS = [
  { value: 'apa-horizontal', label: 'APA 7 Horizontal Rules Only (Top, Header-Bottom, Bottom)' },
  { value: 'minimal-horizontal', label: 'Light Horizontal Rules Only' },
];

export const FIGURE_ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Flush-Left (APA 7 Default)' },
  { value: 'center', label: 'Centered Canvas' },
];

/**
 * Metadata list for all 20 required configurable text styles.
 */
export const TEXT_STYLE_DEFINITIONS = [
  { key: 'documentTitle', label: '1. Document Title', group: 'Headings & Titles' },
  { key: 'chapterTitle', label: '2. Chapter Title (H1)', group: 'Headings & Titles' },
  { key: 'h1', label: '3. Heading 1 (APA Level 1)', group: 'Headings & Titles' },
  { key: 'h2', label: '4. Heading 2 (APA Level 2)', group: 'Headings & Titles' },
  { key: 'h3', label: '5. Heading 3 (APA Level 3)', group: 'Headings & Titles' },
  { key: 'h4', label: '6. Heading 4 (APA Level 4)', group: 'Headings & Titles' },
  { key: 'h5', label: '7. Heading 5 (APA Level 5)', group: 'Headings & Titles' },
  { key: 'h6', label: '8. Heading 6 (Sub-level)', group: 'Headings & Titles' },
  { key: 'normalParagraph', label: '9. Normal Paragraph', group: 'Body & Notes' },
  { key: 'tableNumber', label: '10. Table Number', group: 'Tables' },
  { key: 'tableTitle', label: '11. Table Title', group: 'Tables' },
  { key: 'tableHeader', label: '12. Table Header', group: 'Tables' },
  { key: 'tableBody', label: '13. Table Body', group: 'Tables' },
  { key: 'tableNote', label: '14. Table Note', group: 'Tables' },
  { key: 'figureNumber', label: '15. Figure Number', group: 'Figures' },
  { key: 'figureTitle', label: '16. Figure Title', group: 'Figures' },
  { key: 'figureNote', label: '17. Figure Note', group: 'Figures' },
  { key: 'footnote', label: '18. Footnote', group: 'Body & Notes' },
  { key: 'header', label: '19. Page Header', group: 'Headers & Footers' },
  { key: 'footer', label: '20. Page Footer', group: 'Headers & Footers' },
];

/**
 * Helper to create a single text style configuration object.
 * APA 7 Default: Times New Roman, 12 pt, 2.0 double spacing, 0 pt before/after, never ALL CAPS.
 */
function makeStyle(overrides = {}) {
  return {
    fontFamily: 'Times New Roman',
    fontSize: 12,
    bold: false,
    italic: false,
    underline: false,
    uppercase: false,
    textAlign: 'left',
    lineSpacing: 2.0,
    firstLineIndent: 0,
    spaceBefore: 0,
    spaceAfter: 0,
    ...overrides,
  };
}

/**
 * Official APA 7 Default Preset for the Institutional Thesis Report.
 */
export function createApa7DefaultSettings() {
  return {
    presetName: 'APA 7 Default',
    page: {
      paperSize: 'A4',
      orientation: 'portrait',
      margins: {
        top: 1.0,
        bottom: 1.0,
        left: 1.0,
        right: 1.0,
      },
    },
    pageNumbering: {
      position: 'top-right',
      format: 'arabic',
      startPageNumber: 1,
      showOnTitlePage: true,
    },
    tableNumbering: {
      startTableNumber: 1,
      numberingStyle: 'sequential',
      borderStyle: 'apa-horizontal',
    },
    figureNumbering: {
      startFigureNumber: 1,
      numberingStyle: 'sequential',
      alignment: 'left',
    },
    typography: {
      fontFamily: 'Times New Roman',
      fontSize: 12,
      lineSpacing: '2.0',
      customLineSpacing: 2.0,
      textAlign: 'left',
    },
    paragraph: {
      firstLineIndent: 0.5,
      leftIndent: 0,
      rightIndent: 0,
      spaceBefore: 0,
      spaceAfter: 0,
      lineSpacing: '2.0',
    },
    styles: {
      documentTitle: makeStyle({
        bold: true,
        fontSize: 12,
        textAlign: 'center',
        lineSpacing: 2.0,
        spaceBefore: 0,
        spaceAfter: 0,
      }),
      chapterTitle: makeStyle({
        bold: true,
        uppercase: false,
        fontSize: 12,
        textAlign: 'center',
        lineSpacing: 2.0,
        spaceBefore: 0,
        spaceAfter: 0,
      }),
      h1: makeStyle({
        bold: true,
        uppercase: false,
        fontSize: 12,
        textAlign: 'center',
        lineSpacing: 2.0,
        spaceBefore: 0,
        spaceAfter: 0,
      }),
      h2: makeStyle({
        bold: true,
        uppercase: false,
        fontSize: 12,
        textAlign: 'left',
        lineSpacing: 2.0,
        spaceBefore: 0,
        spaceAfter: 0,
      }),
      h3: makeStyle({
        bold: true,
        italic: true,
        uppercase: false,
        fontSize: 12,
        textAlign: 'left',
        lineSpacing: 2.0,
        spaceBefore: 0,
        spaceAfter: 0,
      }),
      h4: makeStyle({
        bold: true,
        uppercase: false,
        fontSize: 12,
        textAlign: 'left',
        lineSpacing: 2.0,
        firstLineIndent: 0.5,
        spaceBefore: 0,
        spaceAfter: 0,
      }),
      h5: makeStyle({
        bold: true,
        italic: true,
        uppercase: false,
        fontSize: 12,
        textAlign: 'left',
        lineSpacing: 2.0,
        firstLineIndent: 0.5,
        spaceBefore: 0,
        spaceAfter: 0,
      }),
      h6: makeStyle({
        italic: true,
        uppercase: false,
        fontSize: 12,
        textAlign: 'left',
        lineSpacing: 2.0,
        firstLineIndent: 0.5,
        spaceBefore: 0,
        spaceAfter: 0,
      }),
      normalParagraph: makeStyle({
        fontSize: 12,
        textAlign: 'left',
        lineSpacing: 2.0,
        firstLineIndent: 0.5,
        spaceBefore: 0,
        spaceAfter: 0,
      }),
      tableNumber: makeStyle({
        bold: true,
        fontSize: 12,
        textAlign: 'left',
        lineSpacing: 2.0,
        firstLineIndent: 0,
        spaceBefore: 0,
        spaceAfter: 0,
      }),
      tableTitle: makeStyle({
        italic: true,
        fontSize: 12,
        textAlign: 'left',
        lineSpacing: 2.0,
        firstLineIndent: 0,
        spaceBefore: 0,
        spaceAfter: 0,
      }),
      tableHeader: makeStyle({
        bold: true,
        fontSize: 12,
        textAlign: 'left',
        lineSpacing: 2.0,
        firstLineIndent: 0,
        spaceBefore: 0,
        spaceAfter: 0,
      }),
      tableBody: makeStyle({
        fontSize: 12,
        textAlign: 'left',
        lineSpacing: 2.0,
        firstLineIndent: 0,
        spaceBefore: 0,
        spaceAfter: 0,
      }),
      tableNote: makeStyle({
        fontSize: 12,
        textAlign: 'left',
        lineSpacing: 2.0,
        firstLineIndent: 0,
        spaceBefore: 0,
        spaceAfter: 0,
      }),
      figureNumber: makeStyle({
        bold: true,
        fontSize: 12,
        textAlign: 'left',
        lineSpacing: 2.0,
        firstLineIndent: 0,
        spaceBefore: 0,
        spaceAfter: 0,
      }),
      figureTitle: makeStyle({
        italic: true,
        fontSize: 12,
        textAlign: 'left',
        lineSpacing: 2.0,
        firstLineIndent: 0,
        spaceBefore: 0,
        spaceAfter: 0,
      }),
      figureNote: makeStyle({
        fontSize: 12,
        textAlign: 'left',
        lineSpacing: 2.0,
        firstLineIndent: 0,
        spaceBefore: 0,
        spaceAfter: 0,
      }),
      footnote: makeStyle({
        fontSize: 10,
        textAlign: 'left',
        lineSpacing: 2.0,
        firstLineIndent: 0.5,
        spaceBefore: 0,
        spaceAfter: 0,
      }),
      header: makeStyle({
        fontSize: 12,
        textAlign: 'right',
        lineSpacing: 2.0,
        firstLineIndent: 0,
        spaceBefore: 0,
        spaceAfter: 0,
      }),
      footer: makeStyle({
        fontSize: 12,
        textAlign: 'center',
        lineSpacing: 2.0,
        firstLineIndent: 0,
        spaceBefore: 0,
        spaceAfter: 0,
      }),
    },
  };
}

/**
 * Normalizes alignment so 'justify' is never used.
 */
function sanitizeAlignment(align, fallback = 'left') {
  if (align === 'center' || align === 'right' || align === 'left') {
    return align;
  }
  return fallback;
}

/**
 * Merges stored settings safely with APA 7 defaults so missing keys never break UI.
 */
export function mergeWithDefaultSettings(partial = {}) {
  const defaults = createApa7DefaultSettings();
  if (!partial || typeof partial !== 'object') return defaults;

  const mergedStyles = { ...defaults.styles };
  if (partial.styles && typeof partial.styles === 'object') {
    for (const key of Object.keys(defaults.styles)) {
      if (partial.styles[key]) {
        const merged = { ...defaults.styles[key], ...partial.styles[key] };
        merged.textAlign = sanitizeAlignment(merged.textAlign, defaults.styles[key].textAlign);
        mergedStyles[key] = merged;
      }
    }
  }

  return {
    ...defaults,
    ...partial,
    page: {
      ...defaults.page,
      ...(partial.page || {}),
      margins: {
        ...defaults.page.margins,
        ...(partial.page?.margins || {}),
      },
    },
    pageNumbering: {
      ...defaults.pageNumbering,
      ...(partial.pageNumbering || {}),
    },
    tableNumbering: {
      ...defaults.tableNumbering,
      ...(partial.tableNumbering || {}),
    },
    figureNumbering: {
      ...defaults.figureNumbering,
      ...(partial.figureNumbering || {}),
    },
    typography: {
      ...defaults.typography,
      ...(partial.typography || {}),
      textAlign: sanitizeAlignment(partial.typography?.textAlign, 'left'),
    },
    paragraph: {
      ...defaults.paragraph,
      ...(partial.paragraph || {}),
    },
    styles: mergedStyles,
  };
}

/**
 * Propagates global typography or paragraph setting updates to body/heading/table/figure styles.
 */
export function applyGlobalTypographyToStyles(settings, patchTypography = {}, patchParagraph = {}) {
  const nextTypography = {
    ...settings.typography,
    ...patchTypography,
  };
  nextTypography.textAlign = sanitizeAlignment(nextTypography.textAlign, 'left');

  const nextParagraph = { ...settings.paragraph, ...patchParagraph };

  const numericSpacing =
    nextTypography.lineSpacing === 'custom'
      ? Number(nextTypography.customLineSpacing) || 2.0
      : Number(nextTypography.lineSpacing) || 2.0;

  const updatedStyles = { ...settings.styles };

  for (const key of Object.keys(updatedStyles)) {
    const current = { ...updatedStyles[key] };
    if (patchTypography.fontFamily) {
      current.fontFamily = nextTypography.fontFamily;
    }
    if (patchTypography.fontSize !== undefined) {
      const sizeNum = Math.max(1, Math.min(100, Number(nextTypography.fontSize) || 12));
      current.fontSize = sizeNum;
    }
    if (patchTypography.lineSpacing !== undefined || patchTypography.customLineSpacing !== undefined) {
      current.lineSpacing = numericSpacing;
    }
    updatedStyles[key] = current;
  }

  // Apply paragraph-specific settings to normalParagraph
  updatedStyles.normalParagraph = {
    ...updatedStyles.normalParagraph,
    textAlign: sanitizeAlignment(nextTypography.textAlign, 'left'),
    firstLineIndent: Number(nextParagraph.firstLineIndent ?? 0.5),
    spaceBefore: Number(nextParagraph.spaceBefore ?? 0),
    spaceAfter: Number(nextParagraph.spaceAfter ?? 0),
    lineSpacing:
      nextParagraph.lineSpacing === 'custom'
        ? numericSpacing
        : Number(nextParagraph.lineSpacing) || numericSpacing,
  };

  return {
    ...settings,
    presetName: 'Custom Preset',
    typography: nextTypography,
    paragraph: nextParagraph,
    styles: updatedStyles,
  };
}

/**
 * Loads the currently saved APA 7 settings from localStorage, or returns APA 7 Default.
 */
export function loadActiveApa7Settings() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createApa7DefaultSettings();
  }
  try {
    const raw = window.localStorage.getItem(ACTIVE_SETTINGS_KEY);
    if (!raw) return createApa7DefaultSettings();
    return mergeWithDefaultSettings(JSON.parse(raw));
  } catch {
    return createApa7DefaultSettings();
  }
}

/**
 * Saves active APA 7 settings to localStorage.
 */
export function saveActiveApa7Settings(settings) {
  const clean = mergeWithDefaultSettings(settings);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(ACTIVE_SETTINGS_KEY, JSON.stringify(clean));
    } catch {
      // Ignore quota errors
    }
  }
  return clean;
}

/**
 * Resets active settings back to APA 7 Default.
 */
export function resetActiveApa7Settings() {
  const defaults = createApa7DefaultSettings();
  saveActiveApa7Settings(defaults);
  return defaults;
}

/**
 * Loads all user-saved custom presets from localStorage.
 */
export function loadSavedCustomPresets() {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_PRESETS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * Saves a named custom preset for quick reuse across thesis chapters.
 */
export function saveNamedCustomPreset(name, settings) {
  const cleanName = String(name || '').trim() || `Custom Preset (${new Date().toLocaleDateString()})`;
  const list = loadSavedCustomPresets();
  const preset = {
    id: `preset_${Date.now()}`,
    name: cleanName,
    savedAt: new Date().toISOString(),
    settings: mergeWithDefaultSettings({ ...settings, presetName: cleanName }),
  };
  const nextList = [preset, ...list.filter(p => p.name !== cleanName)].slice(0, 15);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(nextList));
    } catch {
      // Ignore quota errors
    }
  }
  return nextList;
}

/**
 * Deletes a saved custom preset by ID.
 */
export function deleteNamedCustomPreset(presetId) {
  const list = loadSavedCustomPresets().filter(p => p.id !== presetId);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(list));
    } catch {
      // Ignore
    }
  }
  return list;
}
