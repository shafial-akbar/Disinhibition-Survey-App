import { CONSTRUCT_LIST } from '../../config/questionnaireConfig.js';
import { calculatePearsonCorrelation } from '../../utils/statistics/pearsonCorrelation.js';
import { calculateSpearmanCorrelation } from '../../utils/statistics/spearmanCorrelation.js';
import { calculateLinearRegression } from '../../utils/statistics/groupComparisons.js';

export const CORRELATION_PAIRS = [
  { id: 'H1', varX: 'PCW', varY: 'PT', label: 'Perceived Conversational Warmth <-> Perceived Trust' },
  { id: 'H2', varX: 'PT', varY: 'WSD', label: 'Perceived Trust <-> Willingness to Self-Disclose' },
  { id: 'H3', varX: 'PCW', varY: 'WSD', label: 'Perceived Conversational Warmth <-> Willingness to Self-Disclose' },
];

/**
 * Computes Pearson r and Spearman rho correlations across PCW, PT, and WSD composite means.
 * Supports pairwise and listwise missing-data deletion transparently.
 */
export function runCorrelationAnalysis(scoredRows = [], settings = {}) {
  const deletionMode = settings.correlationDeletion === 'listwise' ? 'listwise' : 'pairwise';

  // If listwise deletion is chosen, filter to rows where PCW, PT, and WSD means are all non-null
  const workingRows =
    deletionMode === 'listwise'
      ? scoredRows.filter(
          r =>
            Number.isFinite(r.PCW_mean) &&
            Number.isFinite(r.PT_mean) &&
            Number.isFinite(r.WSD_mean)
        )
      : scoredRows;

  const pairs = CORRELATION_PAIRS.map(pair => {
    const xKey = `${pair.varX}_mean`;
    const yKey = `${pair.varY}_mean`;

    const xArr = [];
    const yArr = [];
    const scatterPoints = [];

    for (const row of workingRows) {
      const xv = row[xKey];
      const yv = row[yKey];
      if (Number.isFinite(xv) && Number.isFinite(yv)) {
        xArr.push(xv);
        yArr.push(yv);
        scatterPoints.push({
          id: row.id,
          x: Number(xv.toFixed(3)),
          y: Number(yv.toFixed(3)),
          tool: row.primary_ai_tool || 'Unknown',
        });
      }
    }

    const pearson = calculatePearsonCorrelation(xArr, yArr);
    const spearman = calculateSpearmanCorrelation(xArr, yArr);
    const regression = calculateLinearRegression(xArr, yArr);

    let trendLine = [];
    if (regression.applicable && scatterPoints.length > 0) {
      const xs = scatterPoints.map(p => p.x);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      trendLine = [
        { x: minX, y: Number((regression.intercept + regression.slope * minX).toFixed(3)) },
        { x: maxX, y: Number((regression.intercept + regression.slope * maxX).toFixed(3)) },
      ];
    }

    return {
      ...pair,
      pearson,
      spearman,
      regression,
      scatterPoints,
      trendLine,
      n: pearson.n,
    };
  });

  // Build 3x3 correlation matrices (Pearson & Spearman)
  const codes = CONSTRUCT_LIST.map(c => c.code);
  const pearsonMatrix = {};
  const spearmanMatrix = {};

  for (const rowCode of codes) {
    pearsonMatrix[rowCode] = {};
    spearmanMatrix[rowCode] = {};
    for (const colCode of codes) {
      if (rowCode === colCode) {
        pearsonMatrix[rowCode][colCode] = { r: 1, pValue: null, n: workingRows.length };
        spearmanMatrix[rowCode][colCode] = { rho: 1, pValue: null, n: workingRows.length };
      } else {
        const match = pairs.find(
          p =>
            (p.varX === rowCode && p.varY === colCode) ||
            (p.varX === colCode && p.varY === rowCode)
        );
        pearsonMatrix[rowCode][colCode] = match ? match.pearson : { r: null, pValue: null, n: 0 };
        spearmanMatrix[rowCode][colCode] = match ? match.spearman : { rho: null, pValue: null, n: 0 };
      }
    }
  }

  return {
    deletionMode,
    totalInputRows: scoredRows.length,
    listwiseN:
      scoredRows.filter(
        r =>
          Number.isFinite(r.PCW_mean) &&
          Number.isFinite(r.PT_mean) &&
          Number.isFinite(r.WSD_mean)
      ).length,
    pairs,
    codes,
    pearsonMatrix,
    spearmanMatrix,
    comparisonNote:
      'Pearson r measures linear association between raw mean scores and is sensitive to outliers or skewness, while Spearman rho measures monotonic association using ranked scores.',
  };
}
