import { QUESTIONNAIRE_CONFIG, CONSTRUCT_LIST } from '../../config/questionnaireConfig.js';
import { runDataCleaningAudit } from '../analysis/dataCleaningService.js';

/**
 * Chapter 4 Data Service
 * Validates schema mapping and prepares screened participant responses for Chapter 4.
 * Never modifies or deletes raw database records.
 */

/**
 * Verifies that retrieved database rows contain the expected 18 questionnaire item columns
 * (cw_1..cw_4, pt_1..pt_6, sd_1..sd_8) and required demographic/AI usage columns.
 *
 * @param {Array<Object>} rawRows - Raw participant rows from public.survey_responses
 * @returns {Object} Validation status and any missing column warnings
 */
export function verifyDatabaseSchemaMapping(rawRows = []) {
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    return {
      isValid: true,
      missingColumns: [],
      warning: null,
    };
  }

  const sampleRow = rawRows[0] || {};
  const requiredColumns = [
    ...QUESTIONNAIRE_CONFIG.allItemKeys,
    'age_group',
    'education',
    'ai_tools',
    'ai_frequency',
    'ai_duration',
    'ai_purpose',
    'ai_familiarity',
  ];

  const missingColumns = requiredColumns.filter(col => !(col in sampleRow));

  return {
    isValid: missingColumns.length === 0,
    missingColumns,
    warning:
      missingColumns.length > 0
        ? `Database schema mismatch detected: missing expected column(s): ${missingColumns.join(', ')}. Please verify public.survey_responses schema.`
        : null,
  };
}

/**
 * Prepares the Chapter 4 dataset by running the non-destructive data screening audit
 * and returning screening counts, valid analytical records, and study metadata.
 *
 * @param {Array<Object>} rawRows - Retrieved rows from Supabase
 * @param {Object} exclusionsMap - Local researcher exclusion flags
 * @param {Object} analysisSettings - Active statistical analysis settings
 * @returns {Object} Structured screening dataset for Chapter 4
 */
export function prepareChapter4Dataset(rawRows = [], exclusionsMap = {}, analysisSettings = {}) {
  const schemaCheck = verifyDatabaseSchemaMapping(rawRows);
  const cleaning = runDataCleaningAudit(rawRows, exclusionsMap, analysisSettings);

  return {
    studyTitle: QUESTIONNAIRE_CONFIG.studyTitle,
    institution: QUESTIONNAIRE_CONFIG.institution,
    questionnaireVersion: QUESTIONNAIRE_CONFIG.version,
    totalItemCount: QUESTIONNAIRE_CONFIG.totalItemCount,
    constructs: CONSTRUCT_LIST,
    schemaCheck,
    cleaning,
    retrievedN: cleaning.totalSubmitted,
    validN: cleaning.validCount,
    excludedN: cleaning.excludedCount,
    lockedN: cleaning.lockedCount,
    pendingN: cleaning.pendingWithdrawalCount,
    validRows: cleaning.validRows,
    excludedRows: cleaning.excludedRows,
  };
}
