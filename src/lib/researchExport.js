import {
  WARMTH_KEYS,
  TRUST_KEYS,
  DISCLOSURE_KEYS,
  ALL_LIKERT_KEYS,
  OBSOLETE_LIKERT_KEYS,
  QUESTIONNAIRE_VERSION,
  LEGACY_QUESTIONNAIRE_VERSION,
} from './withdrawal.js';

export const ACTIVE_16_ITEM_COLUMNS = ALL_LIKERT_KEYS;
export const LEGACY_26_ITEM_EXTRA_COLUMNS = OBSOLETE_LIKERT_KEYS;

export const RESEARCH_EXPORT_COLUMNS_V1 = [
  'id',
  'questionnaire_version',
  'submitted_at',
  'age_group',
  'gender',
  'education',
  'occupation',
  'primary_ai_tool',
  'ai_tools',
  'ai_frequency',
  'ai_duration',
  'ai_purpose',
  'ai_familiarity',
  ...WARMTH_KEYS,
  ...TRUST_KEYS,
  ...DISCLOSURE_KEYS,
  'warmth_total',
  'warmth_mean',
  'trust_total',
  'trust_mean',
  'disclosure_total',
  'disclosure_mean',
  'withdrawal_deadline',
  'locked_for_analysis',
];

/**
 * Determines the questionnaire version of a database row.
 * Preserves historical 'v0_26_items' records so they are never mixed with 'v1_16_items'
 * in statistical analyses.
 */
export function classifyResponseVersion(record) {
  if (!record || typeof record !== 'object') return QUESTIONNAIRE_VERSION;
  if (record.questionnaire_version) {
    return record.questionnaire_version;
  }
  const hasObsoleteValue = OBSOLETE_LIKERT_KEYS.some(
    key => record[key] !== undefined && record[key] !== null
  );
  return hasObsoleteValue ? LEGACY_QUESTIONNAIRE_VERSION : QUESTIONNAIRE_VERSION;
}

/**
 * Filters records by questionnaire version (defaults to 'v1_16_items') so legacy 26-item
 * records and final 16-item records are never accidentally mixed in the same analysis dataset.
 */
export function filterResponsesByVersion(records, targetVersion = QUESTIONNAIRE_VERSION) {
  if (!Array.isArray(records)) return [];
  return records
    .map(row => ({
      ...row,
      questionnaire_version: classifyResponseVersion(row),
    }))
    .filter(row => row.questionnaire_version === targetVersion);
}

function escapeCsvCell(value) {
  if (value === null || value === undefined) return '';
  const serialized = Array.isArray(value)
    ? value.join('; ')
    : typeof value === 'object'
    ? JSON.stringify(value)
    : String(value);

  if (/[",\n\r]/.test(serialized)) {
    return `"${serialized.replace(/"/g, '""')}"`;
  }
  return serialized;
}

/**
 * Exports survey records to CSV/Excel-compatible format.
 * By default exports only 'v1_16_items' records with the 16 active items, `primary_ai_tool`,
 * `questionnaire_version`, demographic/usage fields, and the 6 composite score columns.
 */
export function formatResponsesToCsv(
  records,
  { version = QUESTIONNAIRE_VERSION, includeLegacyColumns = false } = {}
) {
  const filtered = version ? filterResponsesByVersion(records, version) : records || [];
  const columns = includeLegacyColumns
    ? [...RESEARCH_EXPORT_COLUMNS_V1, ...LEGACY_26_ITEM_EXTRA_COLUMNS]
    : RESEARCH_EXPORT_COLUMNS_V1;

  const headerLine = columns.join(',');
  const dataLines = filtered.map(row => {
    const normalizedRow = {
      ...row,
      questionnaire_version: classifyResponseVersion(row),
    };
    return columns.map(col => escapeCsvCell(normalizedRow[col])).join(',');
  });

  return [headerLine, ...dataLines].join('\n');
}
