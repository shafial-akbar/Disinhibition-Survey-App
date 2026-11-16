import { CONSTRUCT_LIST } from '../../config/questionnaireConfig.js';
import { calculateCronbachAlpha } from '../../utils/statistics/cronbachAlpha.js';

/**
 * Runs Cronbach's Alpha reliability analysis separately for PCW (4 items),
 * PT (6 items), and WSD (8 items) using individual raw item responses.
 */
export function runReliabilityAnalysis(validRows = []) {
  const scales = CONSTRUCT_LIST.map(construct => {
    const labelMap = {};
    construct.items.forEach((key, idx) => {
      labelMap[key] = construct.itemTexts[idx] || key;
    });

    const result = calculateCronbachAlpha(validRows, construct.items, labelMap);

    return {
      code: construct.code,
      name: construct.name,
      nameBn: construct.nameBn,
      ...result,
    };
  });

  return {
    scales,
    methodologyNote:
      'Cronbach\'s alpha is computed from individual item responses (never composite totals) using sample variances: α = [k / (k - 1)] × [1 - (Σ s_i² / s_total²)]. Reliability is sample-dependent and high alpha alone does not prove construct validity.',
  };
}
