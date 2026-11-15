import {
  WARMTH_KEYS,
  TRUST_KEYS,
  DISCLOSURE_KEYS,
  ALL_LIKERT_KEYS,
  OBSOLETE_LIKERT_KEYS,
  QUESTIONNAIRE_VERSION,
  LEGACY_QUESTIONNAIRE_VERSION,
  calculateSurveyScores,
  prepareSurveySubmissionPayload,
  submitSurveyWithWithdrawalCode,
  saveSessionSubmissionReceipt,
  loadSessionSubmissionReceipt,
  clearSessionSubmissionReceipt,
} from './withdrawal.js';

import {
  ACTIVE_16_ITEM_COLUMNS,
  LEGACY_26_ITEM_EXTRA_COLUMNS,
  RESEARCH_EXPORT_COLUMNS_V1,
  classifyResponseVersion,
  filterResponsesByVersion,
  formatResponsesToCsv,
} from './researchExport.js';

export {
  WARMTH_KEYS,
  TRUST_KEYS,
  DISCLOSURE_KEYS,
  ALL_LIKERT_KEYS,
  OBSOLETE_LIKERT_KEYS,
  QUESTIONNAIRE_VERSION,
  LEGACY_QUESTIONNAIRE_VERSION,
  ACTIVE_16_ITEM_COLUMNS,
  LEGACY_26_ITEM_EXTRA_COLUMNS,
  RESEARCH_EXPORT_COLUMNS_V1,
  classifyResponseVersion,
  filterResponsesByVersion,
  formatResponsesToCsv,
  calculateSurveyScores,
  prepareSurveySubmissionPayload,
  submitSurveyWithWithdrawalCode,
  saveSessionSubmissionReceipt,
  loadSessionSubmissionReceipt,
  clearSessionSubmissionReceipt,
};

/**
 * Validates all required demographic fields, `primary_ai_tool`, and all 16 raw Likert
 * responses (1..5), automatically calculates the 6 composite scores (`warmth_total`,
 * `warmth_mean`, `trust_total`, `trust_mean`, `disclosure_total`, `disclosure_mean`),
 * and submits the complete 16-item record (`questionnaire_version = 'v1_16_items'`)
 * to `public.survey_responses`.
 */
export async function submitSurveyResponse(supabaseClient, payload) {
  return submitSurveyWithWithdrawalCode(supabaseClient, payload);
}


