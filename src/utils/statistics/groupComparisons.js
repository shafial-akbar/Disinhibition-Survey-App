import {
  extractValidNumbers,
  computeAverageRanks,
  normalCdf,
  studentTTwoTailedP,
  fUpperTailP,
  chiSquareUpperTailP,
} from './helpers.js';
import { calculateMean } from './mean.js';
import { calculateVariance } from './variance.js';
import { calculateStandardDeviation } from './standardDeviation.js';

/**
 * Welch's independent-samples t-test (does not assume equal variances)
 * with Hedges' g effect size.
 */
export function calculateWelchTTest(groupA, groupB) {
  const a = extractValidNumbers(groupA);
  const b = extractValidNumbers(groupB);
  if (a.length < 2 || b.length < 2) {
    return { applicable: false, reason: 'Each group needs at least 2 responses.' };
  }

  const meanA = calculateMean(a);
  const meanB = calculateMean(b);
  const varA = calculateVariance(a, { sample: true });
  const varB = calculateVariance(b, { sample: true });

  const seA = varA / a.length;
  const seB = varB / b.length;
  const seDiff = Math.sqrt(seA + seB);

  if (seDiff === 0) {
    return { applicable: false, reason: 'Both groups have zero variance.' };
  }

  const tStat = (meanA - meanB) / seDiff;
  const df =
    ((seA + seB) * (seA + seB)) /
    ((seA * seA) / (a.length - 1) + (seB * seB) / (b.length - 1));
  const pValue = studentTTwoTailedP(tStat, df);

  // Pooled SD for Cohen's d / Hedges' g
  const pooledVar =
    ((a.length - 1) * varA + (b.length - 1) * varB) / (a.length + b.length - 2);
  const cohensD = pooledVar > 0 ? (meanA - meanB) / Math.sqrt(pooledVar) : 0;

  return {
    applicable: true,
    tStat,
    df,
    pValue,
    cohensD,
    meanA,
    meanB,
    sdA: Math.sqrt(varA),
    sdB: Math.sqrt(varB),
    nA: a.length,
    nB: b.length,
  };
}

/**
 * Mann-Whitney U test (non-parametric alternative to independent t-test) with tie correction.
 */
export function calculateMannWhitneyU(groupA, groupB) {
  const a = extractValidNumbers(groupA);
  const b = extractValidNumbers(groupB);
  if (a.length < 2 || b.length < 2) {
    return { applicable: false, reason: 'Each group needs at least 2 responses.' };
  }

  const combined = [...a, ...b];
  const N = combined.length;
  const { ranks, tieCounts } = computeAverageRanks(combined);

  let rankSumA = 0;
  for (let i = 0; i < a.length; i += 1) {
    rankSumA += ranks[i];
  }

  const n1 = a.length;
  const n2 = b.length;
  const u1 = n1 * n2 + (n1 * (n1 + 1)) / 2 - rankSumA;
  const u2 = n1 * n2 - u1;
  const uStat = Math.min(u1, u2);

  let tieCorrection = 0;
  for (let i = 0; i < tieCounts.length; i += 1) {
    const t = tieCounts[i];
    tieCorrection += (t * t * t - t);
  }

  const meanU = (n1 * n2) / 2;
  const varU =
    ((n1 * n2) / 12) * (N + 1 - tieCorrection / (N * (N - 1)));

  if (varU <= 0) {
    return { applicable: false, reason: 'All observations across groups are tied.' };
  }

  const zStat = (uStat - meanU) / Math.sqrt(varU);
  const pValue = 2 * (1 - normalCdf(Math.abs(zStat)));
  const rEffect = Math.abs(zStat) / Math.sqrt(N);

  return {
    applicable: true,
    uStat,
    zStat,
    pValue,
    rEffect,
    nA: n1,
    nB: n2,
  };
}

/**
 * One-way ANOVA across 3+ groups with eta-squared effect size.
 */
export function calculateOneWayAnova(groupsMap) {
  const entries = Object.entries(groupsMap)
    .map(([label, vals]) => ({ label, vals: extractValidNumbers(vals) }))
    .filter(g => g.vals.length >= 2);

  if (entries.length < 2) {
    return { applicable: false, reason: 'At least 2 groups with >= 2 responses each are needed.' };
  }

  const allVals = entries.flatMap(g => g.vals);
  const grandMean = calculateMean(allVals);
  const totalN = allVals.length;
  const k = entries.length;

  let ssBetween = 0;
  let ssWithin = 0;

  const groupSummaries = entries.map(g => {
    const mean = calculateMean(g.vals);
    const sd = calculateStandardDeviation(g.vals, { sample: true });
    ssBetween += g.vals.length * (mean - grandMean) * (mean - grandMean);
    for (let i = 0; i < g.vals.length; i += 1) {
      ssWithin += (g.vals[i] - mean) * (g.vals[i] - mean);
    }
    return { label: g.label, n: g.vals.length, mean, sd };
  });

  const df1 = k - 1;
  const df2 = totalN - k;
  if (df2 <= 0 || ssWithin === 0) {
    return { applicable: false, reason: 'Insufficient within-group variance for ANOVA.' };
  }

  const msBetween = ssBetween / df1;
  const msWithin = ssWithin / df2;
  const fStat = msBetween / msWithin;
  const pValue = fUpperTailP(fStat, df1, df2);
  const ssTotal = ssBetween + ssWithin;
  const etaSquared = ssTotal > 0 ? ssBetween / ssTotal : 0;

  return {
    applicable: true,
    fStat,
    df1,
    df2,
    pValue,
    etaSquared,
    groups: groupSummaries,
  };
}

/**
 * Kruskal-Wallis H test across 2+ groups (non-parametric alternative to ANOVA) with tie adjustment.
 */
export function calculateKruskalWallis(groupsMap) {
  const entries = Object.entries(groupsMap)
    .map(([label, vals]) => ({ label, vals: extractValidNumbers(vals) }))
    .filter(g => g.vals.length >= 2);

  if (entries.length < 2) {
    return { applicable: false, reason: 'At least 2 groups with >= 2 responses each are needed.' };
  }

  const combined = [];
  const groupSlices = [];
  let offset = 0;

  for (const g of entries) {
    combined.push(...g.vals);
    groupSlices.push({ label: g.label, start: offset, count: g.vals.length });
    offset += g.vals.length;
  }

  const N = combined.length;
  const { ranks, tieCounts } = computeAverageRanks(combined);

  let sumSqMeanRank = 0;
  for (const slice of groupSlices) {
    let rankSum = 0;
    for (let i = slice.start; i < slice.start + slice.count; i += 1) {
      rankSum += ranks[i];
    }
    sumSqMeanRank += (rankSum * rankSum) / slice.count;
  }

  const hRaw = (12 / (N * (N + 1))) * sumSqMeanRank - 3 * (N + 1);
  let tieDenom = 0;
  for (const t of tieCounts) {
    tieDenom += (t * t * t - t);
  }
  const correction = 1 - tieDenom / (N * N * N - N);
  if (correction <= 0) {
    return { applicable: false, reason: 'All observations across groups are tied.' };
  }

  const hStat = hRaw / correction;
  const df = entries.length - 1;
  const pValue = chiSquareUpperTailP(hStat, df);

  return {
    applicable: true,
    hStat,
    df,
    pValue,
  };
}

/**
 * Simple Linear Regression (Y = b0 + b1 * X) with R^2, slope SE, t-stat, and p-value.
 */
export function calculateLinearRegression(xValues, yValues) {
  const len = Math.min(xValues.length, yValues.length);
  const xs = [];
  const ys = [];
  for (let i = 0; i < len; i += 1) {
    const x = Number(xValues[i]);
    const y = Number(yValues[i]);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      xs.push(x);
      ys.push(y);
    }
  }
  const n = xs.length;
  if (n < 4) {
    return { applicable: false, reason: 'At least 4 paired responses are required for regression.' };
  }

  const meanX = calculateMean(xs);
  const meanY = calculateMean(ys);

  let ssX = 0;
  let ssY = 0;
  let spXY = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    ssX += dx * dx;
    ssY += dy * dy;
    spXY += dx * dy;
  }

  if (ssX === 0 || ssY === 0) {
    return { applicable: false, reason: 'Zero variance in predictor or outcome variable.' };
  }

  const slope = spXY / ssX;
  const intercept = meanY - slope * meanX;
  let ssResidual = 0;
  for (let i = 0; i < n; i += 1) {
    const pred = intercept + slope * xs[i];
    ssResidual += (ys[i] - pred) * (ys[i] - pred);
  }

  const df = n - 2;
  const residualVar = ssResidual / df;
  const seSlope = Math.sqrt(residualVar / ssX);
  const tStat = seSlope > 0 ? slope / seSlope : 0;
  const pValue = studentTTwoTailedP(tStat, df);
  const rSquared = (spXY * spXY) / (ssX * ssY);

  return {
    applicable: true,
    n,
    df,
    intercept,
    slope,
    seSlope,
    tStat,
    pValue,
    rSquared,
  };
}
