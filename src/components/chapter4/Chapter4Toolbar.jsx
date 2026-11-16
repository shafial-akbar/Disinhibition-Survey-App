import React from 'react';
import { RefreshCw, Sliders, Sparkles } from 'lucide-react';
import ReportExportButtons from './ReportExportButtons';
import { PAPER_SIZES } from '../../services/chapter4/apa7SettingsService';
import {
  PAGE_NUMBER_POSITIONS,
  PAGE_NUMBER_FORMATS,
  parseStartPageNumber,
} from '../../services/chapter4/apa7NumberingService';

/**
 * Action Toolbar & Quick Numbering/Page Setup Bar for Chapter 4 - APA 7 Page
 * Buttons: Refresh Data, Formatting Settings, Generate Report, Download Word, Download PDF, Print Preview.
 * Also provides quick inline controls for Page No Position, Format, Start Page, Page Size, Start Table #, and Start Figure #.
 */
export default function Chapter4Toolbar({
  apaSettings,
  onQuickUpdateSettings,
  onRefreshData,
  onOpenFormattingSettings,
  onGenerateReport,
  onDownloadWord,
  onDownloadPdf,
  onTogglePrintPreview,
  isPrintPreview = false,
  loading = false,
  exportingWord = false,
  exportingPdf = false,
}) {
  const pageNum = apaSettings?.pageNumbering || {};
  const tblNum = apaSettings?.tableNumbering || {};
  const figNum = apaSettings?.figureNumbering || {};
  const paperSize = apaSettings?.page?.paperSize || 'A4';

  const handlePageNumChange = (key, val) => {
    if (!onQuickUpdateSettings) return;
    onQuickUpdateSettings({
      ...apaSettings,
      presetName: 'Custom Preset',
      pageNumbering: {
        ...pageNum,
        [key]: val,
      },
    });
  };

  const handlePaperSizeChange = val => {
    if (!onQuickUpdateSettings) return;
    onQuickUpdateSettings({
      ...apaSettings,
      presetName: 'Custom Preset',
      page: {
        ...apaSettings.page,
        paperSize: val,
      },
    });
  };

  const handleTableStartChange = val => {
    if (!onQuickUpdateSettings) return;
    onQuickUpdateSettings({
      ...apaSettings,
      presetName: 'Custom Preset',
      tableNumbering: {
        ...tblNum,
        startTableNumber: Math.max(1, Math.floor(Number(val) || 1)),
      },
    });
  };

  const handleFigureStartChange = val => {
    if (!onQuickUpdateSettings) return;
    onQuickUpdateSettings({
      ...apaSettings,
      presetName: 'Custom Preset',
      figureNumbering: {
        ...figNum,
        startFigureNumber: Math.max(1, Math.floor(Number(val) || 1)),
      },
    });
  };

  return (
    <div className="chapter4-toolbar-container no-print" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="chapter4-toolbar">
        <div className="chapter4-toolbar-group">
          <button
            type="button"
            className="admin-btn"
            onClick={onRefreshData}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh Data
          </button>

          <button
            type="button"
            className="admin-btn"
            onClick={onOpenFormattingSettings}
          >
            <Sliders size={14} />
            Formatting Settings
          </button>

          <button
            type="button"
            className="admin-btn"
            onClick={onGenerateReport}
          >
            <Sparkles size={14} />
            Generate Report
          </button>
        </div>

        <ReportExportButtons
          onDownloadWord={onDownloadWord}
          onDownloadPdf={onDownloadPdf}
          onTogglePrintPreview={onTogglePrintPreview}
          isPrintPreview={isPrintPreview}
          exportingWord={exportingWord}
          exportingPdf={exportingPdf}
        />
      </div>

      {/* Quick Inline Page & Numbering Controls Strip */}
      <div
        className="chapter4-quick-format-bar"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
          fontSize: 12.5,
          color: '#334155',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label htmlFor="quick-page-pos" style={{ fontWeight: 600, color: '#475569' }}>
            Page No:
          </label>
          <select
            id="quick-page-pos"
            value={pageNum.position || 'top-right'}
            onChange={e => handlePageNumChange('position', e.target.value)}
            style={{
              padding: '5px 8px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: 12.5,
              background: '#fff',
            }}
          >
            {PAGE_NUMBER_POSITIONS.map(p => (
              <option key={p.value} value={p.value}>
                {p.label.replace(' — Default', '')}
              </option>
            ))}
          </select>

          <select
            id="quick-page-fmt"
            aria-label="Page Number Format"
            value={pageNum.format || 'arabic'}
            onChange={e => handlePageNumChange('format', e.target.value)}
            style={{
              padding: '5px 8px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: 12.5,
              background: '#fff',
            }}
          >
            {PAGE_NUMBER_FORMATS.map(f => (
              <option key={f.value} value={f.value}>
                {f.label.replace(' (Default)', '')}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label htmlFor="quick-page-start" style={{ fontWeight: 600, color: '#475569' }}>
            Start:
          </label>
          <input
            id="quick-page-start"
            type="number"
            min={1}
            max={999}
            value={parseStartPageNumber(pageNum.startPageNumber ?? 1, pageNum.format)}
            onChange={e =>
              handlePageNumChange('startPageNumber', Math.max(1, Number(e.target.value) || 1))
            }
            style={{
              width: 62,
              padding: '5px 8px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: 12.5,
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label htmlFor="quick-page-size" style={{ fontWeight: 600, color: '#475569' }}>
            Page Size:
          </label>
          <select
            id="quick-page-size"
            value={paperSize}
            onChange={e => handlePaperSizeChange(e.target.value)}
            style={{
              padding: '5px 8px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: 12.5,
              background: '#fff',
            }}
          >
            {PAPER_SIZES.map(ps => (
              <option key={ps.value} value={ps.value}>
                {ps.value}
              </option>
            ))}
          </select>
        </div>

        <div style={{ height: 18, width: 1, background: '#e2e8f0' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label htmlFor="quick-table-start" style={{ fontWeight: 600, color: '#475569' }}>
            Start Table #:
          </label>
          <input
            id="quick-table-start"
            type="number"
            min={1}
            max={999}
            value={tblNum.startTableNumber ?? 1}
            onChange={e => handleTableStartChange(e.target.value)}
            style={{
              width: 60,
              padding: '5px 8px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: 12.5,
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label htmlFor="quick-figure-start" style={{ fontWeight: 600, color: '#475569' }}>
            Start Figure #:
          </label>
          <input
            id="quick-figure-start"
            type="number"
            min={1}
            max={999}
            value={figNum.startFigureNumber ?? 1}
            onChange={e => handleFigureStartChange(e.target.value)}
            style={{
              width: 60,
              padding: '5px 8px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: 12.5,
            }}
          />
        </div>
      </div>
    </div>
  );
}
