import { extractValidNumbers, normalCdf, normalQuantile } from './helpers.js';

function poly(cc, nord, x) {
  let retVal = cc[0];
  if (nord > 1) {
    let p = x * cc[nord - 1];
    for (let j = nord - 2; j >= 1; j -= 1) {
      p = (p + cc[j]) * x;
    }
    retVal += p;
  }
  return retVal;
}

/**
 * Shapiro-Wilk Test of Normality (Royston AS R94 algorithm) for 3 <= n <= 5000.
 * Also builds Q-Q plot coordinates (theoretical normal quantile vs observed z-score).
 */
export function calculateShapiroWilk(values) {
  const clean = extractValidNumbers(values).sort((a, b) => a - b);
  const n = clean.length;

  if (n < 3) {
    return {
      w: null,
      pValue: null,
      n,
      qqPoints: [],
      warning: 'At least 3 valid observations are required for the Shapiro-Wilk test.',
    };
  }

  if (n > 5000) {
    return {
      w: null,
      pValue: null,
      n,
      qqPoints: [],
      warning: 'Shapiro-Wilk algorithm supports sample sizes up to n = 5000.',
    };
  }

  const range = clean[n - 1] - clean[0];
  if (range === 0) {
    return {
      w: null,
      pValue: null,
      n,
      qqPoints: [],
      warning: 'All observations are identical (variance is zero); normality cannot be tested.',
    };
  }

  // Royston (1992, 1995) AS R94 weights
  const c1 = [0, 0.221157, -0.147981, -2.07119, 4.434685, -2.706056];
  const c2 = [0, 0.042981, -0.293762, -1.752461, 5.682633, -3.582633];
  const c3 = [0.544, -0.39978, 0.025054, -0.6714e-3];
  const c4 = [1.3822, -0.77857, 0.062767, -0.0020322];
  const c5 = [-1.5861, -0.31082, -0.083751, 0.0038915];
  const c6 = [-0.4803, -0.082676, 0.0030302];
  const g = [-2.273, 0.459];

  const nn2 = Math.floor(n / 2);
  const a = new Array(nn2 + 1).fill(0);

  const an = n;
  const an25 = an + 0.25;
  let summ2 = 0;

  for (let i = 1; i <= nn2; i += 1) {
    const val = normalQuantile((i - 0.375) / an25);
    a[i] = val;
    summ2 += val * val;
  }
  summ2 *= 2;
  const ssumm2 = Math.sqrt(summ2);
  const rsn = 1 / Math.sqrt(an);
  const a1 = poly(c1, 6, rsn) - a[1] / ssumm2;

  let i1 = 3;
  let fac;
  if (n > 5) {
    const a2 = -a[2] / ssumm2 + poly(c2, 6, rsn);
    fac = Math.sqrt((summ2 - 2 * a[1] * a[1] - 2 * a[2] * a[2]) / (1 - 2 * a1 * a1 - 2 * a2 * a2));
    a[1] = a1;
    a[2] = a2;
  } else {
    fac = Math.sqrt((summ2 - 2 * a[1] * a[1]) / (1 - 2 * a1 * a1));
    a[1] = a1;
    i1 = 2;
  }

  for (let i = i1; i <= nn2; i += 1) {
    a[i] = -a[i] / fac;
  }

  // Compute W statistic
  let ssx = 0;
  let sax = 0;
  let mean = 0;
  for (let i = 0; i < n; i += 1) mean += clean[i];
  mean /= n;

  for (let i = 0; i < n; i += 1) {
    const diff = clean[i] - mean;
    ssx += diff * diff;
  }

  for (let i = 1; i <= nn2; i += 1) {
    const highIdx = n - i;
    const lowIdx = i - 1;
    sax += a[i] * (clean[highIdx] - clean[lowIdx]);
  }

  let w = (sax * sax) / ssx;
  if (w > 1) w = 1;

  // Calculate p-value using Royston's normal approximation
  let pValue;
  if (n === 3) {
    const pi6 = 1.909859317102744;
    const stqr = 1.047197551196598;
    const wSqrt = Math.sqrt(Math.max(0, 1 - w));
    pValue = Math.max(0, Math.min(1, pi6 * (Math.asin(Math.sqrt(w)) - stqr)));
    if (wSqrt === 0) pValue = 1;
  } else {
    const y = Math.log(Math.max(1e-16, 1 - w));
    const xx = Math.log(an);
    let m;
    let s;
    let z;

    if (n <= 11) {
      const gamma = poly(g, 2, an);
      if (y >= gamma) {
        pValue = 1e-16;
      } else {
        const yAdj = -Math.log(gamma - y);
        m = poly(c3, 4, an);
        s = Math.exp(poly(c4, 4, an));
        z = (yAdj - m) / s;
        pValue = 1 - normalCdf(z);
      }
    } else {
      m = poly(c5, 4, xx);
      s = Math.exp(poly(c6, 3, xx));
      z = (y - m) / s;
      pValue = 1 - normalCdf(z);
    }
  }

  // Q-Q Plot data points (Blom's plotting position (i - 0.375) / (n + 0.25))
  const variance = ssx / (n - 1);
  const sd = Math.sqrt(variance);
  const qqPoints = clean.map((val, idx) => {
    const p = (idx + 1 - 0.375) / (n + 0.25);
    const theoreticalZ = normalQuantile(p);
    const observedZ = sd > 0 ? (val - mean) / sd : 0;
    return {
      theoretical: Number(theoreticalZ.toFixed(4)),
      observed: Number(observedZ.toFixed(4)),
      rawValue: val,
    };
  });

  return {
    w,
    pValue,
    n,
    qqPoints,
    warning: null,
  };
}
