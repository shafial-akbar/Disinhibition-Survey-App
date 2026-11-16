import { extractValidNumbers } from './helpers.js';

/**
 * Calculates the median (middle value) of valid numeric values.
 */
export function calculateMedian(values) {
  const nums = extractValidNumbers(values).sort((a, b) => a - b);
  const n = nums.length;
  if (n === 0) return null;

  const middle = Math.floor(n / 2);
  if (n % 2 === 1) {
    return nums[middle];
  }
  return (nums[middle - 1] + nums[middle]) / 2;
}
