import React, { useMemo } from 'react';
import { getPaperDimensions, getStyleCss } from '../../services/chapter4/apa7Formatter';
import { formatPageNumberAtOffset } from '../../services/chapter4/apa7NumberingService';
import { buildChapter4TablesAndFiguresCatalog } from '../../services/chapter4/chapter4ExportService';
import APAHeading from './APAHeading';
import Chapter4Section from './Chapter4Section';
import SectionDataScreening from './SectionDataScreening';
import SectionDemographics from './SectionDemographics';
import SectionAIUsage from './SectionAIUsage';
import SectionDescriptiveStatistics from './SectionDescriptiveStatistics';
import SectionReliability from './SectionReliability';
import SectionNormality from './SectionNormality';
import SectionCorrelation from './SectionCorrelation';
import SectionHypothesisTesting from './SectionHypothesisTesting';
import SectionSummary from './SectionSummary';

/**
 * Complete Academic Thesis Manuscript Preview (Chapter 4 - APA 7)
 * Renders an authentic A4/Letter/Legal paper canvas with:
 * - Configurable page numbering (position, format, start number, visibility on first page)
 * - Single-line H1 Chapter Title: "Chapter 4: Results"
 * - Title Case H2 section headings without numerical prefixes
 * - Horizontal-rule-only APA tables and high-res figures with independent starting numbers
 */
export default function Chapter4ReportPreview({
  stats,
  narratives,
  apaSettings,
  onSaveSectionOverride,
  onResetSectionOverride,
}) {
  const dims = useMemo(() => getPaperDimensions(apaSettings), [apaSettings]);
  const catalog = useMemo(
    () => buildChapter4TablesAndFiguresCatalog(stats, apaSettings),
    [stats, apaSettings]
  );

  const headerCss = getStyleCss(apaSettings, 'header');
  const footerCss = getStyleCss(apaSettings, 'footer');
  const hasData = Boolean(stats?.hasData);

  const pageNumCfg = apaSettings?.pageNumbering || {};
  const pagePos = pageNumCfg.position || 'top-right';
  const firstPageFormatted = formatPageNumberAtOffset(0, pageNumCfg);
  const secondPageFormatted = formatPageNumberAtOffset(1, pageNumCfg);
  const isTopPageNum = pagePos.startsWith('top');

  const getPageNumAlign = () => {
    if (pagePos.endsWith('left')) return 'left';
    if (pagePos.endsWith('center')) return 'center';
    return 'right';
  };

  return (
    <div className="apa-paper-desk">
      <article
        className="apa-paper-sheet"
        style={{
          width: `${dims.widthPx}px`,
          minHeight: `${dims.minHeightPx}px`,
          padding: dims.paddingCss,
        }}
      >
        {/* Top Page Number Header (when position is Top Right or Top Left) */}
        {isTopPageNum && (
          <div
            className="apa-running-header"
            style={{
              ...headerCss,
              textIndent: '0in',
              justifyContent: pagePos === 'top-left' ? 'flex-start' : 'flex-end',
              textAlign: getPageNumAlign(),
            }}
          >
            <span>{firstPageFormatted}</span>
          </div>
        )}

        {/* Single-Line H1 Chapter Title: "Chapter 4: Results" */}
        <APAHeading level="h1" apaSettings={apaSettings}>
          Chapter 4: Results
        </APAHeading>

        {/* Section 1: Introduction and Data Screening */}
        <SectionDataScreening
          narrative={narratives?.['4.1']}
          catalog={catalog}
          apaSettings={apaSettings}
          hasData={hasData}
          onSaveSectionOverride={onSaveSectionOverride}
          onResetSectionOverride={onResetSectionOverride}
        />

        {/* Section 2: Demographic Characteristics of Participants */}
        <SectionDemographics
          narrative={narratives?.['4.2']}
          stats={stats}
          catalog={catalog}
          apaSettings={apaSettings}
          hasData={hasData}
          onSaveSectionOverride={onSaveSectionOverride}
          onResetSectionOverride={onResetSectionOverride}
        />

        {/* Section 3: Conversational AI Usage Characteristics */}
        <SectionAIUsage
          narrative={narratives?.['4.3']}
          stats={stats}
          catalog={catalog}
          apaSettings={apaSettings}
          hasData={hasData}
          onSaveSectionOverride={onSaveSectionOverride}
          onResetSectionOverride={onResetSectionOverride}
        />

        {/* Section 4: Descriptive Statistics of Study Variables */}
        <SectionDescriptiveStatistics
          narrative={narratives?.['4.4']}
          catalog={catalog}
          apaSettings={apaSettings}
          hasData={hasData}
          onSaveSectionOverride={onSaveSectionOverride}
          onResetSectionOverride={onResetSectionOverride}
        />

        {/* Section 5: Reliability and Normality Analysis */}
        <Chapter4Section
          sectionId="4.5"
          domId="section-4-5"
          narrative={narratives?.['4.5']}
          apaSettings={apaSettings}
          onSaveSectionOverride={onSaveSectionOverride}
          onResetSectionOverride={onResetSectionOverride}
        >
          <SectionReliability
            catalog={catalog}
            apaSettings={apaSettings}
            hasData={hasData}
          />
          <SectionNormality
            stats={stats}
            catalog={catalog}
            apaSettings={apaSettings}
            hasData={hasData}
          />
        </Chapter4Section>

        {/* Section 6: Correlation Analysis */}
        <SectionCorrelation
          narrative={narratives?.['4.6']}
          stats={stats}
          catalog={catalog}
          apaSettings={apaSettings}
          hasData={hasData}
          onSaveSectionOverride={onSaveSectionOverride}
          onResetSectionOverride={onResetSectionOverride}
        />

        {/* Section 7: Hypothesis Testing */}
        <SectionHypothesisTesting
          narrative={narratives?.['4.7']}
          catalog={catalog}
          apaSettings={apaSettings}
          hasData={hasData}
          onSaveSectionOverride={onSaveSectionOverride}
          onResetSectionOverride={onResetSectionOverride}
        />

        {/* Section 8: Summary of Findings */}
        <SectionSummary
          narrative={narratives?.['4.8']}
          apaSettings={apaSettings}
          onSaveSectionOverride={onSaveSectionOverride}
          onResetSectionOverride={onResetSectionOverride}
        />

        {/* Bottom Page Number / Running Footer */}
        <div
          className="apa-running-footer"
          style={{
            ...footerCss,
            textIndent: '0in',
            display: 'flex',
            alignItems: 'center',
            justifyContent: !isTopPageNum
              ? pagePos === 'bottom-left'
                ? 'flex-start'
                : pagePos === 'bottom-center'
                ? 'center'
                : 'flex-end'
              : 'space-between',
          }}
        >
          {!isTopPageNum ? (
            <span>{firstPageFormatted}</span>
          ) : (
            <span className="no-print" style={{ fontSize: '10pt', color: '#64748b' }}>
              Page Sequence Preview: Page 1 ({firstPageFormatted || 'Hidden on Page 1'}) → Page 2 ({secondPageFormatted})
            </span>
          )}
        </div>
      </article>
    </div>
  );
}
