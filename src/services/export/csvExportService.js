import { QUESTIONNAIRE_CONFIG } from '../../config/questionnaireConfig.js';
import { SAFE_RESPONSE_COLUMNS } from '../supabase/responseService.js';

function escapeCsvCell(value) {
  if (value === null || value === undefined) return '';
  const str = Array.isArray(value)
    ? value.join('; ')
    : typeof value === 'object'
    ? JSON.stringify(value)
    : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function triggerTextDownload(content, filename, mimeType = 'text/csv;charset=utf-8;') {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const bom = mimeType.includes('csv') ? '\uFEFF' : '';
  const blob = new Blob([bom + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports sanitized raw rows (no withdrawal_code_hash ever included).
 */
export function buildRawCsvContent(rows = []) {
  const columns = [...SAFE_RESPONSE_COLUMNS];
  const header = columns.join(',');
  const lines = rows.map(row => columns.map(col => escapeCsvCell(row?.[col])).join(','));
  return [header, ...lines].join('\n');
}

export function exportRawDataCsv(rows = [], filename = 'survey_raw_data_sanitized.csv') {
  const csv = buildRawCsvContent(rows);
  triggerTextDownload(csv, filename, 'text/csv;charset=utf-8;');
  return csv;
}

/**
 * Exports cleaned valid dataset with raw 18 items + calculated PCW/PT/WSD totals & means + lock status.
 */
export function buildCleanedCsvContent(validRows = [], scoredRows = []) {
  const scoredById = new Map(scoredRows.map(s => [s.id, s]));
  const columns = [
    ...SAFE_RESPONSE_COLUMNS,
    'calc_PCW_total',
    'calc_PCW_mean',
    'calc_PT_total',
    'calc_PT_mean',
    'calc_WSD_total',
    'calc_WSD_mean',
    'analysis_included',
  ];

  const header = columns.join(',');
  const lines = validRows.map((row, idx) => {
    const scored = scoredById.get(row.id) || scoredRows[idx] || {};
    const merged = {
      ...row,
      calc_PCW_total: scored.PCW_total ?? '',
      calc_PCW_mean: scored.PCW_mean !== null && scored.PCW_mean !== undefined ? Number(scored.PCW_mean).toFixed(4) : '',
      calc_PT_total: scored.PT_total ?? '',
      calc_PT_mean: scored.PT_mean !== null && scored.PT_mean !== undefined ? Number(scored.PT_mean).toFixed(4) : '',
      calc_WSD_total: scored.WSD_total ?? '',
      calc_WSD_mean: scored.WSD_mean !== null && scored.WSD_mean !== undefined ? Number(scored.WSD_mean).toFixed(4) : '',
      analysis_included: row?._audit?.includedInAnalysis !== false ? 'true' : 'false',
    };
    return columns.map(col => escapeCsvCell(merged[col])).join(',');
  });

  return [header, ...lines].join('\n');
}

export function exportCleanedDataCsv(validRows = [], scoredRows = [], filename = 'survey_cleaned_scored_data.csv') {
  const csv = buildCleanedCsvContent(validRows, scoredRows);
  triggerTextDownload(csv, filename, 'text/csv;charset=utf-8;');
  return csv;
}

/**
 * Exports full analysis reproducibility metadata & methodology documentation.
 */
export function buildAnalysisMetadataText(snapshotMeta = {}, cleaning = {}, settings = {}) {
  const lines = [
    '====================================================================',
    'RESEARCH DATA ANALYSIS DOCUMENTATION & REPRODUCIBILITY LOG',
    '====================================================================',
    `Study Title: ${QUESTIONNAIRE_CONFIG.studyTitle}`,
    `Institution: ${QUESTIONNAIRE_CONFIG.institution}`,
    `Questionnaire Version: ${QUESTIONNAIRE_CONFIG.version}`,
    `Total Active Items: ${QUESTIONNAIRE_CONFIG.totalItemCount} (PCW: 4, PT: 6, WSD: 8)`,
    `Likert Scale Range: ${QUESTIONNAIRE_CONFIG.likertMin} to ${QUESTIONNAIRE_CONFIG.likertMax}`,
    '',
    '--- ANALYSIS SNAPSHOT ---',
    `Analyzed At (UTC): ${snapshotMeta.analyzedAt || new Date().toISOString()}`,
    `Total Submitted Rows Retrieved: ${cleaning.totalSubmitted ?? 0}`,
    `Valid Included Rows (n): ${cleaning.validCount ?? 0}`,
    `Excluded Rows: ${cleaning.excludedCount ?? 0}`,
    `Locked Post-Withdrawal Rows: ${cleaning.lockedCount ?? 0}`,
    `Pending 3-Day Window Rows: ${cleaning.pendingWithdrawalCount ?? 0}`,
    `Filtered View Active: ${snapshotMeta.isFiltered ? 'Yes (Subgroup Filter Applied)' : 'No (Full Sample)'}`,
    '',
    '--- STATISTICAL SETTINGS ---',
    `Missing Data Rule: ${settings.missingDataRule || 'complete_construct'}`,
    `Correlation Deletion: ${settings.correlationDeletion || 'pairwise'}`,
    `Primary Hypothesis Method: ${settings.primaryHypothesisMethod || 'pearson'}`,
    `Alpha Significance Level: ${settings.alphaLevel || 0.05}`,
    `Include Only Current Version (${QUESTIONNAIRE_CONFIG.version}): ${settings.includeOnlyCurrentVersion !== false ? 'Yes' : 'No'}`,
    '',
    '--- PRIVACY & DATA INTEGRITY NOTICE ---',
    '1. Raw database records in public.survey_responses are never altered or overwritten.',
    '2. Sensitive field withdrawal_code_hash is strictly stripped from all queries and exports.',
    '3. Sample variance & standard deviation use (n - 1) denominator.',
    '4. P-values below 0.001 are formatted as "< .001" per APA guidelines.',
    '====================================================================',
  ];
  return lines.join('\n');
}

export function exportAnalysisMetadataDoc(snapshotMeta, cleaning, settings, filename = 'analysis_metadata_documentation.txt') {
  const txt = buildAnalysisMetadataText(snapshotMeta, cleaning, settings);
  triggerTextDownload(txt, filename, 'text/plain;charset=utf-8;');
  return txt;
}
