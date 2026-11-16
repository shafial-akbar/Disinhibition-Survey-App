import React, { useState } from 'react';
import { Copy, Check, FileText } from 'lucide-react';
import PageTitle from '../../../components/common/PageTitle';
import { exportChapter4PdfReport } from '../../../services/export/pdfExportService';
import { exportChapter4Docx } from '../../../services/export/docxExportService';
import { formatDateTime } from '../../../utils/formatters/dateFormatter';

export default function Chapter4Analysis({ analysis }) {
  const { chapter4, snapshotMeta } = analysis;
  const [copiedId, setCopiedId] = useState(null);
  const [busyDocx, setBusyDocx] = useState(false);

  const handleCopy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyAll = async () => {
    const fullText = (chapter4.sections || [])
      .map(s => `${s.title}\n\n${s.academicText}${s.limitations ? `\nNote: ${s.limitations}` : ''}`)
      .join('\n\n----------------------------------------\n\n');
    await handleCopy('all', fullText);
  };

  const handleDocx = async () => {
    setBusyDocx(true);
    try {
      await exportChapter4Docx(analysis);
    } finally {
      setBusyDocx(false);
    }
  };

  return (
    <>
      <PageTitle
        title="Chapter 4 — Complete Results & Academic Manuscript"
        subtitle="Publication-ready quantitative findings (Sections 4.1–4.13) generated strictly from your live calculated statistics."
        meta={`Generated: ${formatDateTime(chapter4.generatedAt)} · Sample n = ${snapshotMeta.validN}`}
        actions={
          <>
            <button type="button" className="admin-btn" onClick={handleCopyAll}>
              {copiedId === 'all' ? <Check size={14} /> : <Copy size={14} />}
              {copiedId === 'all' ? 'All Sections Copied' : 'Copy Complete Chapter 4'}
            </button>
            <button
              type="button"
              className="admin-btn"
              onClick={() => exportChapter4PdfReport(analysis)}
            >
              <FileText size={14} /> Export PDF
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={handleDocx}
              disabled={busyDocx}
            >
              <FileText size={14} /> {busyDocx ? 'Generating...' : 'Export Word (.docx)'}
            </button>
          </>
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {(chapter4.sections || []).map(sec => (
          <section className="chapter4-section" key={sec.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <h3>{sec.title}</h3>
              <button
                type="button"
                className="admin-btn admin-btn-sm"
                onClick={() => handleCopy(sec.id, `${sec.title}\n\n${sec.academicText}`)}
              >
                {copiedId === sec.id ? <Check size={13} /> : <Copy size={13} />}
                {copiedId === sec.id ? 'Copied' : 'Copy Text'}
              </button>
            </div>

            {sec.simpleText && (
              <div className="chapter4-simple">
                <strong>Plain-English Summary:</strong> {sec.simpleText}
              </div>
            )}

            <div className="chapter4-academic">{sec.academicText}</div>

            {sec.whyMatters && (
              <div style={{ fontSize: 12.5, color: '#475569' }}>
                <strong>Why this matters:</strong> {sec.whyMatters}
              </div>
            )}

            {sec.limitations && (
              <div className="admin-banner admin-banner-warn" style={{ fontSize: 12.5 }}>
                <strong>Limitation / Caution:</strong> {sec.limitations}
              </div>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
