import React, { useState } from 'react';
import { FileDown, FileSpreadsheet, FileText, FileCode } from 'lucide-react';
import PageTitle from '../../../components/common/PageTitle';
import AdminCard from '../../../components/admin/AdminCard';
import {
  exportRawDataCsv,
  exportCleanedDataCsv,
  exportAnalysisMetadataDoc,
} from '../../../services/export/csvExportService';
import { exportAnalysisWorkbookExcel } from '../../../services/export/excelExportService';
import { exportChapter4PdfReport } from '../../../services/export/pdfExportService';
import { exportChapter4Docx } from '../../../services/export/docxExportService';
import { formatDateTime } from '../../../utils/formatters/dateFormatter';

export default function ExportCenter({ rawRows, analysis }) {
  const { cleaning, scoring, snapshotMeta, settings } = analysis;
  const [busyDocx, setBusyDocx] = useState(false);

  const handleDocx = async () => {
    setBusyDocx(true);
    try {
      await exportChapter4Docx(analysis);
    } finally {
      setBusyDocx(false);
    }
  };

  const exportsList = [
    {
      title: 'Raw Survey Data (CSV)',
      desc: 'Sanitized raw records with all 18 item answers, demographics, and AI usage. withdrawal_code_hash is strictly omitted.',
      actionLabel: `Download Raw CSV (${rawRows.length} rows)`,
      icon: FileDown,
      onClick: () => exportRawDataCsv(rawRows),
    },
    {
      title: 'Cleaned & Scored Analysis Dataset (CSV)',
      desc: 'Valid included rows only, appending computed PCW, PT, and WSD totals & means for SPSS, R, or jamovi.',
      actionLabel: `Download Cleaned CSV (${cleaning.validCount} rows)`,
      icon: FileDown,
      onClick: () => exportCleanedDataCsv(cleaning.validRows, scoring.scoredRows),
    },
    {
      title: 'Complete Statistical Analysis Workbook (Excel .xlsx)',
      desc: 'Multi-sheet workbook containing Metadata, Cleaned Dataset, Construct Scores, Descriptives, Reliability, Normality, Correlations, and Hypotheses.',
      actionLabel: 'Download Excel Workbook (.xlsx)',
      icon: FileSpreadsheet,
      onClick: () => exportAnalysisWorkbookExcel(analysis),
    },
    {
      title: 'Thesis Chapter 4 Statistical Report (PDF)',
      desc: 'Formatted academic PDF with APA summary tables (Tables 4.1–4.3) and full Chapter 4 narrative.',
      actionLabel: 'Download Chapter 4 PDF',
      icon: FileText,
      onClick: () => exportChapter4PdfReport(analysis),
    },
    {
      title: 'Thesis Chapter 4 Manuscript (Word .docx)',
      desc: 'Editable Microsoft Word document containing Sections 4.1–4.13 and formatted academic tables for thesis submission.',
      actionLabel: busyDocx ? 'Generating Word File...' : 'Download Chapter 4 Word (.docx)',
      icon: FileText,
      onClick: handleDocx,
      disabled: busyDocx,
    },
    {
      title: 'Analysis Metadata & Reproducibility Log (.txt)',
      desc: 'Documents exact timestamp, questionnaire version, missing-data rule, correlation deletion mode, and sample counts.',
      actionLabel: 'Download Metadata Documentation',
      icon: FileCode,
      onClick: () => exportAnalysisMetadataDoc(snapshotMeta, cleaning, settings),
    },
  ];

  return (
    <>
      <PageTitle
        title="Research Export Center"
        subtitle="Download SPSS-ready datasets, multi-sheet Excel workbooks, editable Word Chapter 4 manuscripts, PDF reports, and reproducibility logs."
      />

      <AdminCard title="Active Analysis Snapshot Summary">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
          <div><strong>Analyzed At:</strong><br />{formatDateTime(snapshotMeta.analyzedAt)}</div>
          <div><strong>Version:</strong><br />{snapshotMeta.version}</div>
          <div><strong>Valid Sample (n):</strong><br />{cleaning.validCount} of {cleaning.totalSubmitted}</div>
          <div><strong>Privacy Guard:</strong><br />withdrawal_code_hash omitted</div>
        </div>
      </AdminCard>

      <div className="export-grid">
        {exportsList.map(item => {
          const Icon = item.icon;
          return (
            <div className="export-tile" key={item.title}>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: 15.5, fontWeight: 800 }}>{item.title}</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.55 }}>{item.desc}</p>
              </div>
              <div>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={item.onClick}
                  disabled={item.disabled}
                >
                  <Icon size={14} /> {item.actionLabel}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="admin-banner admin-banner-info">
        <strong>Chart PNG Downloads:</strong> High-resolution PNG downloads are available directly on every individual chart card across Overview, Demographics, AI Usage, Normality, and Correlation pages.
      </div>
    </>
  );
}
