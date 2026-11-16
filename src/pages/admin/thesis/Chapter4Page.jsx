import React, { useMemo, useState } from 'react';
import { Printer, X } from 'lucide-react';
import {
  loadActiveApa7Settings,
  saveActiveApa7Settings,
} from '../../../services/chapter4/apa7SettingsService';
import { prepareChapter4Dataset } from '../../../services/chapter4/chapter4DataService';
import { computeChapter4Statistics } from '../../../services/chapter4/chapter4StatisticsService';
import {
  generateChapter4Narratives,
  loadChapter4TextOverrides,
  saveChapter4SectionOverride,
  resetChapter4SectionOverride,
  clearAllChapter4Overrides,
} from '../../../services/chapter4/chapter4NarrativeService';
import {
  exportApa7Chapter4Word,
  exportApa7Chapter4Pdf,
} from '../../../services/chapter4/chapter4ExportService';

import Chapter4Header from '../../../components/chapter4/Chapter4Header';
import Chapter4Toolbar from '../../../components/chapter4/Chapter4Toolbar';
import Chapter4Navigation from '../../../components/chapter4/Chapter4Navigation';
import Chapter4FormattingSettings from '../../../components/chapter4/Chapter4FormattingSettings';
import Chapter4ReportPreview from '../../../components/chapter4/Chapter4ReportPreview';
import EmptyState from '../../../components/chapter4/EmptyState';
import ErrorMessage from '../../../components/chapter4/ErrorMessage';

/**
 * Main Orchestrator Page: Dynamic Chapter 4 - APA 7 Thesis Report Module
 * Route: /admin/thesis-report/chapter-4
 */
export default function Chapter4Page({
  rawRows = [],
  filteredRawRows = [],
  analysis,
  isFiltered = false,
  onRefresh,
}) {
  const [apaSettings, setApaSettings] = useState(() => loadActiveApa7Settings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('4.1');
  const [textOverrides, setTextOverrides] = useState(() => loadChapter4TextOverrides());
  const [lastGeneratedAt, setLastGeneratedAt] = useState(
    () => analysis?.snapshotMeta?.analyzedAt || new Date().toISOString()
  );
  const [isPrintPreview, setIsPrintPreview] = useState(false);
  const [exportingWord, setExportingWord] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportError, setExportError] = useState('');

  const sourceRows = isFiltered ? filteredRawRows : rawRows;

  // 1. Screen and validate database rows non-destructively
  const preparedData = useMemo(
    () =>
      prepareChapter4Dataset(
        sourceRows,
        analysis?.cleaning?.exclusionsMap || {},
        analysis?.settings || {}
      ),
    [sourceRows, analysis]
  );

  // 2. Compute all Chapter 4 statistical results from live valid responses
  const stats = useMemo(
    () =>
      computeChapter4Statistics(
        preparedData,
        analysis?.settings || {},
        lastGeneratedAt
      ),
    [preparedData, analysis, lastGeneratedAt]
  );

  // 3. Generate dynamic APA 7 academic narratives (merged with any researcher text overrides and centralized numbering)
  const narratives = useMemo(
    () => generateChapter4Narratives(stats, textOverrides, apaSettings),
    [stats, textOverrides, apaSettings]
  );

  const handleRefreshData = async () => {
    setExportError('');
    if (onRefresh) {
      await onRefresh();
    }
    setLastGeneratedAt(new Date().toISOString());
  };

  const handleGenerateReport = () => {
    setExportError('');
    const cleared = clearAllChapter4Overrides();
    setTextOverrides(cleared);
    setLastGeneratedAt(new Date().toISOString());
  };

  const handleApplyFormattingSettings = newSettings => {
    const saved = saveActiveApa7Settings(newSettings);
    setApaSettings(saved);
    setIsSettingsOpen(false);
  };

  const handleQuickUpdateSettings = newSettings => {
    const saved = saveActiveApa7Settings(newSettings);
    setApaSettings(saved);
  };

  const handleSaveSectionOverride = (sectionId, customParagraphs) => {
    const updated = saveChapter4SectionOverride(sectionId, customParagraphs);
    setTextOverrides(updated);
  };

  const handleResetSectionOverride = sectionId => {
    const updated = resetChapter4SectionOverride(sectionId);
    setTextOverrides(updated);
  };

  const handleDownloadWord = async () => {
    if (exportingWord) return;
    setExportError('');
    setExportingWord(true);
    try {
      await exportApa7Chapter4Word({
        stats,
        narratives,
        apaSettings,
        filename: `Chapter_4_Results_APA7_N${stats.screening.validN}.docx`,
      });
    } catch (err) {
      setExportError(err?.message || 'Failed to generate Word (.docx) document.');
    } finally {
      setExportingWord(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (exportingPdf) return;
    setExportError('');
    setExportingPdf(true);
    try {
      await exportApa7Chapter4Pdf({
        stats,
        narratives,
        apaSettings,
        filename: `Chapter_4_Results_APA7_N${stats.screening.validN}.pdf`,
      });
    } catch (err) {
      setExportError(err?.message || 'Failed to generate PDF document.');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleTogglePrintPreview = () => {
    setIsPrintPreview(prev => !prev);
  };

  return (
    <div className="chapter4-workspace">
      {isPrintPreview && (
        <div className="chapter4-print-preview-banner no-print">
          <div>
            <strong>Print Preview Mode Active</strong> — Sidebars and editing toolbars are hidden when printing.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => window.print()}
            >
              <Printer size={14} /> Print Document Now
            </button>
            <button
              type="button"
              className="admin-btn"
              onClick={() => setIsPrintPreview(false)}
            >
              <X size={14} /> Exit Print Preview
            </button>
          </div>
        </div>
      )}

      {!isPrintPreview && (
        <>
          <Chapter4Header
            validN={stats.screening.validN}
            totalN={stats.screening.retrievedN}
            excludedN={stats.screening.excludedN}
            lockedN={stats.screening.lockedN}
            pendingN={stats.screening.pendingN}
            analyzedAt={stats.analyzedAt}
            questionnaireVersion={stats.screening.questionnaireVersion}
            presetName={apaSettings.presetName}
          />

          <Chapter4Toolbar
            apaSettings={apaSettings}
            onQuickUpdateSettings={handleQuickUpdateSettings}
            onRefreshData={handleRefreshData}
            onOpenFormattingSettings={() => setIsSettingsOpen(true)}
            onGenerateReport={handleGenerateReport}
            onDownloadWord={handleDownloadWord}
            onDownloadPdf={handleDownloadPdf}
            onTogglePrintPreview={handleTogglePrintPreview}
            isPrintPreview={isPrintPreview}
            exportingWord={exportingWord}
            exportingPdf={exportingPdf}
          />

          <Chapter4Navigation
            activeSection={activeSection}
            onSelectSection={setActiveSection}
          />
        </>
      )}

      {preparedData.schemaCheck?.warning && (
        <ErrorMessage
          title="Database Schema Notice"
          message={preparedData.schemaCheck.warning}
        />
      )}

      {exportError && (
        <ErrorMessage
          title="Export Error"
          message={exportError}
          onRetry={() => setExportError('')}
        />
      )}

      {!stats.hasData && !isPrintPreview && (
        <EmptyState
          retrievedN={stats.screening.retrievedN}
          excludedN={stats.screening.excludedN}
          onRefresh={handleRefreshData}
        />
      )}

      <Chapter4ReportPreview
        stats={stats}
        narratives={narratives}
        apaSettings={apaSettings}
        onSaveSectionOverride={handleSaveSectionOverride}
        onResetSectionOverride={handleResetSectionOverride}
      />

      <Chapter4FormattingSettings
        isOpen={isSettingsOpen}
        initialSettings={apaSettings}
        onApply={handleApplyFormattingSettings}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
