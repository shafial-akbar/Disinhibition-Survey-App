import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ImageRun,
  PageOrientation,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
} from 'docx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toPng } from 'html-to-image';
import { QUESTIONNAIRE_CONFIG } from '../../config/questionnaireConfig.js';
import {
  getPaperDimensions,
  formatApaStat,
  formatApaNoLeadingZero,
  formatApaPValue,
} from './apa7Formatter.js';
import {
  buildChapter4NumberingMap,
  parseStartPageNumber,
  formatPageNumberAtOffset,
} from './apa7NumberingService.js';
import { formatCI } from '../../utils/formatters/numberFormatter.js';

/**
 * Chapter 4 Export Service (APA 7th Edition Word .docx & PDF)
 * Preserves paper size, orientation, margins, font family, font size, 2.0 double line spacing,
 * paragraph indentation, page numbering, independent table/figure numbering,
 * single-line H1 ("Chapter 4: Results"), Title Case H2 headings without numerical prefixes,
 * horizontal-rule APA tables, and inline high-resolution figures.
 */

function inchesToTwips(inches) {
  return Math.round((Number(inches) || 0) * 1440);
}

function ptToTwips(pt) {
  return Math.round((Number(pt) || 0) * 20);
}

/**
 * Maps alignment to docx AlignmentType. Never allows justified alignment per APA 7 rules.
 */
function mapDocxAlignment(align) {
  if (align === 'center') return AlignmentType.CENTER;
  if (align === 'right') return AlignmentType.RIGHT;
  return AlignmentType.LEFT;
}

function mapDocxNumberFormat(format) {
  switch (format) {
    case 'roman-lower':
      return NumberFormat.LOWER_ROMAN;
    case 'roman-upper':
      return NumberFormat.UPPER_ROMAN;
    case 'alpha-lower':
      return NumberFormat.LOWER_LETTER;
    case 'alpha-upper':
      return NumberFormat.UPPER_LETTER;
    case 'arabic':
    default:
      return NumberFormat.DECIMAL;
  }
}

function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Captures all rendered `[data-apa-figure-id]` chart containers on screen as high-resolution PNG data URLs.
 */
export async function captureAllFigureImages() {
  if (typeof document === 'undefined') return {};
  const nodes = document.querySelectorAll('[data-apa-figure-id]');
  const images = {};
  for (const node of nodes) {
    const figId = node.getAttribute('data-apa-figure-id');
    if (!figId) continue;
    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
      });
      images[figId] = dataUrl;
    } catch {
      // Ignore individual chart capture error
    }
  }
  return images;
}

/**
 * Builds the ordered catalog of all 11 APA Tables and 16 Figures from the live statistical output
 * and centralized numbering configuration.
 */
export function buildChapter4TablesAndFiguresCatalog(stats, apaSettings = {}) {
  const validN = stats?.screening?.validN ?? 0;
  const retrievedN = stats?.screening?.retrievedN ?? 0;
  const excludedN = stats?.screening?.excludedN ?? 0;
  const lockedN = stats?.screening?.lockedN ?? 0;
  const pendingN = stats?.screening?.pendingN ?? 0;
  const isProvisional = pendingN > 0;

  const numMap = buildChapter4NumberingMap(apaSettings);
  const { tables: T, figures: F } = numMap;

  // Table 1: Data Screening
  const table1 = {
    number: T.t1,
    title: 'Data Screening and Sample Retention Summary',
    headers: ['Screening Stage and Criterion', 'n', '% of Retrieved'],
    rows: [
      ['Total Retrieved Submissions', String(retrievedN), retrievedN > 0 ? '100.0' : '0.0'],
      [
        'Excluded Records (Screening, Eligibility, or Version)',
        String(excludedN),
        retrievedN > 0 ? formatApaStat((excludedN / retrievedN) * 100, 1) : '0.0',
      ],
      [
        isProvisional
          ? 'Eligible Analytical Sample (N; Provisional Snapshot)'
          : 'Final Locked Analytical Sample (N)',
        String(validN),
        retrievedN > 0 ? formatApaStat((validN / retrievedN) * 100, 1) : '0.0',
      ],
      [
        'Locked Responses (Post-3-Day Withdrawal Window)',
        String(lockedN),
        validN > 0 ? formatApaStat((lockedN / validN) * 100, 1) : '0.0',
      ],
      [
        'Responses in Active 3-Day Withdrawal Window',
        String(pendingN),
        validN > 0 ? formatApaStat((pendingN / validN) * 100, 1) : '0.0',
      ],
    ],
    note: `N = ${validN}. Active questionnaire version: ${
      stats?.screening?.questionnaireVersion || QUESTIONNAIRE_CONFIG.version
    } (18 items).${
      isProvisional
        ? ` Because ${pendingN} eligible response(s) remain within the active 3-calendar-day participant withdrawal window, this table represents a provisional analysis snapshot rather than the final locked dataset.`
        : ' All eligible responses have completed the 3-day withdrawal window.'
    }`,
  };

  // Table 2: Demographics
  const demoRows = [];
  const appendDemoGroup = (label, tbl) => {
    for (const c of tbl?.categories || []) {
      demoRows.push([label, c.category, String(c.count), formatApaStat(c.percentTotal, 1)]);
    }
  };
  appendDemoGroup('Age Group', stats?.demographics?.age_group);
  appendDemoGroup('Gender', stats?.demographics?.gender);
  appendDemoGroup('Education Level', stats?.demographics?.education);
  appendDemoGroup('Occupation', stats?.demographics?.occupation);

  const table2 = {
    number: T.t2,
    title: 'Demographic Characteristics of Participants',
    headers: ['Characteristic', 'Category', 'n', '%'],
    rows: demoRows,
    note: `N = ${validN}. Percentages are calculated out of the valid analytical sample.`,
  };

  // Table 3: AI Usage
  const aiRows = [];
  const appendSingleAi = (label, tbl) => {
    for (const c of tbl?.categories || []) {
      aiRows.push([label, c.category, String(c.count), formatApaStat(c.percentTotal, 1)]);
    }
  };
  const appendMultiAi = (label, tbl) => {
    for (const o of tbl?.options || []) {
      aiRows.push([
        `${label} (Multiple Response)`,
        o.option,
        String(o.count),
        formatApaStat(o.percentOfRespondents, 1),
      ]);
    }
  };
  appendSingleAi('Primary AI Tool', stats?.aiUsage?.primary_ai_tool);
  appendSingleAi('Usage Frequency', stats?.aiUsage?.ai_frequency);
  appendSingleAi('Usage Duration', stats?.aiUsage?.ai_duration);
  appendSingleAi('AI Familiarity', stats?.aiUsage?.ai_familiarity);
  appendMultiAi('AI Platforms Used', stats?.aiUsage?.ai_tools);
  appendMultiAi('Purposes of Use', stats?.aiUsage?.ai_purpose);

  const table3 = {
    number: T.t3,
    title: 'Conversational AI Usage Characteristics',
    headers: ['Usage Dimension', 'Category or Option', 'n', '% of Valid N'],
    rows: aiRows,
    note: `N = ${validN}. For multiple-response items (AI Platforms Used and Purposes of Use), percentages use the valid participant count (N = ${validN}) as the denominator and may sum to more than 100%.`,
  };

  // Table 4: Descriptive Statistics
  const table4 = {
    number: T.t4,
    title: 'Descriptive Statistics of Study Variables',
    headers: ['Construct', 'N', 'M', 'SD', 'Mdn', 'Min', 'Max', 'Skewness', 'Kurtosis'],
    rows: (stats?.studyVariables || []).map(v => {
      const m = v.meanStats || {};
      return [
        `${v.name} (${v.code})`,
        String(m.validN ?? 0),
        formatApaStat(m.mean, 2),
        formatApaStat(m.sd, 2),
        formatApaStat(m.median, 2),
        formatApaStat(m.min, 2),
        formatApaStat(m.max, 2),
        formatApaStat(m.skewness, 2),
        formatApaStat(m.kurtosis, 2),
      ];
    }),
    note: `N = ${validN}. PCW = Perceived Conversational Warmth; PT = Perceived Trust; WSD = Willingness to Self-Disclose; M = mean; SD = sample standard deviation (n − 1 denominator); Mdn = median.`,
  };

  // Table 5: Reliability Summary
  const table5 = {
    number: T.t5,
    title: 'Internal Consistency Reliability of Study Scales',
    headers: ['Construct', 'Items (k)', 'N', "Cronbach's α", 'Interpretation'],
    rows: (stats?.reliability?.scales || []).map(s => [
      `${s.name} (${s.code})`,
      String(s.itemCount),
      String(s.validN),
      formatApaNoLeadingZero(s.alpha, 3),
      s.interpretation?.label || s.warning || 'N/A',
    ]),
    note: `N = ${validN}. Cronbach's α was computed from raw item-level scores using sample variances.`,
  };

  // Table 6: Item-Level Reliability Diagnostics
  const itemRelRows = [];
  for (const s of stats?.reliability?.scales || []) {
    for (const it of s.items || []) {
      itemRelRows.push([
        s.code,
        it.key.toUpperCase(),
        formatApaStat(it.mean, 2),
        formatApaStat(it.sd, 2),
        formatApaNoLeadingZero(it.correctedItemTotalCorrelation, 3),
        formatApaNoLeadingZero(it.alphaIfDeleted, 3),
      ]);
    }
  }
  const table6 = {
    number: T.t6,
    title: 'Item-Level Descriptive and Reliability Statistics Across All 18 Items',
    headers: ['Scale', 'Item', 'M', 'SD', 'Corrected Item-Total r', 'α if Item Deleted'],
    rows: itemRelRows,
    note: `N = ${validN}. PCW = 4 items (CW_1–CW_4); PT = 6 items (PT_1–PT_6); WSD = 8 items (SD_1–SD_8).`,
  };

  // Table 7: Normality Analysis
  const table7 = {
    number: T.t7,
    title: 'Shapiro-Wilk Normality Test and Distributional Shape Indices',
    headers: ['Construct', 'N', 'Shapiro-Wilk W', 'p', 'Skewness', 'Kurtosis'],
    rows: (stats?.normality?.scales || []).map(s => [
      `${s.name} (${s.code})`,
      String(s.n ?? 0),
      formatApaStat(s.wStatistic, 3),
      formatApaPValue(s.pValue, false),
      formatApaStat(s.skewness, 2),
      formatApaStat(s.kurtosis, 2),
    ]),
    note: `N = ${validN}. Two-tailed Shapiro-Wilk test of normality on composite mean scores.`,
  };

  // Table 8: Bivariate Correlation Summary
  const table8 = {
    number: T.t8,
    title: 'Bivariate Pearson and Spearman Correlations Among Study Variables',
    headers: ['Variable Pair', 'n', 'Pearson r', 'p (2-tailed)', '95% CI for r', 'Spearman ρ', 'Spearman p'],
    rows: (stats?.correlation?.pairs || []).map(p => [
      `${p.varX} – ${p.varY}`,
      String(p.n ?? 0),
      formatApaNoLeadingZero(p.pearson?.r, 3),
      formatApaPValue(p.pearson?.pValue, false),
      formatCI(p.pearson?.ci, 2),
      formatApaNoLeadingZero(p.spearman?.rho, 3),
      formatApaPValue(p.spearman?.pValue, false),
    ]),
    note: `N = ${validN}. CI = confidence interval computed via Fisher's z-transformation.`,
  };

  // Table 9: Pearson Matrix (Uses formatApaPValue(p, true) so p < .001 is never rendered as p = < .001)
  const codes = stats?.correlation?.codes || ['PCW', 'PT', 'WSD'];
  const table9 = {
    number: T.t9,
    title: 'Pearson Product-Moment Correlation Matrix',
    headers: ['Variable', ...codes],
    rows: codes.map(rCode => [
      rCode,
      ...codes.map(cCode => {
        if (rCode === cCode) return '1.000';
        const cell = stats?.correlation?.pearsonMatrix?.[rCode]?.[cCode];
        return `${formatApaNoLeadingZero(cell?.r, 3)} (p ${formatApaPValue(cell?.pValue, true)})`;
      }),
    ]),
    note: `N = ${validN}. Diagonal elements equal 1.000; off-diagonal cells report Pearson r and two-tailed p-values.`,
  };

  // Table 10: Spearman Matrix (Uses formatApaPValue(p, true) so p < .001 is never rendered as p = < .001)
  const table10 = {
    number: T.t10,
    title: 'Spearman Rank-Order Correlation Matrix',
    headers: ['Variable', ...codes],
    rows: codes.map(rCode => [
      rCode,
      ...codes.map(cCode => {
        if (rCode === cCode) return '1.000';
        const cell = stats?.correlation?.spearmanMatrix?.[rCode]?.[cCode];
        return `${formatApaNoLeadingZero(cell?.rho, 3)} (p ${formatApaPValue(cell?.pValue, true)})`;
      }),
    ]),
    note: `N = ${validN}. Rank-order correlations incorporate average-rank tie corrections.`,
  };

  // Table 11: Hypothesis Testing Summary
  const pairH3 = stats?.correlation?.pairs?.find(p => p.id === 'H3');
  const h3Diverges =
    pairH3?.pearson?.pValue < 0.05 && pairH3?.spearman?.pValue >= 0.05;

  const table11 = {
    number: T.t11,
    title: 'Summary of Confirmatory Hypothesis Testing',
    headers: ['Hypothesis', 'Correlational Statement', 'n', 'Pearson r', 'p (2-tailed)', '95% CI', 'Decision'],
    rows: (stats?.hypothesisTesting?.hypotheses || []).map(h => [
      h.id,
      h.statement,
      String(h.n ?? 0),
      formatApaNoLeadingZero(h.coefficient, 3),
      formatApaPValue(h.pValue, false),
      formatCI(h.ci, 2),
      h.decision,
    ]),
    note: `N = ${validN}. Evaluated at α = .05 (two-tailed) using Pearson product-moment correlation as the predefined primary hypothesis test.${
      h3Diverges
        ? ` For H3 (PCW and WSD), while the primary Pearson correlation is statistically significant (r = ${formatApaNoLeadingZero(pairH3?.pearson?.r, 3)}, p ${formatApaPValue(pairH3?.pearson?.pValue, true)}), the non-parametric Spearman correlation was not statistically significant (ρ = ${formatApaNoLeadingZero(pairH3?.spearman?.rho, 3)}, p ${formatApaPValue(pairH3?.spearman?.pValue, true)}), warranting cautious interpretation.`
        : ''
    }`,
  };

  // Ordered Figures Catalog (Figures 1 to 16) with Title Case titles (no trailing period)
  const figures = {
    fig1: {
      id: 'fig-1',
      number: F.f1,
      title: 'Age Group Distribution of Participants',
      note: `N = ${validN}. Frequencies of valid respondents across age categories.`,
    },
    fig2: {
      id: 'fig-2',
      number: F.f2,
      title: 'Gender Distribution of Participants',
      note: `N = ${validN}. Proportion of valid respondents by gender identity.`,
    },
    fig3: {
      id: 'fig-3',
      number: F.f3,
      title: 'Educational Attainment of Participants',
      note: `N = ${validN}. Distribution of valid participants across educational levels.`,
    },
    fig4: {
      id: 'fig-4',
      number: F.f4,
      title: 'Occupational Distribution of Participants',
      note: `N = ${validN}. Distribution of valid participants across occupational categories.`,
    },
    fig5: {
      id: 'fig-5',
      number: F.f5,
      title: 'Primary Conversational AI Platform Used Most Frequently',
      note: `N = ${validN}. Single-choice primary conversational AI tool selected by participants.`,
    },
    fig6: {
      id: 'fig-6',
      number: F.f6,
      title: 'Conversational AI Usage Frequency',
      note: `N = ${validN}. Frequency of interaction with conversational AI platforms.`,
    },
    fig7: {
      id: 'fig-7',
      number: F.f7,
      title: 'Histogram of Perceived Conversational Warmth Mean Scores',
      note: `N = ${validN}. Observed composite mean score distribution for PCW on the 1.00–5.00 Likert scale.`,
    },
    fig8: {
      id: 'fig-8',
      number: F.f8,
      title: 'Normal Q-Q Plot for Perceived Conversational Warmth',
      note: `N = ${validN}. Theoretical normal quantiles plotted against observed standardized PCW scores.`,
    },
    fig9: {
      id: 'fig-9',
      number: F.f9,
      title: 'Histogram of Perceived Trust Mean Scores',
      note: `N = ${validN}. Observed composite mean score distribution for PT on the 1.00–5.00 Likert scale.`,
    },
    fig10: {
      id: 'fig-10',
      number: F.f10,
      title: 'Normal Q-Q Plot for Perceived Trust',
      note: `N = ${validN}. Theoretical normal quantiles plotted against observed standardized PT scores.`,
    },
    fig11: {
      id: 'fig-11',
      number: F.f11,
      title: 'Histogram of Willingness to Self-Disclose Mean Scores',
      note: `N = ${validN}. Observed composite mean score distribution for WSD on the 1.00–5.00 Likert scale.`,
    },
    fig12: {
      id: 'fig-12',
      number: F.f12,
      title: 'Normal Q-Q Plot for Willingness to Self-Disclose',
      note: `N = ${validN}. Theoretical normal quantiles plotted against observed standardized WSD scores.`,
    },
    fig13: {
      id: 'fig-13',
      number: F.f13,
      title: 'Correlation Heatmap of Study Constructs',
      note: `N = ${validN}. Visual representation of bivariate Pearson product-moment correlation coefficients (r) among PCW, PT, and WSD.`,
    },
    fig14: {
      id: 'fig-14',
      number: F.f14,
      title: 'Scatterplot of Perceived Conversational Warmth and Perceived Trust',
      note: `N = ${validN}. Bivariate scatterplot with ordinary least-squares linear regression trendline (H1).`,
    },
    fig15: {
      id: 'fig-15',
      number: F.f15,
      title: 'Scatterplot of Perceived Trust and Willingness to Self-Disclose',
      note: `N = ${validN}. Bivariate scatterplot with ordinary least-squares linear regression trendline (H2).`,
    },
    fig16: {
      id: 'fig-16',
      number: F.f16,
      title: 'Scatterplot of Perceived Conversational Warmth and Willingness to Self-Disclose',
      note: `N = ${validN}. Bivariate scatterplot with ordinary least-squares linear regression trendline (H3).`,
    },
  };

  return {
    table1,
    table2,
    table3,
    table4,
    table5,
    table6,
    table7,
    table8,
    table9,
    table10,
    table11,
    figures,
  };
}

/**
 * Helper to create a Word paragraph styled with one of the 20 APA 7 style definitions.
 */
function makeDocxParagraph(text, settings, styleKey, extraOptions = {}) {
  const s = settings?.styles?.[styleKey] || settings?.styles?.normalParagraph || {};
  const fontSizeHalfPt = Math.max(2, Math.min(200, Math.round((Number(s.fontSize) || 12) * 2)));
  const lineSpacingTwips = Math.round((Number(s.lineSpacing) || 2.0) * 240);
  const firstLineTwips = inchesToTwips(s.firstLineIndent || 0);
  const leftTwips = styleKey === 'normalParagraph' ? inchesToTwips(settings?.paragraph?.leftIndent || 0) : 0;
  const rightTwips = styleKey === 'normalParagraph' ? inchesToTwips(settings?.paragraph?.rightIndent || 0) : 0;

  const cleanText = String(text || '').replace(/\.$/, styleKey.startsWith('h') || styleKey.includes('Title') ? '' : '$&');
  const displayStr = s.uppercase ? cleanText.toUpperCase() : cleanText;

  return new Paragraph({
    alignment: mapDocxAlignment(s.textAlign),
    keepNext: Boolean(extraOptions.keepNext),
    keepLines: Boolean(extraOptions.keepLines),
    spacing: {
      before: ptToTwips(s.spaceBefore || 0),
      after: ptToTwips(s.spaceAfter || 0),
      line: lineSpacingTwips,
    },
    indent: {
      firstLine: firstLineTwips > 0 ? firstLineTwips : undefined,
      left: leftTwips > 0 ? leftTwips : undefined,
      right: rightTwips > 0 ? rightTwips : undefined,
    },
    children: [
      new TextRun({
        text: displayStr,
        font: s.fontFamily || 'Times New Roman',
        size: fontSizeHalfPt,
        bold: Boolean(s.bold),
        italics: Boolean(s.italic),
        underline: s.underline ? {} : undefined,
      }),
    ],
  });
}

/**
 * Helper to create an APA 7 Word Table (horizontal top, header-bottom, and table-bottom rules; no vertical borders).
 */
function makeDocxApaTable(tableObj, settings) {
  const headerStyle = settings?.styles?.tableHeader || { fontFamily: 'Times New Roman', fontSize: 12, bold: true, lineSpacing: 2.0 };
  const bodyStyle = settings?.styles?.tableBody || { fontFamily: 'Times New Roman', fontSize: 12, bold: false, lineSpacing: 2.0 };
  const noteStyle = settings?.styles?.tableNote || { fontFamily: 'Times New Roman', fontSize: 12, lineSpacing: 2.0 };

  const headerHalfPt = Math.round((Number(headerStyle.fontSize) || 12) * 2);
  const bodyHalfPt = Math.round((Number(bodyStyle.fontSize) || 12) * 2);
  const lineTwips = Math.round((Number(bodyStyle.lineSpacing) || 2.0) * 240);

  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const solidBorder = { style: BorderStyle.SINGLE, size: 8, color: '000000' };

  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: tableObj.headers.map(h =>
      new TableCell({
        borders: {
          top: solidBorder,
          bottom: solidBorder,
          left: noBorder,
          right: noBorder,
        },
        children: [
          new Paragraph({
            spacing: { before: 20, after: 20, line: lineTwips },
            children: [
              new TextRun({
                text: String(h),
                font: headerStyle.fontFamily || 'Times New Roman',
                size: headerHalfPt,
                bold: Boolean(headerStyle.bold),
                italics: Boolean(headerStyle.italic),
              }),
            ],
          }),
        ],
      })
    ),
  });

  const dataRows = (tableObj.rows || []).map((row, rIdx) => {
    const isLast = rIdx === tableObj.rows.length - 1;
    return new TableRow({
      cantSplit: true,
      children: row.map(cellVal =>
        new TableCell({
          borders: {
            top: noBorder,
            bottom: isLast ? solidBorder : noBorder,
            left: noBorder,
            right: noBorder,
          },
          children: [
            new Paragraph({
              spacing: { before: 20, after: 20, line: lineTwips },
              children: [
                new TextRun({
                  text: String(cellVal ?? '—'),
                  font: bodyStyle.fontFamily || 'Times New Roman',
                  size: bodyHalfPt,
                  bold: Boolean(bodyStyle.bold),
                  italics: Boolean(bodyStyle.italic),
                }),
              ],
            }),
          ],
        })
      ),
    });
  });

  const elements = [
    makeDocxParagraph(tableObj.number, settings, 'tableNumber', { keepNext: true }),
    makeDocxParagraph(tableObj.title, settings, 'tableTitle', { keepNext: true }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows],
    }),
  ];

  if (tableObj.note) {
    elements.push(
      new Paragraph({
        spacing: {
          before: ptToTwips(noteStyle.spaceBefore || 0),
          after: ptToTwips(noteStyle.spaceAfter || 0),
          line: Math.round((Number(noteStyle.lineSpacing) || 2.0) * 240),
        },
        children: [
          new TextRun({
            text: 'Note. ',
            italics: true,
            font: noteStyle.fontFamily || 'Times New Roman',
            size: Math.round((Number(noteStyle.fontSize) || 12) * 2),
          }),
          new TextRun({
            text: tableObj.note,
            font: noteStyle.fontFamily || 'Times New Roman',
            size: Math.round((Number(noteStyle.fontSize) || 12) * 2),
          }),
        ],
      })
    );
  }

  return elements;
}

/**
 * Helper to embed a captured Figure image with APA 7 Figure Number, Title, and Note into Word (.docx).
 */
function makeDocxApaFigure(figMeta, dataUrl, settings) {
  if (!figMeta) return [];
  const noteStyle = settings?.styles?.figureNote || { fontFamily: 'Times New Roman', fontSize: 12, lineSpacing: 2.0 };
  const figAlign = settings?.figureNumbering?.alignment === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT;

  const elements = [
    makeDocxParagraph(figMeta.number, settings, 'figureNumber', { keepNext: true }),
    makeDocxParagraph(figMeta.title, settings, 'figureTitle', { keepNext: true }),
  ];

  if (dataUrl) {
    try {
      const imageBytes = dataUrlToUint8Array(dataUrl);
      elements.push(
        new Paragraph({
          alignment: figAlign,
          keepNext: true,
          spacing: { before: 60, after: 60 },
          children: [
            new ImageRun({
              data: imageBytes,
              transformation: { width: 450, height: 245 },
              type: 'png',
            }),
          ],
        })
      );
    } catch {
      // Skip image binary if conversion fails
    }
  }

  if (figMeta.note) {
    elements.push(
      new Paragraph({
        spacing: {
          before: ptToTwips(noteStyle.spaceBefore || 0),
          after: ptToTwips(noteStyle.spaceAfter || 0),
          line: Math.round((Number(noteStyle.lineSpacing) || 2.0) * 240),
        },
        children: [
          new TextRun({
            text: 'Note. ',
            italics: true,
            font: noteStyle.fontFamily || 'Times New Roman',
            size: Math.round((Number(noteStyle.fontSize) || 12) * 2),
          }),
          new TextRun({
            text: figMeta.note,
            font: noteStyle.fontFamily || 'Times New Roman',
            size: Math.round((Number(noteStyle.fontSize) || 12) * 2),
          }),
        ],
      })
    );
  }

  return elements;
}

/**
 * Builds Word (.docx) headers and footers honoring the Page Numbering configuration.
 */
function buildDocxHeadersAndFooters(apaSettings) {
  const pageNumCfg = apaSettings?.pageNumbering || {};
  const pos = pageNumCfg.position || 'top-right';
  const showOnFirst = pageNumCfg.showOnTitlePage !== false;
  const headerFont = apaSettings?.styles?.header?.fontFamily || apaSettings?.typography?.fontFamily || 'Times New Roman';
  const headerSizeHalfPt = Math.round((Number(apaSettings?.styles?.header?.fontSize) || 12) * 2);

  let align = AlignmentType.RIGHT;
  if (pos.endsWith('left')) align = AlignmentType.LEFT;
  else if (pos.endsWith('center')) align = AlignmentType.CENTER;

  const pageNumberParagraph = new Paragraph({
    alignment: align,
    children: [
      new TextRun({
        children: [PageNumber.CURRENT],
        font: headerFont,
        size: headerSizeHalfPt,
      }),
    ],
  });

  const emptyParagraph = new Paragraph({ children: [] });

  const isTop = pos.startsWith('top');
  return {
    titlePage: !showOnFirst,
    headers: {
      default: new Header({
        children: isTop ? [pageNumberParagraph] : [emptyParagraph],
      }),
      first: !showOnFirst
        ? new Header({ children: [emptyParagraph] })
        : undefined,
    },
    footers: {
      default: new Footer({
        children: !isTop ? [pageNumberParagraph] : [emptyParagraph],
      }),
      first: !showOnFirst
        ? new Footer({ children: [emptyParagraph] })
        : undefined,
    },
  };
}

/**
 * Exports the complete dynamic Chapter 4 - APA 7 report as an editable Word (.docx) document.
 */
export async function exportApa7Chapter4Word({
  stats,
  narratives,
  apaSettings,
  filename = 'Chapter_4_Results_APA7.docx',
}) {
  const dims = getPaperDimensions(apaSettings);
  const catalog = buildChapter4TablesAndFiguresCatalog(stats, apaSettings);
  const figureImages = await captureAllFigureImages();
  const F = catalog.figures;

  // Single-line Chapter Title (H1): "Chapter 4: Results"
  const children = [
    makeDocxParagraph('Chapter 4: Results', apaSettings, 'h1', { keepNext: true }),
  ];

  const appendSectionProse = secId => {
    const sec = narratives?.[secId];
    if (!sec) return;
    // Title Case heading without numerical prefix
    const cleanHeading = String(sec.title || '').replace(/^\d+\.\d+\s*/, '').replace(/\.$/, '');
    children.push(makeDocxParagraph(cleanHeading, apaSettings, 'h2', { keepNext: true }));
    const intro = sec.customText?.introText ?? sec.introText;
    const findings = sec.customText?.findingsText ?? sec.findingsText;
    const interp = sec.customText?.interpretationText ?? sec.interpretationText;
    if (intro) children.push(makeDocxParagraph(intro, apaSettings, 'normalParagraph'));
    if (findings) children.push(makeDocxParagraph(findings, apaSettings, 'normalParagraph'));
    if (interp) children.push(makeDocxParagraph(interp, apaSettings, 'normalParagraph'));
  };

  // Section 1: Introduction and Data Screening
  appendSectionProse('4.1');
  if (stats?.hasData) {
    children.push(...makeDocxApaTable(catalog.table1, apaSettings));
  }

  // Section 2: Demographic Characteristics of Participants
  appendSectionProse('4.2');
  if (stats?.hasData) {
    children.push(
      ...makeDocxApaTable(catalog.table2, apaSettings),
      ...makeDocxApaFigure(F.fig1, figureImages['fig-1'], apaSettings),
      ...makeDocxApaFigure(F.fig2, figureImages['fig-2'], apaSettings),
      ...makeDocxApaFigure(F.fig3, figureImages['fig-3'], apaSettings),
      ...makeDocxApaFigure(F.fig4, figureImages['fig-4'], apaSettings)
    );
  }

  // Section 3: Conversational AI Usage Characteristics
  appendSectionProse('4.3');
  if (stats?.hasData) {
    children.push(
      ...makeDocxApaTable(catalog.table3, apaSettings),
      ...makeDocxApaFigure(F.fig5, figureImages['fig-5'], apaSettings),
      ...makeDocxApaFigure(F.fig6, figureImages['fig-6'], apaSettings)
    );
  }

  // Section 4: Descriptive Statistics of Study Variables
  appendSectionProse('4.4');
  if (stats?.hasData) {
    children.push(...makeDocxApaTable(catalog.table4, apaSettings));
  }

  // Section 5: Reliability and Normality Analysis
  appendSectionProse('4.5');
  if (stats?.hasData) {
    children.push(
      ...makeDocxApaTable(catalog.table5, apaSettings),
      ...makeDocxApaTable(catalog.table6, apaSettings),
      ...makeDocxApaTable(catalog.table7, apaSettings),
      ...makeDocxApaFigure(F.fig7, figureImages['fig-7'], apaSettings),
      ...makeDocxApaFigure(F.fig8, figureImages['fig-8'], apaSettings),
      ...makeDocxApaFigure(F.fig9, figureImages['fig-9'], apaSettings),
      ...makeDocxApaFigure(F.fig10, figureImages['fig-10'], apaSettings),
      ...makeDocxApaFigure(F.fig11, figureImages['fig-11'], apaSettings),
      ...makeDocxApaFigure(F.fig12, figureImages['fig-12'], apaSettings)
    );
  }

  // Section 6: Correlation Analysis
  appendSectionProse('4.6');
  if (stats?.hasData) {
    children.push(
      ...makeDocxApaTable(catalog.table8, apaSettings),
      ...makeDocxApaTable(catalog.table9, apaSettings),
      ...makeDocxApaTable(catalog.table10, apaSettings),
      ...makeDocxApaFigure(F.fig13, figureImages['fig-13'], apaSettings),
      ...makeDocxApaFigure(F.fig14, figureImages['fig-14'], apaSettings),
      ...makeDocxApaFigure(F.fig15, figureImages['fig-15'], apaSettings),
      ...makeDocxApaFigure(F.fig16, figureImages['fig-16'], apaSettings)
    );
  }

  // Section 7: Hypothesis Testing
  appendSectionProse('4.7');
  if (stats?.hasData) {
    children.push(...makeDocxApaTable(catalog.table11, apaSettings));
  }

  // Section 8: Summary of Findings
  appendSectionProse('4.8');

  const pageNumCfg = apaSettings?.pageNumbering || {};
  const startPage = parseStartPageNumber(pageNumCfg.startPageNumber ?? 1, pageNumCfg.format);
  const hf = buildDocxHeadersAndFooters(apaSettings);

  const doc = new Document({
    sections: [
      {
        properties: {
          titlePage: hf.titlePage,
          page: {
            size: {
              width: inchesToTwips(dims.widthIn),
              height: inchesToTwips(dims.heightIn),
              orientation:
                dims.orientation === 'landscape'
                  ? PageOrientation.LANDSCAPE
                  : PageOrientation.PORTRAIT,
            },
            margin: {
              top: inchesToTwips(dims.margins.top),
              bottom: inchesToTwips(dims.margins.bottom),
              left: inchesToTwips(dims.margins.left),
              right: inchesToTwips(dims.margins.right),
            },
            pageNumbers: {
              start: startPage,
              formatType: mapDocxNumberFormat(pageNumCfg.format),
            },
          },
        },
        headers: hf.headers,
        footers: hf.footers,
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function cleanPdfText(str) {
  return String(str || '')
    .replace(/α/g, 'alpha')
    .replace(/ρ/g, 'rho')
    .replace(/−/g, '-')
    .replace(/—/g, '--');
}

/**
 * Exports the complete dynamic Chapter 4 - APA 7 report as a properly formatted PDF document.
 */
export async function exportApa7Chapter4Pdf({
  stats,
  narratives,
  apaSettings,
  filename = 'Chapter_4_Results_APA7.pdf',
}) {
  const dims = getPaperDimensions(apaSettings);
  const catalog = buildChapter4TablesAndFiguresCatalog(stats, apaSettings);
  const figureImages = await captureAllFigureImages();
  const F = catalog.figures;

  const formatMap = { A4: 'a4', Letter: 'letter', Legal: 'legal' };
  const pdfFormat = formatMap[dims.paperSize] || 'a4';

  const doc = new jsPDF({
    orientation: dims.orientation,
    unit: 'pt',
    format: pdfFormat,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginTop = dims.margins.top * 72;
  const marginBottom = dims.margins.bottom * 72;
  const marginLeft = dims.margins.left * 72;
  const marginRight = dims.margins.right * 72;
  const contentWidth = pageWidth - marginLeft - marginRight;

  const baseFont =
    String(apaSettings?.typography?.fontFamily || '').toLowerCase().includes('arial') ||
    String(apaSettings?.typography?.fontFamily || '').toLowerCase().includes('calibri')
      ? 'helvetica'
      : 'times';

  let y = marginTop;

  const ensureSpace = neededPt => {
    if (y + neededPt > pageHeight - marginBottom) {
      doc.addPage();
      y = marginTop;
    }
  };

  const writeStyledParagraph = (text, styleKey) => {
    const s = apaSettings?.styles?.[styleKey] || apaSettings?.styles?.normalParagraph || {};
    const fontSize = Math.max(8, Math.min(36, Number(s.fontSize) || 12));
    const lineMult = Number(s.lineSpacing) || 2.0;
    const lineHeight = fontSize * lineMult * 1.15;
    const indentPt = (Number(s.firstLineIndent) || 0) * 72;

    y += Number(s.spaceBefore) || 0;
    ensureSpace(lineHeight + 8);

    const fontStyle =
      s.bold && s.italic ? 'bolditalic' : s.bold ? 'bold' : s.italic ? 'italic' : 'normal';
    doc.setFont(baseFont, fontStyle);
    doc.setFontSize(fontSize);

    const rawStr = cleanPdfText(s.uppercase ? String(text || '').toUpperCase() : String(text || ''));
    const lines = doc.splitTextToSize(rawStr, contentWidth - (indentPt > 0 ? indentPt : 0));

    lines.forEach((line, idx) => {
      ensureSpace(lineHeight);
      let xPos = marginLeft + (idx === 0 ? indentPt : 0);
      if (s.textAlign === 'center') {
        xPos = pageWidth / 2;
        doc.text(line, xPos, y, { align: 'center' });
      } else if (s.textAlign === 'right') {
        xPos = pageWidth - marginRight;
        doc.text(line, xPos, y, { align: 'right' });
      } else {
        doc.text(line, xPos, y);
      }
      y += lineHeight;
    });

    y += Number(s.spaceAfter) || 0;
  };

  const writeApaTable = tableObj => {
    ensureSpace(120);
    writeStyledParagraph(tableObj.number, 'tableNumber');
    writeStyledParagraph(tableObj.title, 'tableTitle');

    autoTable(doc, {
      startY: y,
      head: [tableObj.headers.map(cleanPdfText)],
      body: (tableObj.rows || []).map(r => r.map(cleanPdfText)),
      theme: 'plain',
      rowPageBreak: 'avoid',
      styles: {
        font: baseFont,
        fontSize: Number(apaSettings?.styles?.tableBody?.fontSize) || 11,
        cellPadding: 4,
        textColor: [0, 0, 0],
      },
      headStyles: {
        fontStyle: 'bold',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        lineColor: [0, 0, 0],
      },
      margin: { left: marginLeft, right: marginRight, top: marginTop, bottom: marginBottom },
      didDrawCell: data => {
        if (data.section === 'head') {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.8);
          doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
          doc.line(
            data.cell.x,
            data.cell.y + data.cell.height,
            data.cell.x + data.cell.width,
            data.cell.y + data.cell.height
          );
        }
        if (data.section === 'body' && data.row.index === tableObj.rows.length - 1) {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.8);
          doc.line(
            data.cell.x,
            data.cell.y + data.cell.height,
            data.cell.x + data.cell.width,
            data.cell.y + data.cell.height
          );
        }
      },
    });

    y = doc.lastAutoTable.finalY + 8;
    if (tableObj.note) {
      writeStyledParagraph(`Note. ${tableObj.note}`, 'tableNote');
    }
  };

  const writeApaFigure = figMeta => {
    if (!figMeta) return;
    const imgUrl = figureImages[figMeta.id];
    // Keep Figure number, title, chart image, and note together on the same page
    ensureSpace(275);
    writeStyledParagraph(figMeta.number, 'figureNumber');
    writeStyledParagraph(figMeta.title, 'figureTitle');
    if (imgUrl) {
      try {
        const imgW = Math.min(contentWidth, 390);
        const imgH = 195;
        ensureSpace(imgH + 36);
        const xOffset =
          apaSettings?.figureNumbering?.alignment === 'center'
            ? marginLeft + (contentWidth - imgW) / 2
            : marginLeft;
        doc.addImage(imgUrl, 'PNG', xOffset, y, imgW, imgH);
        y += imgH + 10;
      } catch {
        // Ignore image draw failure
      }
    }
    if (figMeta.note) {
      writeStyledParagraph(`Note. ${figMeta.note}`, 'figureNote');
    }
  };

  // Single-line Chapter Title (H1): "Chapter 4: Results"
  writeStyledParagraph('Chapter 4: Results', 'h1');

  const writeSectionProse = secId => {
    const sec = narratives?.[secId];
    if (!sec) return;
    const cleanHeading = String(sec.title || '').replace(/^\d+\.\d+\s*/, '').replace(/\.$/, '');
    ensureSpace(72);
    writeStyledParagraph(cleanHeading, 'h2');
    const intro = sec.customText?.introText ?? sec.introText;
    const findings = sec.customText?.findingsText ?? sec.findingsText;
    const interp = sec.customText?.interpretationText ?? sec.interpretationText;
    if (intro) writeStyledParagraph(intro, 'normalParagraph');
    if (findings) writeStyledParagraph(findings, 'normalParagraph');
    if (interp) writeStyledParagraph(interp, 'normalParagraph');
  };

  writeSectionProse('4.1');
  if (stats?.hasData) writeApaTable(catalog.table1);

  writeSectionProse('4.2');
  if (stats?.hasData) {
    writeApaTable(catalog.table2);
    writeApaFigure(F.fig1);
    writeApaFigure(F.fig2);
    writeApaFigure(F.fig3);
    writeApaFigure(F.fig4);
  }

  writeSectionProse('4.3');
  if (stats?.hasData) {
    writeApaTable(catalog.table3);
    writeApaFigure(F.fig5);
    writeApaFigure(F.fig6);
  }

  writeSectionProse('4.4');
  if (stats?.hasData) writeApaTable(catalog.table4);

  writeSectionProse('4.5');
  if (stats?.hasData) {
    writeApaTable(catalog.table5);
    writeApaTable(catalog.table6);
    writeApaTable(catalog.table7);
    writeApaFigure(F.fig7);
    writeApaFigure(F.fig8);
    writeApaFigure(F.fig9);
    writeApaFigure(F.fig10);
    writeApaFigure(F.fig11);
    writeApaFigure(F.fig12);
  }

  writeSectionProse('4.6');
  if (stats?.hasData) {
    writeApaTable(catalog.table8);
    writeApaTable(catalog.table9);
    writeApaTable(catalog.table10);
    writeApaFigure(F.fig13);
    writeApaFigure(F.fig14);
    writeApaFigure(F.fig15);
    writeApaFigure(F.fig16);
  }

  writeSectionProse('4.7');
  if (stats?.hasData) writeApaTable(catalog.table11);

  writeSectionProse('4.8');

  // Stamp page numbers across all PDF pages honoring pageNumbering settings
  const totalPages = doc.internal.getNumberOfPages();
  const pageNumCfg = apaSettings?.pageNumbering || {};
  const pos = pageNumCfg.position || 'top-right';
  const hdrFontSize = Number(apaSettings?.styles?.header?.fontSize) || 12;

  for (let p = 1; p <= totalPages; p += 1) {
    const formattedPage = formatPageNumberAtOffset(p - 1, pageNumCfg);
    if (!formattedPage) continue;

    doc.setPage(p);
    doc.setFont(baseFont, 'normal');
    doc.setFontSize(hdrFontSize);

    const isTop = pos.startsWith('top');
    const yPos = isTop ? Math.max(24, marginTop * 0.55) : pageHeight - Math.max(20, marginBottom * 0.45);

    if (pos.endsWith('left')) {
      doc.text(formattedPage, marginLeft, yPos, { align: 'left' });
    } else if (pos.endsWith('center')) {
      doc.text(formattedPage, pageWidth / 2, yPos, { align: 'center' });
    } else {
      doc.text(formattedPage, pageWidth - marginRight, yPos, { align: 'right' });
    }
  }

  doc.save(filename);
}
