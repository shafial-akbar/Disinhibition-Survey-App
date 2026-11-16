import { CONSTRUCT_LIST, QUESTIONNAIRE_CONFIG } from '../../config/questionnaireConfig.js';

/**
 * Scoring Engine
 * Calculates construct totals and means dynamically from individual raw items
 * configured in questionnaireConfig.js without modifying the original raw data.
 */
export function scoreParticipantResponse(row, settings = {}) {
  const missingRule = settings.missingDataRule || 'complete_construct';
  const result = {};

  for (const construct of CONSTRUCT_LIST) {
    const validItemScores = [];
    const itemDetails = {};

    for (const key of construct.items) {
      const raw = row?.[key];
      const num = raw === null || raw === undefined || raw === '' ? NaN : Number(raw);
      if (Number.isInteger(num) && num >= construct.minItemScore && num <= construct.maxItemScore) {
        const isReverse = construct.reverseItems.includes(key);
        const scored = isReverse ? 6 - num : num;
        validItemScores.push(scored);
        itemDetails[key] = { raw: num, scored, isReverse };
      } else {
        itemDetails[key] = { raw: null, scored: null, isReverse: construct.reverseItems.includes(key) };
      }
    }

    const answeredCount = validItemScores.length;
    const requiredCount =
      missingRule === 'allow_partial_80'
        ? Math.ceil(construct.itemCount * 0.8)
        : construct.itemCount;

    let total = null;
    let mean = null;

    if (answeredCount >= requiredCount && answeredCount > 0) {
      const sumValid = validItemScores.reduce((acc, v) => acc + v, 0);
      mean = sumValid / answeredCount;
      // Pro-rate total if partial responses are explicitly allowed; exact sum when complete
      total = answeredCount === construct.itemCount ? sumValid : mean * construct.itemCount;
    }

    result[construct.code] = {
      answeredCount,
      expectedCount: construct.itemCount,
      missingCount: construct.itemCount - answeredCount,
      total,
      mean,
      itemDetails,
    };
  }

  return result;
}

/**
 * Scores an entire dataset of participant rows and returns both row-level
 * calculated scores and construct-level score summaries.
 */
export function runScoringAnalysis(rows = [], settings = {}) {
  const scoredRows = rows.map(row => {
    const scores = scoreParticipantResponse(row, settings);
    return {
      id: row.id,
      submitted_at: row.submitted_at,
      age_group: row.age_group,
      primary_ai_tool: row.primary_ai_tool,
      scores,
      PCW_total: scores.PCW.total,
      PCW_mean: scores.PCW.mean,
      PT_total: scores.PT.total,
      PT_mean: scores.PT.mean,
      WSD_total: scores.WSD.total,
      WSD_mean: scores.WSD.mean,
    };
  });

  const constructSummaries = CONSTRUCT_LIST.map(construct => {
    const totals = scoredRows
      .map(r => r[`${construct.code}_total`])
      .filter(v => v !== null && Number.isFinite(v));
    const means = scoredRows
      .map(r => r[`${construct.code}_mean`])
      .filter(v => v !== null && Number.isFinite(v));

    return {
      code: construct.code,
      name: construct.name,
      nameBn: construct.nameBn,
      itemCount: construct.itemCount,
      reverseItems: construct.reverseItems,
      formulaTotal: `Sum of ${construct.items.join(' + ')}`,
      formulaMean: `(${construct.code} Total) / ${construct.itemCount}`,
      possibleTotalMin: construct.minPossibleTotal,
      possibleTotalMax: construct.maxPossibleTotal,
      possibleMeanMin: construct.minItemScore,
      possibleMeanMax: construct.maxItemScore,
      actualTotalMin: totals.length ? Math.min(...totals) : null,
      actualTotalMax: totals.length ? Math.max(...totals) : null,
      actualMeanMin: means.length ? Math.min(...means) : null,
      actualMeanMax: means.length ? Math.max(...means) : null,
      validN: means.length,
      missingN: scoredRows.length - means.length,
    };
  });

  return {
    scoredRows,
    constructSummaries,
    scoringRules: QUESTIONNAIRE_CONFIG.scoringRules,
  };
}
