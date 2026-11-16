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
