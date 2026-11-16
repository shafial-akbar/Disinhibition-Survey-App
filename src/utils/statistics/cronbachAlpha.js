import { calculateVariance } from './variance.js';
import { calculateMean } from './mean.js';
import { calculateStandardDeviation } from './standardDeviation.js';
import { calculatePearsonCorrelation } from './pearsonCorrelation.js';
import { RELIABILITY_THRESHOLDS } from '../../config/analysisConfig.js';

/**
 * Computes Cronbach's Alpha for a multi-item scale using raw individual item responses.
 * Formula: Alpha = [k / (k - 1)] * [1 - (sum of item variances / variance of total score)]
 *
 * Uses listwise complete cases across the items of the construct.
 * Also calculates corrected item-total (item-rest) correlation and Alpha if item deleted.
 */
export function calculateCronbachAlpha(rows, itemKeys, itemLabels = {}) {
  const k = Array.isArray(itemKeys) ? itemKeys.length : 0;
  if (!Array.isArray(rows) || k < 2) {
    return {
      alpha: null,
      itemCount: k,
      validN: 0,
      excludedMissingN: Array.isArray(rows) ? rows.length : 0,
      items: [],
      warning: 'At least 2 items are required to compute Cronbach\'s Alpha.',
    };
  }

  // Extract complete numeric vectors across all k items
  const validRows = [];
  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r];
    if (!row) continue;
    let allValid = true;
    const itemVals = {};
    for (let i = 0; i < k; i += 1) {
      const key = itemKeys[i];
      const raw = row[key];
      const num = raw === null || raw === undefined || raw === '' ? NaN : Number(raw);
      if (!Number.isFinite(num)) {
        allValid = false;
        break;
      }
      itemVals[key] = num;
    }
    if (allValid) {
      validRows.push(itemVals);
    }
  }

  const validN = validRows.length;
  const excludedMissingN = rows.length - validN;

  if (validN < 2) {
    return {
      alpha: null,
      itemCount: k,
      validN,
      excludedMissingN,
      items: itemKeys.map(key => ({
        key,
        label: itemLabels[key] || key,
        mean: null,
        sd: null,
        variance: null,
        correctedItemTotalCorrelation: null,
        alphaIfDeleted: null,
      })),
      warning: 'At least 2 complete participant responses are required to calculate Cronbach\'s Alpha.',
    };
  }

  // Compute each item's column vector and total scores
  const itemVectors = {};
  for (let i = 0; i < k; i += 1) {
    const key = itemKeys[i];
    itemVectors[key] = validRows.map(r => r[key]);
  }

  const totalScores = validRows.map(r =>
    itemKeys.reduce((sum, key) => sum + r[key], 0)
  );

  const totalVariance = calculateVariance(totalScores, { sample: true });
  const itemVariances = itemKeys.map(key => calculateVariance(itemVectors[key], { sample: true }));
  const sumItemVariances = itemVariances.reduce((acc, v) => acc + (v || 0), 0);

  let alpha = null;
  let warning = null;

  if (totalVariance === null || totalVariance === 0) {
    warning = 'Total scale variance is 0 (all participants gave identical total scores); Alpha cannot be computed.';
  } else {
    alpha = (k / (k - 1)) * (1 - sumItemVariances / totalVariance);
  }

  // Compute item-level diagnostics (corrected item-total correlation & alpha if deleted)
  const itemStats = itemKeys.map((key, idx) => {
    const itemVec = itemVectors[key];
    const restScores = validRows.map((r, rIdx) => totalScores[rIdx] - r[key]);
    const restVariance = calculateVariance(restScores, { sample: true });
    const restSumItemVariances = sumItemVariances - (itemVariances[idx] || 0);

    const corrResult = calculatePearsonCorrelation(itemVec, restScores);

    let alphaIfDeleted = null;
    if (k > 2 && restVariance !== null && restVariance > 0) {
      alphaIfDeleted = ((k - 1) / (k - 2)) * (1 - restSumItemVariances / restVariance);
    }

    return {
      key,
      label: itemLabels[key] || key,
      mean: calculateMean(itemVec),
      sd: calculateStandardDeviation(itemVec, { sample: true }),
      variance: itemVariances[idx],
      correctedItemTotalCorrelation: corrResult.r,
      alphaIfDeleted,
    };
  });

  const interpretation = interpretCronbachAlpha(alpha);

  return {
    alpha,
    itemCount: k,
    validN,
    excludedMissingN,
    sumItemVariances,
    totalVariance,
    items: itemStats,
    interpretation,
    warning,
  };
}

export function interpretCronbachAlpha(alpha) {
  if (alpha === null || !Number.isFinite(alpha)) {
    return {
      label: 'Not calculable',
      labelBn: 'হিসাব করা সম্ভব নয়',
    };
  }
  const match = RELIABILITY_THRESHOLDS.find(t => alpha >= t.min);
  return match || RELIABILITY_THRESHOLDS[RELIABILITY_THRESHOLDS.length - 1];
}
