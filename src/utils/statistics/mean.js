import { extractValidNumbers } from './helpers.js';

/**
 * Calculates the arithmetic mean (average) of valid numeric values.
 * Formula: sum of all valid values / number of valid values.
 */
export function calculateMean(values) {
  const nums = extractValidNumbers(values);
  if (nums.length === 0) return null;
  const total = nums.reduce((sum, x) => sum + x, 0);
  return total / nums.length;
}
