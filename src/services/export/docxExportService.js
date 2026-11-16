import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';
import { QUESTIONNAIRE_CONFIG } from '../../config/questionnaireConfig.js';
import { formatNumber, formatPValue, formatCI } from '../../utils/formatters/numberFormatter.js';

function makeCell(text, bold = false) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text: String(text ?? '—'), bold, size: 20 })],
      }),
    ],
  });
}

function makeTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: headers.map(h => makeCell(h, true)),
      }),
      ...rows.map(
        row =>
          new TableRow({
            children: row.map(val => makeCell(val, false)),
          })
      ),
    ],
  });
}

/**
 * Generates an editable Microsoft Word (.docx) thesis Chapter 4 manuscript
 * grounded strictly in the active statistical calculations.
 */
export async function exportChapter4Docx({
  cleaning,
  descriptive,
  reliability,
  normality,
  correlation,
  hypothesesResult,
  chapter4,
  snapshotMeta,
  filename = 'Chapter_4_Results_and_Analysis.docx',
}) {
  const children = [
    new Paragraph({
      text: 'CHAPTER 4: RESULTS AND STATISTICAL ANALYSIS',
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: QUESTIONNAIRE_CONFIG.studyTitle, bold: true }),
      ],
    }),
    new Paragraph({
      text: `${QUESTIONNAIRE_CONFIG.institution} | Version: ${QUESTIONNAIRE_CONFIG.version} | Analyzed: ${snapshotMeta?.analyzedAt || new Date().toISOString()} | Valid n = ${cleaning?.validCount ?? 0} (Total retrieved = ${cleaning?.totalSubmitted ?? 0})`,
    }),
    new Paragraph({ text: '' }),
  ];

  // Narrative Sections
  for (const sec of chapter4?.sections || []) {
    children.push(
      new Paragraph({
        text: sec.title,
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({
        text: sec.academicText,
      })
    );
    if (sec.limitations) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Methodological Note: ', bold: true }),
            new TextRun({ text: sec.limitations }),
          ],
        })
      );
    }
    children.push(new Paragraph({ text: '' }));
  }

  // Statistical Tables Appendix
  children.push(
    new Paragraph({
      text: 'Table 4.1 Descriptive Statistics (Composite Mean Scores, 1–5 Scale)',
      heading: HeadingLevel.HEADING_2,
    }),
    makeTable(
      ['Construct', 'n', 'Mean', 'SD', 'Median', 'Min', 'Max', 'Skewness', 'Kurtosis'],
      (descriptive?.compositeSummaries || []).map(c => [
        `${c.name} (${c.code})`,
        c.meanSummary.validN,
        formatNumber(c.meanSummary.mean, 2),
        formatNumber(c.meanSummary.sd, 2),
        formatNumber(c.meanSummary.median, 2),
        formatNumber(c.meanSummary.min, 2),
        formatNumber(c.meanSummary.max, 2),
        formatNumber(c.meanSummary.skewness, 2),
        formatNumber(c.meanSummary.kurtosis, 2),
      ])
    ),
    new Paragraph({ text: '' }),

    new Paragraph({
      text: "Table 4.2 Reliability (Cronbach's Alpha) and Normality Summary",
      heading: HeadingLevel.HEADING_2,
    }),
    makeTable(
      ['Construct', 'Items (k)', 'Complete n', 'Alpha', 'Shapiro-Wilk W', 'p-value', 'Status'],
      (reliability?.scales || []).map((rel, idx) => {
        const norm = normality?.scales?.[idx] || {};
        return [
          `${rel.name} (${rel.code})`,
          rel.itemCount,
          rel.validN,
          formatNumber(rel.alpha, 3),
          formatNumber(norm.wStatistic, 3),
          formatPValue(norm.pValue),
          rel.interpretation?.label || rel.warning || 'N/A',
        ];
      })
    ),
    new Paragraph({ text: '' }),

    new Paragraph({
      text: 'Table 4.3 Confirmatory Hypothesis Testing (H1–H3)',
      heading: HeadingLevel.HEADING_2,
    }),
    makeTable(
      ['ID', 'Hypothesis', 'n', 'Pearson r (p)', '95% CI', 'Spearman ρ (p)', 'Decision'],
      (hypothesesResult?.hypotheses || []).map(h => {
        const pair = correlation?.pairs?.find(p => p.id === h.id);
        return [
          h.id,
          h.statement,
          h.n,
          `${formatNumber(pair?.pearson?.r, 3)} (${formatPValue(pair?.pearson?.pValue)})`,
          formatCI(pair?.pearson?.ci, 2),
          `${formatNumber(pair?.spearman?.rho, 3)} (${formatPValue(pair?.spearman?.pValue)})`,
          h.decision,
        ];
      })
    )
  );

  const doc = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
