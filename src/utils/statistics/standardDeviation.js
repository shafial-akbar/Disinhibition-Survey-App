import { calculateVariance } from './variance.js';

/**
 * Calculates standard deviation (square root of sample variance by default).
 */
export function calculateStandardDeviation(values, { sample = true } = {}) {
  const variance = calculateVariance(values, { sample });
  if (variance === null) return null;
  return Math.sqrt(variance);
}
