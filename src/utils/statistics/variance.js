import { extractValidNumbers } from './helpers.js';
import { calculateMean } from './mean.js';

/**
 * Calculates variance of valid numeric values.
 * Uses sample variance (n - 1 denominator) by default for academic research samples.
 */
export function calculateVariance(values, { sample = true } = {}) {
  const nums = extractValidNumbers(values);
  const n = nums.length;
  if (sample && n < 2) return null;
  if (!sample && n < 1) return null;

  const mean = calculateMean(nums);
  let sumSquaredDiffs = 0;
  for (let i = 0; i < n; i += 1) {
    const diff = nums[i] - mean;
    sumSquaredDiffs += diff * diff;
  }

  const denominator = sample ? n - 1 : n;
  return sumSquaredDiffs / denominator;
}
