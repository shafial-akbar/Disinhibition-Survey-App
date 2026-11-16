import * as XLSX from 'xlsx';
import { QUESTIONNAIRE_CONFIG } from '../../config/questionnaireConfig.js';
import { SAFE_RESPONSE_COLUMNS } from '../supabase/responseService.js';
import { formatNumber, formatPValue, formatCI } from '../../utils/formatters/numberFormatter.js';

/**
 * Generates a multi-sheet Academic Excel (.xlsx) workbook with cleaned data,
 * calculated construct scores, descriptive statistics, reliability, normality,
 * correlation tables, hypothesis decisions, and reproducibility metadata.
 */
export function exportAnalysisWorkbookExcel({
  cleaning,
  scoring,
  descriptive,
  reliability,
  normality,
  correlation,
  hypothesesResult,
  snapshotMeta,
  settings,
  filename = 'research_statistical_analysis_workbook.xlsx',
}) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Study & Reproducibility Metadata
  const metaRows = [
    { Field: 'Study Title', Value: QUESTIONNAIRE_CONFIG.studyTitle },
    { Field: 'Institution', Value: QUESTIONNAIRE_CONFIG.institution },
    { Field: 'Questionnaire Version', Value: QUESTIONNAIRE_CONFIG.version },
    { Field: 'Analyzed At', Value: snapshotMeta?.analyzedAt || new Date().toISOString() },
    { Field: 'Total Retrieved Rows', Value: cleaning?.totalSubmitted ?? 0 },
    { Field: 'Valid Included Sample (n)', Value: cleaning?.validCount ?? 0 },
    { Field: 'Excluded Rows', Value: cleaning?.excludedCount ?? 0 },
    { Field: 'Subgroup Filter Active', Value: snapshotMeta?.isFiltered ? 'Yes' : 'No' },
    { Field: 'Missing Data Rule', Value: settings?.missingDataRule || 'complete_construct' },
    { Field: 'Correlation Deletion', Value: settings?.correlationDeletion || 'pairwise' },
    { Field: 'Primary Hypothesis Test', Value: settings?.primaryHypothesisMethod || 'pearson' },
    { Field: 'Alpha Level', Value: settings?.alphaLevel ?? 0.05 },
    { Field: 'Privacy Notice', Value: 'withdrawal_code_hash strictly omitted' },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(metaRows), 'Metadata');

  // Sheet 2: Cleaned Dataset + Calculated Scores
  const validRows = cleaning?.validRows || [];
  const scoredRows = scoring?.scoredRows || [];
  const scoredById = new Map(scoredRows.map(s => [s.id, s]));

  const cleanDatasetRows = validRows.map((row, idx) => {
    const sc = scoredById.get(row.id) || scoredRows[idx] || {};
    const out = {};
    for (const col of SAFE_RESPONSE_COLUMNS) {
      const val = row?.[col];
      out[col] = Array.isArray(val) ? val.join('; ') : val ?? '';
    }
    out.calc_PCW_total = sc.PCW_total ?? '';
    out.calc_PCW_mean = sc.PCW_mean !== null && sc.PCW_mean !== undefined ? Number(sc.PCW_mean.toFixed(4)) : '';
    out.calc_PT_total = sc.PT_total ?? '';
    out.calc_PT_mean = sc.PT_mean !== null && sc.PT_mean !== undefined ? Number(sc.PT_mean.toFixed(4)) : '';
    out.calc_WSD_total = sc.WSD_total ?? '';
    out.calc_WSD_mean = sc.WSD_mean !== null && sc.WSD_mean !== undefined ? Number(sc.WSD_mean.toFixed(4)) : '';
    return out;
  });
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(cleanDatasetRows.length ? cleanDatasetRows : [{ Note: 'No valid data available yet.' }]),
    'Cleaned_Dataset'
  );

  // Sheet 3: Construct Scores Only
  const scoreSheetRows = scoredRows.map(r => ({
    Participant_ID: r.id,
    Submitted_At: r.submitted_at,
    Age_Group: r.age_group,
    Primary_AI_Tool: r.primary_ai_tool,
    PCW_Total_4to20: r.PCW_total ?? '',
    PCW_Mean_1to5: r.PCW_mean !== null && r.PCW_mean !== undefined ? Number(r.PCW_mean.toFixed(4)) : '',
    PT_Total_6to30: r.PT_total ?? '',
    PT_Mean_1to5: r.PT_mean !== null && r.PT_mean !== undefined ? Number(r.PT_mean.toFixed(4)) : '',
    WSD_Total_8to40: r.WSD_total ?? '',
    WSD_Mean_1to5: r.WSD_mean !== null && r.WSD_mean !== undefined ? Number(r.WSD_mean.toFixed(4)) : '',
  }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(scoreSheetRows.length ? scoreSheetRows : [{ Note: 'No valid data available yet.' }]),
    'Construct_Scores'
  );

  // Sheet 4: Descriptive Statistics (Composites + Items)
  const descRows = [
    ...(descriptive?.compositeSummaries || []).map(c => ({
      Level: 'Construct Mean',
      Variable: c.meanSummary.label,
      N: c.meanSummary.validN,
      Missing: c.meanSummary.missingN,
      Mean: formatNumber(c.meanSummary.mean, 3),
      SD: formatNumber(c.meanSummary.sd, 3),
      Median: formatNumber(c.meanSummary.median, 3),
      Min: formatNumber(c.meanSummary.min, 2),
      Max: formatNumber(c.meanSummary.max, 2),
      Skewness: formatNumber(c.meanSummary.skewness, 3),
      Kurtosis: formatNumber(c.meanSummary.kurtosis, 3),
    })),
    ...(descriptive?.itemSummaries || []).map(it => ({
      Level: it.constructCode,
      Variable: `${it.label}: ${it.statement}`,
      N: it.validN,
      Missing: it.missingN,
      Mean: formatNumber(it.mean, 3),
      SD: formatNumber(it.sd, 3),
      Median: formatNumber(it.median, 2),
      Min: formatNumber(it.min, 0),
      Max: formatNumber(it.max, 0),
      Skewness: formatNumber(it.skewness, 3),
      Kurtosis: formatNumber(it.kurtosis, 3),
    })),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(descRows), 'Descriptive_Stats');

  // Sheet 5: Reliability (Cronbach's Alpha)
  const relRows = (reliability?.scales || []).map(s => ({
    Construct: s.name,
    Code: s.code,
    Items_k: s.itemCount,
    Complete_N: s.validN,
    Cronbach_Alpha: formatNumber(s.alpha, 3),
    Interpretation: s.interpretation?.label || s.warning || 'N/A',
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(relRows), 'Reliability');

  // Sheet 6: Normality Tests
  const normRows = (normality?.scales || []).map(s => ({
    Construct: s.name,
    Code: s.code,
    N: s.n,
    Shapiro_Wilk_W: formatNumber(s.wStatistic, 3),
    p_value: formatPValue(s.pValue),
    Skewness: formatNumber(s.skewness, 3),
    Kurtosis: formatNumber(s.kurtosis, 3),
    Status: s.interpretation,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(normRows), 'Normality');

  // Sheet 7: Correlations & Hypotheses
  const corrRows = (correlation?.pairs || []).map(p => ({
    Hypothesis: p.id,
    Pair: p.label,
    N: p.n,
    Pearson_r: formatNumber(p.pearson?.r, 3),
    Pearson_p: formatPValue(p.pearson?.pValue),
    Pearson_95CI: formatCI(p.pearson?.ci, 2),
    Spearman_rho: formatNumber(p.spearman?.rho, 3),
    Spearman_p: formatPValue(p.spearman?.pValue),
    Regression_Slope: p.regression?.applicable ? formatNumber(p.regression.slope, 3) : '—',
    Regression_R2: p.regression?.applicable ? formatNumber(p.regression.rSquared, 3) : '—',
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(corrRows), 'Correlations');

  const hypRows = (hypothesesResult?.hypotheses || []).map(h => ({
    Hypothesis: h.id,
    Statement: h.statement,
    Method: h.methodUsed,
    N: h.n,
    Coefficient: formatNumber(h.coefficient, 3),
    p_value: formatPValue(h.pValue),
    CI_95: formatCI(h.ci, 2),
    Decision: h.decision,
    Interpretation: h.explanation,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hypRows), 'Hypothesis_Decisions');

  XLSX.writeFile(wb, filename);
}
