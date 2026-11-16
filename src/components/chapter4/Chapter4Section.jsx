import React, { useState } from 'react';
import { Edit3, RotateCcw, Check, X } from 'lucide-react';
import APAHeading from './APAHeading';
import APAParagraph from './APAParagraph';

/**
 * Reusable Academic Section Component
 * Renders the APA Level 2 heading in Title Case (never with numerical prefixes or trailing periods),
 * dynamic or manually edited academic paragraphs, optional inline text editor,
 * and embedded APA 7 tables & figures.
 */
export default function Chapter4Section({
  sectionId,
  domId,
  narrative,
  apaSettings,
  onSaveSectionOverride,
  onResetSectionOverride,
  children,
}) {
  const [isEditing, setIsEditing] = useState(false);

  const currentIntro = narrative?.customText?.introText ?? narrative?.introText ?? '';
  const currentFindings = narrative?.customText?.findingsText ?? narrative?.findingsText ?? '';
  const currentInterp =
    narrative?.customText?.interpretationText ?? narrative?.interpretationText ?? '';

  const [draftIntro, setDraftIntro] = useState(currentIntro);
  const [draftFindings, setDraftFindings] = useState(currentFindings);
  const [draftInterp, setDraftInterp] = useState(currentInterp);

  const startEditing = () => {
    setDraftIntro(currentIntro);
    setDraftFindings(currentFindings);
    setDraftInterp(currentInterp);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (onSaveSectionOverride) {
      onSaveSectionOverride(sectionId, {
        introText: draftIntro,
        findingsText: draftFindings,
        interpretationText: draftInterp,
      });
    }
    setIsEditing(false);
  };

  const handleReset = () => {
    if (onResetSectionOverride) {
      onResetSectionOverride(sectionId);
    }
    setIsEditing(false);
  };

  // Strip any numerical prefix (e.g., "4.1 ") and trailing period per APA 7 Heading rules
  const cleanHeadingTitle = String(narrative?.title || '')
    .replace(/^\d+(\.\d+)*\s+/, '')
    .replace(/\.$/, '');

  return (
    <section id={domId} className="apa-section-block">
      <div className="apa-section-toolbar no-print">
        <div className="apa-section-toolbar-left">
          <span>{cleanHeadingTitle}</span>
          {narrative?.isEdited ? (
            <span className="admin-badge admin-badge-amber">Edited Manually</span>
          ) : (
            <span className="admin-badge admin-badge-green">Live Auto-Generated</span>
          )}
        </div>

        <div className="apa-section-toolbar-actions">
          {!isEditing && (
            <button type="button" className="apa-inline-btn" onClick={startEditing}>
              <Edit3 size={12} /> Edit Section Text
            </button>
          )}
          {narrative?.isEdited && (
            <button type="button" className="apa-inline-btn" onClick={handleReset}>
              <RotateCcw size={12} /> Reset to Live Data
            </button>
          )}
        </div>
      </div>

      <APAHeading level="h2" apaSettings={apaSettings}>
        {cleanHeadingTitle}
      </APAHeading>

      {isEditing ? (
        <div className="apa-editor-box no-print">
          <div className="apa-editor-field">
            <label>Academic Introduction Paragraph</label>
            <textarea
              value={draftIntro}
              onChange={e => setDraftIntro(e.target.value)}
            />
          </div>

          <div className="apa-editor-field">
            <label>Statistical Findings Paragraph</label>
            <textarea
              value={draftFindings}
              onChange={e => setDraftFindings(e.target.value)}
            />
          </div>

          <div className="apa-editor-field">
            <label>Academic Interpretation Paragraph</label>
            <textarea
              value={draftInterp}
              onChange={e => setDraftInterp(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              className="apa-inline-btn"
              onClick={() => setIsEditing(false)}
            >
              <X size={12} /> Cancel
            </button>
            <button
              type="button"
              className="apa-inline-btn apa-inline-btn-primary"
              onClick={handleSave}
            >
              <Check size={12} /> Save Section Text
            </button>
          </div>
        </div>
      ) : (
        <>
          <APAParagraph apaSettings={apaSettings}>{currentIntro}</APAParagraph>
          <APAParagraph apaSettings={apaSettings}>{currentFindings}</APAParagraph>
          <APAParagraph apaSettings={apaSettings}>{currentInterp}</APAParagraph>
        </>
      )}

      {children}
    </section>
  );
}
