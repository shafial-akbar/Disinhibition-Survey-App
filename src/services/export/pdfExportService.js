import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QUESTIONNAIRE_CONFIG } from '../../config/questionnaireConfig.js';
import { formatNumber, formatPValue, formatCI } from '../../utils/formatters/numberFormatter.js';

function sanitizePdfText(text) {
  return String(text || '')
    .replace(/α/g, 'alpha')
    .replace(/ρ/g, 'rho')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/→/g, '->')
    .replace(/↔/g, '<->')
    .replace(/—/g, '-');
}

/**
 * Exports a clean academic Chapter 4 + Statistical Tables PDF report using jsPDF & autoTable.
 */
export function exportChapter4PdfReport({
  cleaning,
  descriptive,
  reliability,
  normality,
  correlation,
  hypothesesResult,
  chapter4,
  snapshotMeta,
  filename = 'chapter_4_results_statistical_report.pdf',
}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 48;

  // Title Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const titleLines = doc.splitTextToSize(sanitizePdfText(QUESTIONNAIRE_CONFIG.studyTitle), pageWidth - 84);
  doc.text(titleLines, 42, y);
  y += titleLines.length * 18 + 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(70, 82, 102);
  doc.text(
    sanitizePdfText(
      `Chapter 4 Statistical Report · ${QUESTIONNAIRE_CONFIG.institution} · Version: ${QUESTIONNAIRE_CONFIG.version}`
    ),
    42,
    y
  );
  y += 14;
  doc.text(
    sanitizePdfText(
      `Analyzed: ${snapshotMeta?.analyzedAt || new Date().toISOString()} · Total Retrieved: ${cleaning?.totalSubmitted ?? 0} · Valid n: ${cleaning?.validCount ?? 0} · Excluded: ${cleaning?.excludedCount ?? 0}`
    ),
    42,
    y
  );
  y += 20;
  doc.setTextColor(15, 26, 44);

  // Table 1: Descriptive Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text('Table 4.1: Descriptive Statistics of Composite Mean Scores (1-5 Scale)', 42, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [['Construct', 'N', 'Mean', 'SD', 'Median', 'Min', 'Max', 'Skewness', 'Kurtosis']],
    body: (descriptive?.compositeSummaries || []).map(c => [
      sanitizePdfText(`${c.name} (${c.code})`),
      c.meanSummary.validN,
      formatNumber(c.meanSummary.mean, 2),
      formatNumber(c.meanSummary.sd, 2),
      formatNumber(c.meanSummary.median, 2),
      formatNumber(c.meanSummary.min, 2),
      formatNumber(c.meanSummary.max, 2),
      formatNumber(c.meanSummary.skewness, 2),
      formatNumber(c.meanSummary.kurtosis, 2),
    ]),
    styles: { fontSize: 8.5, cellPadding: 5 },
    headStyles: { fillColor: [43, 82, 176] },
    margin: { left: 42, right: 42 },
  });
  y = doc.lastAutoTable.finalY + 22;

  // Table 2: Reliability & Normality
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text("Table 4.2: Internal Consistency Reliability (Cronbach's Alpha) and Normality", 42, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [['Construct', 'Items', 'Valid n', 'Alpha', 'W Stat', 'SW p-value', 'Reliability Note']],
    body: (reliability?.scales || []).map((rel, idx) => {
      const norm = normality?.scales?.[idx] || {};
      return [
        sanitizePdfText(`${rel.name} (${rel.code})`),
        rel.itemCount,
        rel.validN,
        formatNumber(rel.alpha, 3),
        formatNumber(norm.wStatistic, 3),
        formatPValue(norm.pValue),
        sanitizePdfText(rel.interpretation?.label || rel.warning || 'N/A'),
      ];
    }),
    styles: { fontSize: 8.5, cellPadding: 5 },
    headStyles: { fillColor: [43, 82, 176] },
    margin: { left: 42, right: 42 },
  });
  y = doc.lastAutoTable.finalY + 22;

  // Table 3: Correlations & Hypotheses
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text('Table 4.3: Correlation & Hypothesis Testing Results (H1-H3)', 42, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [['ID', 'Relationship', 'n', 'Pearson r (p)', 'Spearman rho (p)', 'Decision']],
    body: (hypothesesResult?.hypotheses || []).map(h => {
      const pair = correlation?.pairs?.find(p => p.id === h.id);
      return [
        h.id,
        sanitizePdfText(h.title),
        h.n,
        sanitizePdfText(`${formatNumber(pair?.pearson?.r, 3)} (${formatPValue(pair?.pearson?.pValue)})`),
        sanitizePdfText(`${formatNumber(pair?.spearman?.rho, 3)} (${formatPValue(pair?.spearman?.pValue)})`),
        sanitizePdfText(h.decision),
      ];
    }),
    styles: { fontSize: 8.5, cellPadding: 5 },
    headStyles: { fillColor: [43, 82, 176] },
    margin: { left: 42, right: 42 },
  });
  y = doc.lastAutoTable.finalY + 24;

  // Chapter 4 Prose Sections
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Chapter 4 Academic Narrative', 42, y);
  y += 16;

  for (const sec of chapter4?.sections || []) {
    if (y > 730) {
      doc.addPage();
      y = 48;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(sanitizePdfText(sec.title), 42, y);
    y += 14;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const bodyLines = doc.splitTextToSize(sanitizePdfText(sec.academicText), pageWidth - 84);
    for (const line of bodyLines) {
      if (y > 760) {
        doc.addPage();
        y = 48;
      }
      doc.text(line, 42, y);
      y += 13;
    }
    y += 10;
  }

  doc.save(filename);
}
