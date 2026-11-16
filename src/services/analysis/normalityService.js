import { CONSTRUCT_LIST } from '../../config/questionnaireConfig.js';
import { calculateShapiroWilk } from '../../utils/statistics/shapiroWilk.js';
import { calculateSkewnessAndKurtosis } from '../../utils/statistics/skewnessKurtosis.js';
import { buildHistogramBins } from './descriptiveService.js';

/**
 * Assesses normality for PCW, PT, and WSD composite mean scores.
 */
export function runNormalityAnalysis(scoredRows = []) {
  const scales = CONSTRUCT_LIST.map(construct => {
    const values = scoredRows
      .map(r => r[`${construct.code}_mean`])
      .filter(v => v !== null && Number.isFinite(v));

    const sw = calculateShapiroWilk(values);
    const { skewness, seSkewness, kurtosis, seKurtosis } = calculateSkewnessAndKurtosis(values);
    const histogram = buildHistogramBins(values, 1, 5, 8);

    let interpretation = 'Normality cannot be evaluated yet (insufficient observations).';
    let status = 'insufficient';
    if (sw.pValue !== null) {
      if (sw.pValue < 0.05) {
        status = 'non_normal';
        interpretation =
          'p < .05 indicates statistically significant departure from normality (evidence against a normal distribution). Consider examining both Pearson and Spearman correlations.';
      } else {
        status = 'sufficient';
        interpretation =
          'p >= .05 indicates insufficient evidence to reject normality in this sample. Note: failing to reject normality does not prove the population distribution is strictly normal, and Shapiro-Wilk tests are sensitive to sample size.';
      }
    }

    return {
      code: construct.code,
      name: construct.name,
      n: sw.n,
      wStatistic: sw.w,
      pValue: sw.pValue,
      skewness,
      seSkewness,
      kurtosis,
      seKurtosis,
      qqPoints: sw.qqPoints,
      histogram,
      status,
      interpretation,
      warning: sw.warning,
    };
  });

  return {
    scales,
    methodologyNote:
      'Normality tests are sensitive to sample size (small samples have low power; very large samples flag minor deviations). Pearson correlation assumptions focus on linearity, absence of extreme outliers, and joint distribution behavior rather than one isolated normality test.',
  };
}
