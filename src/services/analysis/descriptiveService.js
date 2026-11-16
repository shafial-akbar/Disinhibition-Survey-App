import { CONSTRUCT_LIST, QUESTIONNAIRE_CONFIG } from '../../config/questionnaireConfig.js';
import { extractValidNumbers } from '../../utils/statistics/helpers.js';
import { calculateMean } from '../../utils/statistics/mean.js';
import { calculateMedian } from '../../utils/statistics/median.js';
import { calculateMode } from '../../utils/statistics/mode.js';
import { calculateVariance } from '../../utils/statistics/variance.js';
import { calculateStandardDeviation } from '../../utils/statistics/standardDeviation.js';
import { calculateSkewnessAndKurtosis } from '../../utils/statistics/skewnessKurtosis.js';

export function computeNumericSummary(values, label, meta = {}) {
  const totalRows = Array.isArray(values) ? values.length : 0;
  const nums = extractValidNumbers(values);
  const validN = nums.length;
  const missingN = totalRows - validN;

  const mean = calculateMean(nums);
  const median = calculateMedian(nums);
  const modeResult = calculateMode(nums);
  const variance = calculateVariance(nums, { sample: true });
  const sd = calculateStandardDeviation(nums, { sample: true });
  const se = sd !== null && validN > 0 ? sd / Math.sqrt(validN) : null;
  const min = validN > 0 ? Math.min(...nums) : null;
  const max = validN > 0 ? Math.max(...nums) : null;
  const range = min !== null && max !== null ? max - min : null;
  const { skewness, kurtosis } = calculateSkewnessAndKurtosis(nums);

  return {
    label,
    ...meta,
    validN,
    missingN,
    mean,
    median,
    mode: modeResult ? modeResult.primaryMode : null,
    modesText: modeResult
      ? modeResult.modes.map(m => Number(m.toFixed(2))).join(', ') +
        (modeResult.isMultimodal ? ' (multimodal)' : '')
      : '—',
    sd,
    variance,
    min,
    max,
    range,
    se,
    skewness,
    kurtosis,
    values: nums,
  };
}

export function computeFrequencyTable(rows, fieldName, orderedCategories = []) {
  const counts = new Map();
  let validCount = 0;
  let missingCount = 0;

  for (const cat of orderedCategories) {
    counts.set(cat, 0);
  }

  for (const row of rows) {
    const raw = row?.[fieldName];
    if (raw === null || raw === undefined || String(raw).trim() === '') {
      missingCount += 1;
    } else {
      const val = String(raw).trim();
      validCount += 1;
      counts.set(val, (counts.get(val) || 0) + 1);
    }
  }

  const totalN = rows.length;
  const categories = Array.from(counts.entries()).map(([category, count]) => ({
    category,
    count,
    percentTotal: totalN > 0 ? (count / totalN) * 100 : 0,
    validPercent: validCount > 0 ? (count / validCount) * 100 : 0,
  }));

  return {
    fieldName,
    totalN,
    validCount,
    missingCount,
    categories,
  };
}

export function computeMultiSelectFrequencyTable(rows, fieldName) {
  const counts = new Map();
  let respondentsWithSelection = 0;

  for (const row of rows) {
    const raw = row?.[fieldName];
    const items = Array.isArray(raw) ? raw : [];
    if (items.length > 0) respondentsWithSelection += 1;

    const seen = new Set();
    for (const item of items) {
      const label = String(item || '').trim();
      if (label && !seen.has(label)) {
        seen.add(label);
        counts.set(label, (counts.get(label) || 0) + 1);
      }
    }
  }

  const totalRespondents = rows.length;
  const totalSelections = Array.from(counts.values()).reduce((s, c) => s + c, 0);

  const options = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([option, count]) => ({
      option,
      count,
      percentOfRespondents: totalRespondents > 0 ? (count / totalRespondents) * 100 : 0,
      percentOfSelections: totalSelections > 0 ? (count / totalSelections) * 100 : 0,
    }));

  return {
    fieldName,
    totalRespondents,
    respondentsWithSelection,
    totalSelections,
    options,
  };
}

export function buildHistogramBins(values, minVal = 1, maxVal = 5, binCount = 8) {
  const nums = extractValidNumbers(values);
  if (nums.length === 0) return [];

  const step = (maxVal - minVal) / binCount;
  const bins = Array.from({ length: binCount }, (_, idx) => {
    const start = minVal + idx * step;
    const end = minVal + (idx + 1) * step;
    return {
      rangeLabel: `${start.toFixed(1)}–${end.toFixed(1)}`,
      start,
      end,
      count: 0,
    };
  });

  for (const v of nums) {
    let idx = Math.floor((v - minVal) / step);
    if (idx < 0) idx = 0;
    if (idx >= binCount) idx = binCount - 1;
    bins[idx].count += 1;
  }
  return bins;
}

export function runDescriptiveAnalysis(validRows = [], scoredRows = []) {
  // Composite scores (means & totals)
  const compositeSummaries = CONSTRUCT_LIST.map(construct => ({
    code: construct.code,
    name: construct.name,
    meanSummary: computeNumericSummary(
      scoredRows.map(r => r[`${construct.code}_mean`]),
      `${construct.name} (Mean Score)`,
      { code: construct.code, type: 'mean', itemCount: construct.itemCount }
    ),
    totalSummary: computeNumericSummary(
      scoredRows.map(r => r[`${construct.code}_total`]),
      `${construct.name} (Total Score)`,
      { code: construct.code, type: 'total', itemCount: construct.itemCount }
    ),
    histogram: buildHistogramBins(
      scoredRows.map(r => r[`${construct.code}_mean`]),
      1,
      5,
      8
    ),
  }));

  // Item-level descriptive statistics across all 18 raw items
  const itemSummaries = CONSTRUCT_LIST.flatMap(construct =>
    construct.items.map((key, idx) =>
      computeNumericSummary(
        validRows.map(r => r[key]),
        key.toUpperCase(),
        {
          key,
          constructCode: construct.code,
          constructName: construct.name,
          statement: construct.itemTexts[idx],
          statementBn: construct.itemTextsBn[idx],
        }
      )
    )
  );

  // Categorical Demographic & AI Usage summaries
  const demographics = {
    age_group: computeFrequencyTable(validRows, 'age_group', QUESTIONNAIRE_CONFIG.allowedAgeGroups),
    gender: computeFrequencyTable(validRows, 'gender', QUESTIONNAIRE_CONFIG.allowedGenders),
    education: computeFrequencyTable(validRows, 'education', QUESTIONNAIRE_CONFIG.allowedEducations),
    occupation: computeFrequencyTable(validRows, 'occupation', QUESTIONNAIRE_CONFIG.allowedOccupations),
  };

  const aiUsage = {
    primary_ai_tool: computeFrequencyTable(validRows, 'primary_ai_tool'),
    ai_tools: computeMultiSelectFrequencyTable(validRows, 'ai_tools'),
    ai_frequency: computeFrequencyTable(validRows, 'ai_frequency', QUESTIONNAIRE_CONFIG.allowedFrequencies),
    ai_duration: computeFrequencyTable(validRows, 'ai_duration', QUESTIONNAIRE_CONFIG.allowedDurations),
    ai_purpose: computeMultiSelectFrequencyTable(validRows, 'ai_purpose'),
    ai_familiarity: computeFrequencyTable(validRows, 'ai_familiarity', QUESTIONNAIRE_CONFIG.allowedFamiliarities),
  };

  return {
    sampleSize: validRows.length,
    compositeSummaries,
    itemSummaries,
    demographics,
    aiUsage,
    varianceMethodNote: 'All variance and standard deviation figures use sample formulas (n - 1 denominator).',
  };
}
