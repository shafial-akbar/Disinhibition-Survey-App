import { CONSTRUCT_LIST, QUESTIONNAIRE_CONFIG } from '../../config/questionnaireConfig.js';
import { runScoringAnalysis } from '../analysis/scoringService.js';
import {
  computeNumericSummary,
  computeFrequencyTable,
  computeMultiSelectFrequencyTable,
  buildHistogramBins,
} from '../analysis/descriptiveService.js';
import { runReliabilityAnalysis } from '../analysis/reliabilityService.js';
import { runNormalityAnalysis } from '../analysis/normalityService.js';
import { runCorrelationAnalysis } from '../analysis/correlationService.js';
import { runHypothesisAndExploratoryAnalysis } from '../analysis/hypothesisService.js';

/**
 * Chapter 4 Statistical Analysis Service
 * Computes all statistical outputs required for Sections 4.1 through 4.8
 * strictly from actual eligible participant responses.
 */

/**
 * Runs the complete statistical pipeline for the 8-section APA 7 Chapter 4 report.
 *
 * @param {Object} preparedData - Output from prepareChapter4Dataset()
 * @param {Object} settings - Statistical settings (missing rule, deletion mode, alpha)
 * @param {string} analyzedAt - ISO timestamp of the analysis run
 * @returns {Object} Complete structured statistics for Sections 4.1 to 4.8
 */
export function computeChapter4Statistics(preparedData, settings = {}, analyzedAt = null) {
  const validRows = preparedData?.validRows || [];
  const validN = validRows.length;

  // 1. Construct Scoring (PCW 4 items, PT 6 items, WSD 8 items)
  const scoring = runScoringAnalysis(validRows, settings);
  const scoredRows = scoring.scoredRows || [];

  // 2. Section 4.2 Demographic Distributions
  const demographics = {
    age_group: computeFrequencyTable(validRows, 'age_group', QUESTIONNAIRE_CONFIG.allowedAgeGroups),
    gender: computeFrequencyTable(validRows, 'gender', QUESTIONNAIRE_CONFIG.allowedGenders),
    education: computeFrequencyTable(validRows, 'education', QUESTIONNAIRE_CONFIG.allowedEducations),
    occupation: computeFrequencyTable(validRows, 'occupation', QUESTIONNAIRE_CONFIG.allowedOccupations),
  };

  // 3. Section 4.3 Conversational AI Usage Distributions
  // Note: Multi-select tables use validN (valid participant count) as the denominator for percentOfRespondents
  const aiUsage = {
    primary_ai_tool: computeFrequencyTable(validRows, 'primary_ai_tool'),
    ai_frequency: computeFrequencyTable(validRows, 'ai_frequency', QUESTIONNAIRE_CONFIG.allowedFrequencies),
    ai_duration: computeFrequencyTable(validRows, 'ai_duration', QUESTIONNAIRE_CONFIG.allowedDurations),
    ai_familiarity: computeFrequencyTable(validRows, 'ai_familiarity', QUESTIONNAIRE_CONFIG.allowedFamiliarities),
    ai_tools: computeMultiSelectFrequencyTable(validRows, 'ai_tools'),
    ai_purpose: computeMultiSelectFrequencyTable(validRows, 'ai_purpose'),
  };

  // 4. Section 4.4 Descriptive Statistics of Study Variables (PCW, PT, WSD)
  const studyVariables = CONSTRUCT_LIST.map(construct => {
    const meanVals = scoredRows.map(r => r[`${construct.code}_mean`]);
    const totalVals = scoredRows.map(r => r[`${construct.code}_total`]);

    return {
      code: construct.code,
      name: construct.name,
      itemCount: construct.itemCount,
      meanStats: computeNumericSummary(meanVals, `${construct.name} (${construct.code})`, {
        code: construct.code,
        scaleRange: '1.00–5.00',
      }),
      totalStats: computeNumericSummary(totalVals, `${construct.name} Total (${construct.code})`, {
        code: construct.code,
        scaleRange: `${construct.minPossibleTotal}–${construct.maxPossibleTotal}`,
      }),
      histogram: buildHistogramBins(meanVals, 1, 5, 8),
    };
  });

  // 5. Section 4.5 Reliability (Cronbach's Alpha on raw items) & Normality (Shapiro-Wilk, Q-Q, Histograms)
  const reliability = runReliabilityAnalysis(validRows);
  const normality = runNormalityAnalysis(scoredRows);

  // 6. Section 4.6 Correlation Analysis (Pearson r, 95% CI, Spearman rho, Matrices, Heatmap, 3 Scatterplots)
  const correlation = runCorrelationAnalysis(scoredRows, settings);

  // 7. Section 4.7 Hypothesis Testing (H1, H2, H3 evaluated using Pearson r, alpha = .05, two-tailed)
  const hypothesisSettings = {
    ...settings,
    primaryHypothesisMethod: 'pearson',
    alphaLevel: 0.05,
  };
  const hypothesisTesting = runHypothesisAndExploratoryAnalysis(
    scoredRows,
    validRows,
    correlation,
    hypothesisSettings
  );

  return {
    analyzedAt: analyzedAt || new Date().toISOString(),
    hasData: validN > 0,
    screening: {
      retrievedN: preparedData?.retrievedN ?? 0,
      validN,
      excludedN: preparedData?.excludedN ?? 0,
      lockedN: preparedData?.lockedN ?? 0,
      pendingN: preparedData?.pendingN ?? 0,
      questionnaireVersion: preparedData?.questionnaireVersion || QUESTIONNAIRE_CONFIG.version,
      issues: preparedData?.cleaning?.issues || [],
    },
    demographics,
    aiUsage,
    studyVariables,
    scoring,
    reliability,
    normality,
    correlation,
    hypothesisTesting,
  };
}
