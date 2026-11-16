import { studentTTwoTailedP } from './helpers.js';
import { calculateCorrelationCI } from './confidenceInterval.js';
import { CORRELATION_STRENGTH_BANDS } from '../../config/analysisConfig.js';

export function interpretCorrelation(r, pValue, alpha = 0.05) {
  if (r === null || !Number.isFinite(r)) {
    return {
      direction: 'Not calculable',
      strength: 'Not calculable',
      significant: false,
    };
  }
  const absR = Math.abs(r);
  const direction = r > 0.0001 ? 'Positive' : r < -0.0001 ? 'Negative' : 'Zero';
  const band = CORRELATION_STRENGTH_BANDS.find(b => absR >= b.min) || CORRELATION_STRENGTH_BANDS[4];

  return {
    direction,
    strength: band.label,
    strengthBn: band.labelBn,
    significant: pValue !== null && pValue < alpha,
  };
}

/**
 * Calculates Pearson product-moment correlation coefficient (r),
 * two-tailed p-value, degrees of freedom, and 95% confidence interval.
 */
export function calculatePearsonCorrelation(xValues, yValues) {
  if (!Array.isArray(xValues) || !Array.isArray(yValues)) {
    return { r: null, pValue: null, n: 0, df: 0, ci: { lower: null, upper: null }, warning: 'Invalid input arrays.' };
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
      r: null,
      pValue: null,
      n,
      df: Math.max(0, n - 2),
      ci: { lower: null, upper: null },
      interpretation: interpretCorrelation(null, null),
      warning: 'At least 3 paired observations are required for Pearson correlation.',
    };
  }

  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i += 1) {
    sumX += xClean[i];
    sumY += yClean[i];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let covSum = 0;
  let ssX = 0;
  let ssY = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = xClean[i] - meanX;
    const dy = yClean[i] - meanY;
    covSum += dx * dy;
    ssX += dx * dx;
    ssY += dy * dy;
  }

  if (ssX === 0 || ssY === 0) {
    return {
      r: null,
      pValue: null,
      n,
      df: n - 2,
      ci: { lower: null, upper: null },
      interpretation: interpretCorrelation(null, null),
      warning: 'One or both variables have zero variance (constant values); correlation is undefined.',
    };
  }

  let r = covSum / Math.sqrt(ssX * ssY);
  if (r > 1) r = 1;
  if (r < -1) r = -1;

  const df = n - 2;
  let pValue = 0;
  let tStat = Infinity;
  if (Math.abs(r) < 1) {
    tStat = r * Math.sqrt(df / (1 - r * r));
    pValue = studentTTwoTailedP(tStat, df);
  }

  const ci = calculateCorrelationCI(r, n);

  return {
    r,
    tStat,
    pValue,
    n,
    df,
    ci,
    interpretation: interpretCorrelation(r, pValue),
    warning: null,
  };
}
