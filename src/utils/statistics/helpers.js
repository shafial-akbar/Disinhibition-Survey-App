/**
 * Shared Mathematical & Statistical Helper Functions
 * Used for clean data filtering, rank ties, p-values (incomplete beta / gamma),
 * and Q-Q plot theoretical normal quantiles.
 */

export function extractValidNumbers(values) {
  if (!Array.isArray(values)) return [];
  const clean = [];
  for (let i = 0; i < values.length; i += 1) {
    const val = values[i];
    if (val === null || val === undefined || val === '' || typeof val === 'boolean') {
      continue;
    }
    const num = Number(val);
    if (Number.isFinite(num)) {
      clean.push(num);
    }
  }
  return clean;
}

/**
 * Computes average ranks for an array of numbers, handling ties properly.
 * Example: [10, 20, 20, 30] -> [1, 2.5, 2.5, 4]
 */
export function computeAverageRanks(values) {
  const n = values.length;
  const indexed = values.map((val, idx) => ({ val, idx }));
  indexed.sort((a, b) => a.val - b.val);

  const ranks = new Array(n);
  const tieCounts = [];

  let i = 0;
  while (i < n) {
    let j = i;
    while (j + 1 < n && indexed[j + 1].val === indexed[i].val) {
      j += 1;
    }
    const count = j - i + 1;
    const avgRank = (i + 1 + (j + 1)) / 2;
    for (let k = i; k <= j; k += 1) {
      ranks[indexed[k].idx] = avgRank;
    }
    if (count > 1) {
      tieCounts.push(count);
    }
    i = j + 1;
  }

  return { ranks, tieCounts };
}

/**
 * Standard normal cumulative distribution function Phi(z).
 */
export function normalCdf(z) {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

/**
 * Error function erf(x) using Abramowitz & Stegun 7.1.26 (max error 1.5e-7).
 */
export function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * absX);
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t) *
      Math.exp(-absX * absX);
  return sign * y;
}

/**
 * Inverse standard normal CDF (Acklam's rational approximation).
 * Used for Q-Q plots and Shapiro-Wilk expected normal scores.
 */
export function normalQuantile(p) {
  if (p <= 0 || p >= 1) return NaN;

  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (p <= pHigh) {
    const q = p - 0.5;
    const r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  }
  const q = Math.sqrt(-2 * Math.log(1 - p));
  return -(
    (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  );
}

/**
 * Log-gamma function (Lanczos approximation).
 */
export function logGamma(z) {
  const coeffs = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let y = z;
  let tmp = z + 5.5;
  tmp -= (z + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < coeffs.length; j += 1) {
    y += 1;
    ser += coeffs[j] / y;
  }
  return -tmp + Math.log((2.5066282746310005 * ser) / z);
}

function betacf(a, b, x) {
  const MAXIT = 200;
  const EPS = 3e-14;
  const FPMIN = 1e-30;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m += 1) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/**
 * Regularized incomplete beta function I_x(a, b).
 */
export function regularizedBeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x)
  );
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(a, b, x)) / a;
  }
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/**
 * Two-tailed p-value for Student's t distribution with df degrees of freedom.
 */
export function studentTTwoTailedP(tStat, df) {
  if (!Number.isFinite(tStat) || !Number.isFinite(df) || df <= 0) return null;
  if (tStat === 0) return 1;
  const x = df / (df + tStat * tStat);
  return regularizedBeta(x, df / 2, 0.5);
}

/**
 * Upper-tail p-value for F distribution with df1, df2 degrees of freedom.
 */
export function fUpperTailP(fStat, df1, df2) {
  if (!Number.isFinite(fStat) || fStat < 0 || df1 <= 0 || df2 <= 0) return null;
  if (fStat === 0) return 1;
  const x = df2 / (df2 + df1 * fStat);
  return regularizedBeta(x, df2 / 2, df1 / 2);
}

/**
 * Lower regularized gamma function P(a, x) for Chi-square p-values.
 */
function regularizedGammaUpper(a, x) {
  if (x <= 0) return 1;
  if (x < a + 1) {
    let ap = a;
    let sum = 1 / a;
    let del = sum;
    for (let n = 1; n <= 200; n += 1) {
      ap += 1;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * 1e-14) {
        const p = sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
        return Math.max(0, Math.min(1, 1 - p));
      }
    }
    return 0;
  }
  let b = x + 1 - a;
  let c = 1 / 1e-30;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i <= 200; i += 1) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = b + an / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-14) break;
  }
  return Math.max(0, Math.min(1, Math.exp(-x + a * Math.log(x) - logGamma(a)) * h));
}

export function chiSquareUpperTailP(chiSq, df) {
  if (!Number.isFinite(chiSq) || chiSq < 0 || df <= 0) return null;
  return regularizedGammaUpper(df / 2, chiSq / 2);
}

/**
 * Inverse Student t critical value (bisection) for two-tailed alpha (default 0.05 -> 95% CI).
 */
export function studentTCritical(df, alpha = 0.05) {
  if (!Number.isFinite(df) || df <= 0) return null;
  let low = 0;
  let high = 100;
  for (let iter = 0; iter < 60; iter += 1) {
    const mid = (low + high) / 2;
    const p = studentTTwoTailedP(mid, df);
    if (p > alpha) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}
