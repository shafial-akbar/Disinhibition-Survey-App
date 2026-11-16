import { studentTCritical } from './helpers.js';

/**
 * Calculates 95% confidence interval for a Pearson or Spearman correlation coefficient
 * using Fisher's r-to-z transformation.
 */
export function calculateCorrelationCI(r, n, confidence = 0.95) {
  if (!Number.isFinite(r) || !Number.isFinite(n) || n < 4) {
    return { lower: null, upper: null, note: 'Sample size n >= 4 is required for a 95% CI.' };
  }
  if (Math.abs(r) >= 1) {
    const bound = r > 0 ? 1 : -1;
    return { lower: bound, upper: bound, note: 'Exact boundary correlation (|r| = 1).' };
  }

  // z_alpha/2 (1.95996 for 95% CI)
  const zCrit = confidence === 0.99 ? 2.575829 : 1.959964;
  const fisherZ = 0.5 * Math.log((1 + r) / (1 - r));
  const se = 1 / Math.sqrt(n - 3);
  const zLow = fisherZ - zCrit * se;
  const zHigh = fisherZ + zCrit * se;

  const lower = Math.tanh(zLow);
  const upper = Math.tanh(zHigh);

  return { lower, upper, note: null };
}

/**
 * Calculates two-sided t-based 95% confidence interval for a sample mean.
 */
export function calculateMeanCI(mean, sd, n, alpha = 0.05) {
  if (!Number.isFinite(mean) || !Number.isFinite(sd) || !Number.isFinite(n) || n < 2) {
    return { lower: null, upper: null };
  }
  const tCrit = studentTCritical(n - 1, alpha);
  const se = sd / Math.sqrt(n);
  return {
    lower: mean - tCrit * se,
    upper: mean + tCrit * se,
  };
}
