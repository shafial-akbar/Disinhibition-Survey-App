import { extractValidNumbers } from './helpers.js';

/**
 * Calculates the mode (most frequent value or tied values) of valid numeric values.
 * Returns { modes: number[], frequency: number, isMultimodal: boolean } or null when empty.
 */
export function calculateMode(values) {
  const nums = extractValidNumbers(values);
  if (nums.length === 0) return null;

  const counts = new Map();
  let maxFreq = 0;

  for (let i = 0; i < nums.length; i += 1) {
    // Round keys safely to avoid floating point mismatch (e.g., 4.1666667)
    const val = Math.round(nums[i] * 10000) / 10000;
    const freq = (counts.get(val) || 0) + 1;
    counts.set(val, freq);
    if (freq > maxFreq) {
      maxFreq = freq;
    }
  }

  const modes = [];
  for (const [val, freq] of counts.entries()) {
    if (freq === maxFreq) {
      modes.push(val);
    }
  }
  modes.sort((a, b) => a - b);

  return {
    modes,
    primaryMode: modes[0],
    frequency: maxFreq,
    isMultimodal: modes.length > 1,
  };
}
