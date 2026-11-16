import React from 'react';
import { FileDown, FileText, Printer } from 'lucide-react';

/**
 * Export and Print action buttons for the Chapter 4 APA 7 report.
 */
export default function ReportExportButtons({
  onDownloadWord,
  onDownloadPdf,
  onTogglePrintPreview,
  isPrintPreview = false,
  exportingWord = false,
  exportingPdf = false,
}) {
  return (
    <div className="chapter4-toolbar-group">
      <button
        type="button"
        className="admin-btn admin-btn-primary"
        onClick={onDownloadWord}
        disabled={exportingWord}
      >
        <FileText size={14} />
        {exportingWord ? 'Building Word (.docx)...' : 'Download Word'}
      </button>

      <button
        type="button"
        className="admin-btn"
        onClick={onDownloadPdf}
        disabled={exportingPdf}
      >
        <FileDown size={14} />
        {exportingPdf ? 'Building PDF...' : 'Download PDF'}
      </button>

      <button
        type="button"
        className={`admin-btn ${isPrintPreview ? 'admin-btn-primary' : ''}`}
        onClick={onTogglePrintPreview}
      >
        <Printer size={14} />
        {isPrintPreview ? 'Exit Print Preview' : 'Print Preview'}
      </button>
    </div>
  );
}
