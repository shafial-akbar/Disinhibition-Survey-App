import { extractValidNumbers } from './helpers.js';
import { calculateMean } from './mean.js';
import { calculateStandardDeviation } from './standardDeviation.js';

/**
 * Calculates adjusted Fisher-Pearson sample skewness (G1) and excess kurtosis (G2)
 * matching SPSS and jamovi output formulas.
 * Returns { skewness, kurtosis, seSkewness, seKurtosis } with null when sample size is too small.
 */
export function calculateSkewnessAndKurtosis(values) {
  const nums = extractValidNumbers(values);
  const n = nums.length;
  const mean = calculateMean(nums);
  const sd = calculateStandardDeviation(nums, { sample: true });

  let skewness = null;
  let seSkewness = null;
  if (n >= 3 && sd !== null && sd > 0) {
    let m3Sum = 0;
    for (let i = 0; i < n; i += 1) {
      const z = (nums[i] - mean) / sd;
      m3Sum += z * z * z;
    }
    skewness = (n / ((n - 1) * (n - 2))) * m3Sum;
    seSkewness = Math.sqrt((6 * n * (n - 1)) / ((n - 2) * (n + 1) * (n + 3)));
  }

  let kurtosis = null;
  let seKurtosis = null;
  if (n >= 4 && sd !== null && sd > 0) {
    let m4Sum = 0;
    for (let i = 0; i < n; i += 1) {
      const z = (nums[i] - mean) / sd;
      m4Sum += z * z * z * z;
    }
    const term1 = ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * m4Sum;
    const term2 = (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
    kurtosis = term1 - term2;
    seKurtosis =
      2 *
      seSkewness *
      Math.sqrt((n * n - 1) / ((n - 3) * (n + 5)));
  }

  return {
    skewness,
    seSkewness,
    kurtosis,
    seKurtosis,
  };
}
