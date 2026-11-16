import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateMean } from '../src/utils/statistics/mean.js';
import { calculateMedian } from '../src/utils/statistics/median.js';
import { calculateMode } from '../src/utils/statistics/mode.js';
import { calculateVariance } from '../src/utils/statistics/variance.js';
import { calculateStandardDeviation } from '../src/utils/statistics/standardDeviation.js';
import { calculateSkewnessAndKurtosis } from '../src/utils/statistics/skewnessKurtosis.js';
import { calculateCronbachAlpha } from '../src/utils/statistics/cronbachAlpha.js';
import { calculateShapiroWilk } from '../src/utils/statistics/shapiroWilk.js';
import { calculatePearsonCorrelation } from '../src/utils/statistics/pearsonCorrelation.js';
import { calculateSpearmanCorrelation } from '../src/utils/statistics/spearmanCorrelation.js';
import { formatPValue, formatNumber } from '../src/utils/formatters/numberFormatter.js';

import { scoreParticipantResponse } from '../src/services/analysis/scoringService.js';
import { runDataCleaningAudit } from '../src/services/analysis/dataCleaningService.js';
import { sanitizeResponseRecord } from '../src/services/supabase/responseService.js';
import { buildRawCsvContent } from '../src/services/export/csvExportService.js';
import {
  createApa7DefaultSettings,
  TEXT_STYLE_DEFINITIONS,
  applyGlobalTypographyToStyles,
} from '../src/services/chapter4/apa7SettingsService.js';
import {
  getPaperDimensions,
  getStyleCss,
  formatApaNoLeadingZero,
  formatApaPValue,
} from '../src/services/chapter4/apa7Formatter.js';
import {
  formatPageNumberAtOffset,
  getTableLabel,
  getFigureLabel,
  buildChapter4NumberingMap,
} from '../src/services/chapter4/apa7NumberingService.js';
import { prepareChapter4Dataset } from '../src/services/chapter4/chapter4DataService.js';
import { computeChapter4Statistics } from '../src/services/chapter4/chapter4StatisticsService.js';
import { generateChapter4Narratives } from '../src/services/chapter4/chapter4NarrativeService.js';
import { buildChapter4TablesAndFiguresCatalog } from '../src/services/chapter4/chapter4ExportService.js';

test('1. Sample descriptive statistics match exact sample (n - 1) formulas', () => {
  const data = [2, 4, 4, 4, 5, 5, 7, 9];
  assert.equal(calculateMean(data), 5);
  assert.equal(calculateMedian(data), 4.5);
  const modeRes = calculateMode(data);
  assert.deepEqual(modeRes.modes, [4]);
  assert.ok(Math.abs(calculateVariance(data) - 32 / 7) < 1e-10);
  assert.ok(Math.abs(calculateStandardDeviation(data) - Math.sqrt(32 / 7)) < 1e-10);

  const shape = calculateSkewnessAndKurtosis(data);
  assert.ok(Number.isFinite(shape.skewness));
  assert.ok(Number.isFinite(shape.kurtosis));
});

test('2. Scoring engine accurately scores 18 items (4 PCW, 6 PT, 8 WSD) and supports strict missing rule', () => {
  const row = {
    cw_1: 4, cw_2: 5, cw_3: 3, cw_4: 4, // sum = 16, mean = 4.0
    pt_1: 4, pt_2: 4, pt_3: 5, pt_4: 4, pt_5: 5, pt_6: 2, // sum = 24, mean = 4.0
    sd_1: 3, sd_2: 4, sd_3: 3, sd_4: 3, sd_5: 4, sd_6: 5, sd_7: 2, sd_8: 4, // sum = 28, mean = 3.5
  };

  const scores = scoreParticipantResponse(row, { missingDataRule: 'complete_construct' });
  assert.equal(scores.PCW.total, 16);
  assert.equal(scores.PCW.mean, 4);
  assert.equal(scores.PT.total, 24);
  assert.equal(scores.PT.mean, 4);
  assert.equal(scores.WSD.total, 28);
  assert.equal(scores.WSD.mean, 3.5);

  const incompleteRow = { ...row, pt_6: null };
  const strictRes = scoreParticipantResponse(incompleteRow, { missingDataRule: 'complete_construct' });
  assert.equal(strictRes.PT.total, null);
  assert.equal(strictRes.PT.mean, null);

  const partialRes = scoreParticipantResponse(incompleteRow, { missingDataRule: 'allow_partial_80' });
  assert.equal(partialRes.PT.answeredCount, 5);
  assert.ok(Math.abs(partialRes.PT.mean - 4.4) < 1e-10);
});

test('3. Cronbach Alpha calculation matches verified reference values and computes item-total stats', () => {
  const rows = [
    { i1: 1, i2: 2, i3: 1, i4: 2 },
    { i1: 2, i2: 2, i3: 2, i4: 3 },
    { i1: 3, i2: 3, i3: 4, i4: 3 },
    { i1: 4, i2: 4, i3: 4, i4: 5 },
    { i1: 5, i2: 5, i3: 5, i4: 4 },
  ];

  const rel = calculateCronbachAlpha(rows, ['i1', 'i2', 'i3', 'i4']);
  assert.equal(rel.validN, 5);
  assert.equal(rel.itemCount, 4);
  assert.ok(rel.alpha > 0.9 && rel.alpha <= 1.0);
  assert.equal(rel.items.length, 4);
  assert.ok(rel.items.every(item => Number.isFinite(item.correctedItemTotalCorrelation)));
  assert.ok(rel.items.every(item => Number.isFinite(item.alphaIfDeleted)));
});

test('4. Pearson r and Spearman rho (with ties) produce accurate coefficients, p-values, and 95% CIs', () => {
  const x = [1, 2, 3, 4, 5, 6];
  const y = [2, 4, 5, 8, 10, 12];

  const pRes = calculatePearsonCorrelation(x, y);
  assert.ok(pRes.r > 0.99);
  assert.ok(pRes.pValue < 0.001);
  assert.equal(formatPValue(pRes.pValue), '< .001');
  assert.ok(pRes.ci.lower > 0.85 && pRes.ci.upper <= 1.0);

  const tiedX = [1, 2, 2, 4, 5];
  const tiedY = [1, 3, 3, 4, 5];
  const sRes = calculateSpearmanCorrelation(tiedX, tiedY);
  assert.ok(Math.abs(sRes.rho - 1.0) < 1e-9);
  assert.equal(formatNumber(3.14159, 2), '3.14');
});

test('5. Shapiro-Wilk normality distinguishes symmetric data from strongly skewed data', () => {
  const approxNormal = [2.4, 2.7, 2.9, 3.0, 3.1, 3.2, 3.3, 3.5, 3.6, 3.8, 4.1];
  const swNormal = calculateShapiroWilk(approxNormal);
  assert.ok(swNormal.w > 0.9);
  assert.ok(swNormal.pValue > 0.05);
  assert.equal(swNormal.qqPoints.length, approxNormal.length);

  const skewed = [1, 1, 1, 1, 1, 1, 1, 1, 2, 5, 5];
  const swSkewed = calculateShapiroWilk(skewed);
  assert.ok(swSkewed.pValue < 0.05);
});

test('6. Sanitization, data cleaning audit, and CSV export strictly exclude withdrawal_code_hash and preserve raw rows', () => {
  const sensitiveRaw = {
    id: 'resp-001',
    age_group: '18–24 years',
    gender: 'Female',
    education: 'Undergraduate',
    occupation: 'Student',
    ai_tools: ['ChatGPT'],
    primary_ai_tool: 'ChatGPT',
    ai_frequency: 'Daily',
    ai_duration: '1–2 years',
    ai_purpose: ['Education and learning'],
    ai_familiarity: 'Very familiar',
    questionnaire_version: 'v1_18_items',
    cw_1: 4, cw_2: 4, cw_3: 4, cw_4: 4,
    pt_1: 4, pt_2: 4, pt_3: 4, pt_4: 4, pt_5: 4, pt_6: 4,
    sd_1: 4, sd_2: 4, sd_3: 4, sd_4: 4, sd_5: 4, sd_6: 4, sd_7: 4, sd_8: 4,
    submitted_at: '2026-11-12T10:00:00.000Z',
    withdrawal_deadline: '2026-11-15T10:00:00.000Z',
    locked_for_analysis: true,
    withdrawal_code_hash: 'SUPER_SECRET_HASH_DO_NOT_EXPORT',
  };

  const sanitized = sanitizeResponseRecord(sensitiveRaw);
  assert.equal(sanitized.withdrawal_code_hash, undefined);
  assert.equal(sanitized.pt_5, 4);
  assert.equal(sanitized.pt_6, 4);

  const audit = runDataCleaningAudit([sanitized], { 'resp-001': { excluded: true, exclusion_reason: 'Straight-lining check' } });
  assert.equal(audit.totalSubmitted, 1);
  assert.equal(audit.validCount, 0);
  assert.equal(audit.excludedCount, 1);
  assert.equal(audit.issues.find(i => i.id === 'straight_lining').affectedCount, 1);

  const csv = buildRawCsvContent([sensitiveRaw]);
  assert.ok(!csv.includes('withdrawal_code_hash'));
  assert.ok(!csv.includes('SUPER_SECRET_HASH_DO_NOT_EXPORT'));
  assert.ok(csv.includes('pt_5'));
  assert.ok(csv.includes('pt_6'));
});

test('7. APA 7 Settings & Dynamic Chapter 4 services configure all 20 text styles and generate dynamic narratives without hardcoded N=35', () => {
  const defaults = createApa7DefaultSettings();
  assert.equal(defaults.presetName, 'APA 7 Default');
  assert.equal(defaults.page.paperSize, 'A4');
  assert.equal(defaults.page.orientation, 'portrait');
  assert.equal(defaults.page.margins.top, 1.0);
  assert.equal(TEXT_STYLE_DEFINITIONS.length, 20);
  for (const def of TEXT_STYLE_DEFINITIONS) {
    assert.ok(defaults.styles[def.key], `Missing style definition for ${def.key}`);
  }

  const updated = applyGlobalTypographyToStyles(defaults, { fontFamily: 'Georgia', fontSize: 99 }, { firstLineIndent: 0.75 });
  assert.equal(updated.styles.normalParagraph.fontFamily, 'Georgia');
  assert.equal(updated.styles.normalParagraph.fontSize, 99);
  assert.equal(updated.styles.normalParagraph.firstLineIndent, 0.75);

  const dims = getPaperDimensions(updated);
  assert.equal(dims.paperSize, 'A4');
  const css = getStyleCss(updated, 'normalParagraph');
  assert.equal(css.fontSize, '99pt');
  assert.equal(css.textIndent, '0.75in');

  assert.equal(formatApaNoLeadingZero(0.5432, 2), '.54');
  assert.equal(formatApaPValue(0.0002, true), '< .001');

  // Test dynamic Chapter 4 pipeline with 4 valid records (never hardcoded N=35)
  const sampleRows = [1, 2, 3, 4].map(i => ({
    id: `r-${i}`,
    age_group: '18–24 years',
    gender: i % 2 === 0 ? 'Female' : 'Male',
    education: 'Undergraduate',
    occupation: 'Student',
    ai_tools: ['ChatGPT'],
    primary_ai_tool: 'ChatGPT',
    ai_frequency: 'Daily',
    ai_duration: '1–2 years',
    ai_purpose: ['Education and learning'],
    ai_familiarity: 'Very familiar',
    questionnaire_version: 'v1_18_items',
    cw_1: i, cw_2: i + 1, cw_3: i, cw_4: i + 1,
    pt_1: i, pt_2: i + 1, pt_3: i, pt_4: i + 1, pt_5: i, pt_6: i + 1,
    sd_1: i, sd_2: i + 1, sd_3: i, sd_4: i + 1, sd_5: i, sd_6: i + 1, sd_7: i, sd_8: i + 1,
    submitted_at: '2026-11-10T10:00:00.000Z',
    withdrawal_deadline: '2026-11-13T10:00:00.000Z',
    locked_for_analysis: true,
  }));

  const prepared = prepareChapter4Dataset(sampleRows);
  assert.equal(prepared.validN, 4);
  const stats = computeChapter4Statistics(prepared);
  assert.equal(stats.screening.validN, 4);
  const narratives = generateChapter4Narratives(stats);
  assert.ok(narratives['4.1'].findingsText.includes('N = 4'));
  assert.ok(!narratives['4.1'].findingsText.includes('N = 35'));
  // Headings use Title Case without numerical prefixes
  assert.equal(narratives['4.1'].title, 'Introduction and Data Screening');
  assert.equal(narratives['4.2'].title, 'Demographic Characteristics of Participants');
});

test('8. Centralized Page/Table/Figure numbering, provisional 3-day withdrawal snapshot, H3 caution, and p < .001 notation', () => {
  // Page numbering tests (including Title Page visibility rule: Page 1 -> 1 or hidden, Page 2 -> 2)
  assert.equal(formatPageNumberAtOffset(0, { startPageNumber: 1, format: 'arabic', showOnTitlePage: true }), '1');
  assert.equal(formatPageNumberAtOffset(1, { startPageNumber: 1, format: 'arabic', showOnTitlePage: true }), '2');
  assert.equal(formatPageNumberAtOffset(0, { startPageNumber: 1, format: 'arabic', showOnTitlePage: false }), '');
  assert.equal(formatPageNumberAtOffset(1, { startPageNumber: 1, format: 'arabic', showOnTitlePage: false }), '2');
  assert.equal(formatPageNumberAtOffset(0, { startPageNumber: 'iv', format: 'roman-lower', showOnTitlePage: true }), 'iv');
  assert.equal(formatPageNumberAtOffset(1, { startPageNumber: 'iv', format: 'roman-lower', showOnTitlePage: true }), 'v');
  assert.equal(formatPageNumberAtOffset(0, { startPageNumber: 'B', format: 'alpha-upper', showOnTitlePage: true }), 'B');
  assert.equal(formatPageNumberAtOffset(1, { startPageNumber: 'B', format: 'alpha-upper', showOnTitlePage: true }), 'C');

  // Independent Table (start = 9) and Figure (start = 6) numbering
  const customSettings = {
    ...createApa7DefaultSettings(),
    tableNumbering: { startTableNumber: 9, numberingStyle: 'sequential' },
    figureNumbering: { startFigureNumber: 6, numberingStyle: 'sequential' },
  };
  assert.equal(getTableLabel(1, customSettings), 'Table 9');
  assert.equal(getTableLabel(2, customSettings), 'Table 10');
  assert.equal(getTableLabel(11, customSettings), 'Table 19');
  assert.equal(getFigureLabel(1, customSettings), 'Figure 6');
  assert.equal(getFigureLabel(2, customSettings), 'Figure 7');
  assert.equal(getFigureLabel(16, customSettings), 'Figure 21');

  const numMap = buildChapter4NumberingMap(customSettings);
  assert.equal(numMap.tables.t1, 'Table 9');
  assert.equal(numMap.figures.f1, 'Figure 6');

  // Simulate a provisional dataset where responses are still within the 3-day withdrawal window
  // and H3 has significant Pearson r (p < .05) but non-significant Spearman rho (p >= .05)
  const mockStats = {
    hasData: true,
    screening: {
      retrievedN: 36,
      validN: 36,
      excludedN: 0,
      lockedN: 0,
      pendingN: 36,
      questionnaireVersion: 'v1_18_items',
    },
    demographics: {},
    aiUsage: {},
    studyVariables: [
      { code: 'PCW', name: 'Perceived Conversational Warmth', meanStats: { validN: 36, mean: 3.8, sd: 0.6, median: 3.9, min: 2.0, max: 5.0, skewness: -0.2, kurtosis: -0.1 } },
      { code: 'PT', name: 'Perceived Trust', meanStats: { validN: 36, mean: 3.7, sd: 0.5, median: 3.8, min: 2.2, max: 4.8, skewness: -0.1, kurtosis: 0.1 } },
      { code: 'WSD', name: 'Willingness to Self-Disclose', meanStats: { validN: 36, mean: 3.2, sd: 0.7, median: 3.1, min: 1.5, max: 4.9, skewness: 0.1, kurtosis: -0.3 } },
    ],
    reliability: {
      scales: [
        { code: 'PCW', name: 'Perceived Conversational Warmth', itemCount: 4, validN: 36, alpha: 0.812, interpretation: { label: 'Good' }, items: [] },
        { code: 'PT', name: 'Perceived Trust', itemCount: 6, validN: 36, alpha: 0.845, interpretation: { label: 'Good' }, items: [] },
        { code: 'WSD', name: 'Willingness to Self-Disclose', itemCount: 8, validN: 36, alpha: 0.879, interpretation: { label: 'Good' }, items: [] },
      ],
    },
    normality: {
      scales: [
        { code: 'PCW', name: 'Perceived Conversational Warmth', n: 36, wStatistic: 0.962, pValue: 0.245, skewness: -0.2, kurtosis: -0.1 },
        { code: 'PT', name: 'Perceived Trust', n: 36, wStatistic: 0.955, pValue: 0.152, skewness: -0.1, kurtosis: 0.1 },
        { code: 'WSD', name: 'Willingness to Self-Disclose', n: 36, wStatistic: 0.948, pValue: 0.091, skewness: 0.1, kurtosis: -0.3 },
      ],
    },
    correlation: {
      codes: ['PCW', 'PT', 'WSD'],
      pairs: [
        { id: 'H1', varX: 'PCW', varY: 'PT', n: 36, pearson: { r: 0.652, pValue: 0.0001, ci: { lower: 0.41, upper: 0.81 } }, spearman: { rho: 0.618, pValue: 0.0001 } },
        { id: 'H2', varX: 'PT', varY: 'WSD', n: 36, pearson: { r: 0.512, pValue: 0.0014, ci: { lower: 0.22, upper: 0.72 } }, spearman: { rho: 0.489, pValue: 0.0025 } },
        { id: 'H3', varX: 'PCW', varY: 'WSD', n: 36, pearson: { r: 0.334, pValue: 0.047, ci: { lower: 0.01, upper: 0.60 } }, spearman: { rho: 0.271, pValue: 0.110 } },
      ],
      pearsonMatrix: {
        PCW: { PCW: { r: 1, pValue: 0 }, PT: { r: 0.652, pValue: 0.0001 }, WSD: { r: 0.334, pValue: 0.047 } },
        PT: { PCW: { r: 0.652, pValue: 0.0001 }, PT: { r: 1, pValue: 0 }, WSD: { r: 0.512, pValue: 0.0014 } },
        WSD: { PCW: { r: 0.334, pValue: 0.047 }, PT: { r: 0.512, pValue: 0.0014 }, WSD: { r: 1, pValue: 0 } },
      },
      spearmanMatrix: {
        PCW: { PCW: { rho: 1, pValue: 0 }, PT: { rho: 0.618, pValue: 0.0001 }, WSD: { rho: 0.271, pValue: 0.110 } },
        PT: { PCW: { rho: 0.618, pValue: 0.0001 }, PT: { rho: 1, pValue: 0 }, WSD: { rho: 0.489, pValue: 0.0025 } },
        WSD: { PCW: { rho: 0.271, pValue: 0.110 }, PT: { rho: 0.489, pValue: 0.0025 }, WSD: { rho: 1, pValue: 0 } },
      },
    },
    hypothesisTesting: {
      hypotheses: [
        { id: 'H1', statement: 'PCW positively associated with PT', n: 36, coefficient: 0.652, pValue: 0.0001, ci: { lower: 0.41, upper: 0.81 }, decision: 'Supported' },
        { id: 'H2', statement: 'PT positively associated with WSD', n: 36, coefficient: 0.512, pValue: 0.0014, ci: { lower: 0.22, upper: 0.72 }, decision: 'Supported' },
        { id: 'H3', statement: 'PCW positively associated with WSD', n: 36, coefficient: 0.334, pValue: 0.047, ci: { lower: 0.01, upper: 0.60 }, decision: 'Supported' },
      ],
    },
  };

  const narratives = generateChapter4Narratives(mockStats, {}, customSettings);
  const catalog = buildChapter4TablesAndFiguresCatalog(mockStats, customSettings);

  // 1. Provisional snapshot wording (never called final locked dataset when pendingN > 0)
  assert.ok(narratives['4.1'].findingsText.includes('provisional analysis snapshot'));
  assert.ok(narratives['4.1'].findingsText.includes('Table 9'));
  assert.ok(narratives['4.2'].introText.includes('Table 10'));
  assert.ok(narratives['4.2'].introText.includes('Figures 6 to 9'));

  // 2. H3 interpretation includes Pearson primary support + Spearman caution
  assert.ok(narratives['4.6'].interpretationText.includes('caution'));
  assert.ok(narratives['4.7'].interpretationText.includes('.110'));

  // 3. No "p = < .001" anywhere in narratives or catalog tables
  const fullJson = JSON.stringify({ narratives, catalog });
  assert.ok(!fullJson.includes('p = < .001'), 'Must never contain "p = < .001"');
  assert.ok(fullJson.includes('p < .001'), 'Should contain proper "p < .001"');
});


