import { RESEARCH_HYPOTHESES } from '../../config/analysisConfig.js';
import {
  calculateWelchTTest,
  calculateMannWhitneyU,
  calculateOneWayAnova,
  calculateKruskalWallis,
  calculateLinearRegression,
} from '../../utils/statistics/groupComparisons.js';
import { formatNumber, formatPValue, formatCI } from '../../utils/formatters/numberFormatter.js';

/**
 * Evaluates confirmatory directional hypotheses H1, H2, and H3 (two-tailed p < alpha with positive direction),
 * plus assumption-checked exploratory group comparisons and regression.
 */
export function runHypothesisAndExploratoryAnalysis(
  scoredRows = [],
  validRows = [],
  correlationResult,
  settings = {}
) {
  const method = settings.primaryHypothesisMethod === 'spearman' ? 'spearman' : 'pearson';
  const alphaLevel = Number(settings.alphaLevel) || 0.05;

  const hypotheses = RESEARCH_HYPOTHESES.map(h => {
    const pair = correlationResult?.pairs?.find(p => p.id === h.id);
    const statObj = method === 'spearman' ? pair?.spearman : pair?.pearson;
    const coef = method === 'spearman' ? statObj?.rho : statObj?.r;
    const pValue = statObj?.pValue ?? null;
    const ci = statObj?.ci || { lower: null, upper: null };
    const n = statObj?.n ?? 0;

    const pearsonR = pair?.pearson?.r ?? null;
    const pearsonP = pair?.pearson?.pValue ?? null;
    const spearmanRho = pair?.spearman?.rho ?? null;
    const spearmanP = pair?.spearman?.pValue ?? null;
    const hasMethodDivergence =
      pearsonP !== null &&
      spearmanP !== null &&
      ((pearsonP < alphaLevel && spearmanP >= alphaLevel) ||
        (pearsonP >= alphaLevel && spearmanP < alphaLevel));

    let decision = 'Insufficient Data';
    let supported = null;
    let explanation =
      'There are not enough valid responses yet (minimum n = 3 with non-zero variance) to test this hypothesis.';

    if (coef !== null && coef !== undefined && pValue !== null) {
      const pFormatted = formatPValue(pValue) === '< .001' ? '< .001' : `= ${formatPValue(pValue)}`;
      if (pValue < alphaLevel && coef > 0) {
        decision = 'Supported';
        supported = true;
        explanation = `A statistically significant positive ${method === 'spearman' ? 'Spearman rank' : 'Pearson'} correlation was observed (${method === 'spearman' ? 'ρ' : 'r'} = ${formatNumber(coef, 3)}, p ${pFormatted}, 95% CI ${formatCI(ci, 2)}, n = ${n}).${
          hasMethodDivergence && method === 'pearson'
            ? ` Note: While the predefined primary parametric test (Pearson's r) is statistically significant, the non-parametric Spearman rank-order correlation did not reach significance (ρ = ${formatNumber(spearmanRho, 3)}, p ${formatPValue(spearmanP) === '< .001' ? '< .001' : `= ${formatPValue(spearmanP)}`}), warranting cautious interpretation.`
            : ''
        } Because this is cross-sectional survey data, correlation indicates association rather than causation.`;
      } else if (pValue < alphaLevel && coef < 0) {
        decision = 'Not supported by the statistical evidence';
        supported = false;
        explanation = `Although statistically significant (p ${pFormatted}), the observed relationship was negative (${formatNumber(coef, 3)}), opposite to the hypothesized positive association.`;
      } else {
        decision = 'Not supported by the statistical evidence';
        supported = false;
        explanation = `The observed correlation (${method === 'spearman' ? 'ρ' : 'r'} = ${formatNumber(coef, 3)}, p ${pFormatted}, n = ${n}) did not reach statistical significance at α = ${alphaLevel}.`;
      }
    }

    return {
      ...h,
      methodUsed: method === 'spearman' ? "Spearman's rho (two-tailed)" : "Pearson's r (two-tailed)",
      coefficient: coef,
      pValue,
      ci,
      n,
      decision,
      supported,
      explanation,
      hasMethodDivergence,
      pearsonR,
      pearsonP,
      spearmanRho,
      spearmanP,
      warning: statObj?.warning || null,
    };
  });

  // Exploratory Analyses (clearly separated and assumption-checked)
  const merged = validRows.map((raw, idx) => ({
    ...raw,
    ...(scoredRows[idx] || {}),
  }));

  // 1. Gender group comparison on WSD_mean (Male vs Female if both have n >= 3)
  const maleWsd = merged.filter(r => r.gender === 'Male').map(r => r.WSD_mean);
  const femaleWsd = merged.filter(r => r.gender === 'Female').map(r => r.WSD_mean);
  const genderComparison = {
    title: 'Exploratory: Willingness to Self-Disclose by Gender (Male vs. Female)',
    tTest: calculateWelchTTest(maleWsd, femaleWsd),
    mannWhitney: calculateMannWhitneyU(maleWsd, femaleWsd),
  };

  // 2. Age group comparison on PCW_mean, PT_mean, WSD_mean (if >= 2 groups with n >= 2)
  const buildGroupMap = (field, outcomeKey) => {
    const map = {};
    for (const r of merged) {
      const key = r[field];
      if (!key) continue;
      if (!map[key]) map[key] = [];
      if (Number.isFinite(r[outcomeKey])) map[key].push(r[outcomeKey]);
    }
    return map;
  };

  const ageGroupWsdMap = buildGroupMap('age_group', 'WSD_mean');
  const ageGroupComparison = {
    title: 'Exploratory: Willingness to Self-Disclose Across Age Groups',
    anova: calculateOneWayAnova(ageGroupWsdMap),
    kruskalWallis: calculateKruskalWallis(ageGroupWsdMap),
  };

  const freqWsdMap = buildGroupMap('ai_frequency', 'WSD_mean');
  const frequencyComparison = {
    title: 'Exploratory: Willingness to Self-Disclose by AI Usage Frequency',
    anova: calculateOneWayAnova(freqWsdMap),
    kruskalWallis: calculateKruskalWallis(freqWsdMap),
  };

  // 3. Exploratory simple linear regressions matching H1-H3
  const regressions = [
    {
      title: 'Exploratory Regression: PCW predicting Perceived Trust (PT)',
      ...calculateLinearRegression(
        merged.map(r => r.PCW_mean),
        merged.map(r => r.PT_mean)
      ),
    },
    {
      title: 'Exploratory Regression: Perceived Trust (PT) predicting Self-Disclosure (WSD)',
      ...calculateLinearRegression(
        merged.map(r => r.PT_mean),
        merged.map(r => r.WSD_mean)
      ),
    },
  ];

  return {
    methodUsed: method,
    alphaLevel,
    hypotheses,
    exploratory: {
      disclaimer:
        'Exploratory analyses below were not pre-specified confirmatory hypotheses. They are shown only where group sample sizes permit, and should be interpreted cautiously.',
      genderComparison,
      ageGroupComparison,
      frequencyComparison,
      regressions,
    },
  };
}
