import { computeAverageRanks, studentTTwoTailedP } from './helpers.js';
import { calculatePearsonCorrelation, interpretCorrelation } from './pearsonCorrelation.js';
import { calculateCorrelationCI } from './confidenceInterval.js';

/**
 * Calculates Spearman rank-order correlation (rho) using average ranks for ties.
 * Because rank correlation with ties equals Pearson correlation applied to the
 * tie-averaged ranks, this handles ties accurately even when many Likert ties occur.
 */
export function calculateSpearmanCorrelation(xValues, yValues) {
  if (!Array.isArray(xValues) || !Array.isArray(yValues)) {
    return { rho: null, pValue: null, n: 0, df: 0, ci: { lower: null, upper: null }, warning: 'Invalid input arrays.' };
  }

  const len = Math.min(xValues.length, yValues.length);
  const xClean = [];
  const yClean = [];

  for (let i = 0; i < len; i += 1) {
    const xv = xValues[i];
    const yv = yValues[i];
    if (
      xv === null || xv === undefined || xv === '' ||
      yv === null || yv === undefined || yv === ''
    ) {
      continue;
    }
    const xn = Number(xv);
    const yn = Number(yv);
    if (Number.isFinite(xn) && Number.isFinite(yn)) {
      xClean.push(xn);
      yClean.push(yn);
    }
  }

  const n = xClean.length;
  if (n < 3) {
    return {
      rho: null,
      pValue: null,
      n,
      df: Math.max(0, n - 2),
      ci: { lower: null, upper: null },
      interpretation: interpretCorrelation(null, null),
      warning: 'At least 3 paired observations are required for Spearman correlation.',
    };
  }

  const { ranks: rx } = computeAverageRanks(xClean);
  const { ranks: ry } = computeAverageRanks(yClean);

  const pearsonOnRanks = calculatePearsonCorrelation(rx, ry);
  const rho = pearsonOnRanks.r;

  if (rho === null) {
    return {
      rho: null,
      pValue: null,
      n,
      df: n - 2,
      ci: { lower: null, upper: null },
      interpretation: interpretCorrelation(null, null),
      warning: pearsonOnRanks.warning,
    };
  }

  const df = n - 2;
  let pValue = 0;
  let tStat = Infinity;
  if (Math.abs(rho) < 1) {
    tStat = rho * Math.sqrt(df / (1 - rho * rho));
    pValue = studentTTwoTailedP(tStat, df);
  }

  const ci = calculateCorrelationCI(rho, n);

  return {
    rho,
    tStat,
    pValue,
    n,
    df,
    ci,
    interpretation: interpretCorrelation(rho, pValue),
    warning: null,
  };
}
