import React, { useState } from 'react';
import { FileSpreadsheet, FileText, FileDown } from 'lucide-react';
import { exportRawDataCsv, exportCleanedDataCsv } from '../../services/export/csvExportService';
import { exportAnalysisWorkbookExcel } from '../../services/export/excelExportService';
import { exportChapter4PdfReport } from '../../services/export/pdfExportService';
import { exportChapter4Docx } from '../../services/export/docxExportService';

export default function ExportButtons({ rawRows, analysis }) {
  const [busy, setBusy] = useState('');

  const handleDocx = async () => {
    setBusy('docx');
    try {
      await exportChapter4Docx(analysis);
    } finally {
      setBusy('');
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button
        type="button"
        className="admin-btn admin-btn-sm"
        onClick={() => exportRawDataCsv(rawRows)}
      >
        <FileDown size={13} /> Raw CSV
      </button>
      <button
        type="button"
        className="admin-btn admin-btn-sm"
        onClick={() => exportCleanedDataCsv(analysis.cleaning.validRows, analysis.scoring.scoredRows)}
      >
        <FileDown size={13} /> Cleaned CSV
      </button>
      <button
        type="button"
        className="admin-btn admin-btn-sm"
        onClick={() => exportAnalysisWorkbookExcel(analysis)}
      >
        <FileSpreadsheet size={13} /> Excel Workbook
      </button>
      <button
        type="button"
        className="admin-btn admin-btn-sm"
        onClick={() => exportChapter4PdfReport(analysis)}
      >
        <FileText size={13} /> Chapter 4 PDF
      </button>
      <button
        type="button"
        className="admin-btn admin-btn-sm admin-btn-primary"
        onClick={handleDocx}
        disabled={busy === 'docx'}
      >
        <FileText size={13} /> {busy === 'docx' ? 'Generating...' : 'Chapter 4 Word'}
      </button>
    </div>
  );
}
