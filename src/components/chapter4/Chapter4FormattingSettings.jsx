import React, { useState } from 'react';
import { X, RotateCcw, Save, Check, Trash2 } from 'lucide-react';
import {
  PAPER_SIZES,
  SUPPORTED_FONTS,
  LINE_SPACING_OPTIONS,
  TEXT_ALIGNMENT_OPTIONS,
  TABLE_BORDER_STYLE_OPTIONS,
  FIGURE_ALIGNMENT_OPTIONS,
  createApa7DefaultSettings,
  applyGlobalTypographyToStyles,
  loadSavedCustomPresets,
  saveNamedCustomPreset,
  deleteNamedCustomPreset,
} from '../../services/chapter4/apa7SettingsService';
import {
  PAGE_NUMBER_POSITIONS,
  PAGE_NUMBER_FORMATS,
  NUMBERING_STYLE_OPTIONS,
  FIGURE_NUMBERING_STYLE_OPTIONS,
  parseStartPageNumber,
  formatPageNumberAtOffset,
  getTableLabel,
  getFigureLabel,
} from '../../services/chapter4/apa7NumberingService';
import APASettingsDropdown from './APASettingsDropdown';
import APASettingsGroup from './APASettingsGroup';
import APAStyleEditor from './APAStyleEditor';
import LiveDocumentPreview from './LiveDocumentPreview';

/**
 * Full APA 7th Edition Formatting & Numbering Settings Modal
 * Organized into 7 clear groups:
 * A. Page Setup
 * B. Page Numbering
 * C. General Text Formatting
 * D. Heading Styles
 * E. Table Formatting
 * F. Figure Formatting
 * G. Presets (APA 7 Default, Save/Load Custom Settings)
 */
export default function Chapter4FormattingSettings({
  isOpen,
  initialSettings,
  onApply,
  onClose,
}) {
  const [draft, setDraft] = useState(() => initialSettings || createApa7DefaultSettings());
  const [activeTab, setActiveTab] = useState('pageSetup');
  const [selectedStyleKey, setSelectedStyleKey] = useState('h1');
  const [customPresets, setCustomPresets] = useState(() => loadSavedCustomPresets());
  const [newPresetName, setNewPresetName] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const updatePage = (key, val) => {
    setDraft(prev => ({
      ...prev,
      presetName: 'Custom Preset',
      page: {
        ...prev.page,
        [key]: val,
      },
    }));
  };

  const updateMargin = (side, val) => {
    const num = Math.max(0.25, Math.min(3.0, Number(val) || 1.0));
    setDraft(prev => ({
      ...prev,
      presetName: 'Custom Preset',
      page: {
        ...prev.page,
        margins: {
          ...prev.page.margins,
          [side]: num,
        },
      },
    }));
  };

  const updatePageNumbering = (key, val) => {
    setDraft(prev => ({
      ...prev,
      presetName: 'Custom Preset',
      pageNumbering: {
        ...(prev.pageNumbering || {}),
        [key]: val,
      },
    }));
  };

  const updateTableNumbering = (key, val) => {
    setDraft(prev => ({
      ...prev,
      presetName: 'Custom Preset',
      tableNumbering: {
        ...(prev.tableNumbering || {}),
        [key]: val,
      },
    }));
  };

  const updateFigureNumbering = (key, val) => {
    setDraft(prev => ({
      ...prev,
      presetName: 'Custom Preset',
      figureNumbering: {
        ...(prev.figureNumbering || {}),
        [key]: val,
      },
    }));
  };

  const updateGlobalTypography = (patchTypo, patchPara = {}) => {
    setDraft(prev => applyGlobalTypographyToStyles(prev, patchTypo, patchPara));
  };

  const updateSingleStyle = (styleKey, prop, val) => {
    setDraft(prev => ({
      ...prev,
      presetName: 'Custom Preset',
      styles: {
        ...prev.styles,
        [styleKey]: {
          ...prev.styles[styleKey],
          [prop]: val,
        },
      },
    }));
  };

  const handleResetToApa7 = () => {
    const defaults = createApa7DefaultSettings();
    setDraft(defaults);
    setStatusMessage('Reset to official APA 7 Default settings.');
    setTimeout(() => setStatusMessage(''), 2500);
  };

  const handleSaveCustomPreset = () => {
    const updatedList = saveNamedCustomPreset(newPresetName, draft);
    setCustomPresets(updatedList);
    setNewPresetName('');
    setStatusMessage('Current settings saved.');
    setTimeout(() => setStatusMessage(''), 2500);
  };

  const handleDeletePreset = id => {
    const updatedList = deleteNamedCustomPreset(id);
    setCustomPresets(updatedList);
  };

  const renderInlineStyleCard = (styleKey, title, subtitle) => {
    const st = draft.styles?.[styleKey] || {};
    return (
      <APASettingsGroup key={styleKey} title={title} description={subtitle}>
        <div className="apa-settings-grid">
          <APASettingsDropdown
            id={`${styleKey}-font`}
            label="Font Family"
            value={st.fontFamily || 'Times New Roman'}
            onChange={v => updateSingleStyle(styleKey, 'fontFamily', v)}
            options={SUPPORTED_FONTS}
          />
          <div className="apa-field">
            <label htmlFor={`${styleKey}-size`}>Font Size (pt)</label>
            <input
              id={`${styleKey}-size`}
              type="number"
              min={1}
              max={100}
              step={0.5}
              value={st.fontSize ?? 12}
              onChange={e =>
                updateSingleStyle(
                  styleKey,
                  'fontSize',
                  Math.max(1, Math.min(100, Number(e.target.value) || 12))
                )
              }
            />
          </div>
          <APASettingsDropdown
            id={`${styleKey}-align`}
            label="Alignment"
            value={st.textAlign || 'left'}
            onChange={v => updateSingleStyle(styleKey, 'textAlign', v)}
            options={TEXT_ALIGNMENT_OPTIONS}
          />
          <div className="apa-field">
            <label htmlFor={`${styleKey}-spacing`}>Line Spacing</label>
            <input
              id={`${styleKey}-spacing`}
              type="number"
              min={1.0}
              max={3.0}
              step={0.05}
              value={st.lineSpacing ?? 2.0}
              onChange={e =>
                updateSingleStyle(styleKey, 'lineSpacing', Number(e.target.value) || 2.0)
              }
            />
          </div>
        </div>
        <div className="apa-toggle-row" style={{ marginTop: 8 }}>
          <button
            type="button"
            className={`apa-style-toggle-btn ${st.bold ? 'active' : ''}`}
            onClick={() => updateSingleStyle(styleKey, 'bold', !st.bold)}
          >
            <strong>B</strong> Bold
          </button>
          <button
            type="button"
            className={`apa-style-toggle-btn ${st.italic ? 'active' : ''}`}
            onClick={() => updateSingleStyle(styleKey, 'italic', !st.italic)}
          >
            <em>I</em> Italic
          </button>
          <button
            type="button"
            className={`apa-style-toggle-btn ${st.underline ? 'active' : ''}`}
            onClick={() => updateSingleStyle(styleKey, 'underline', !st.underline)}
          >
            <u>U</u> Underline
          </button>
        </div>
      </APASettingsGroup>
    );
  };

  return (
    <div className="apa-settings-modal-backdrop" role="dialog" aria-modal="true">
      <div className="apa-settings-modal">
        <div className="apa-settings-modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              APA 7th Edition Formatting & Numbering Settings
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
              Active Preset: <strong>{draft.presetName || 'APA 7 Default'}</strong> · Synchronizes across Live Preview, Word (.docx), PDF, and Print Preview.
            </p>
          </div>
          <button type="button" className="admin-btn" onClick={onClose} aria-label="Close">
            <X size={15} /> Close
          </button>
        </div>

        <div className="apa-settings-modal-body">
          <div className="apa-settings-controls-pane">
            <div className="apa-settings-tabs">
              {[
                { id: 'pageSetup', label: 'A. Page Setup' },
                { id: 'pageNumbering', label: 'B. Page Numbering' },
                { id: 'generalText', label: 'C. General Text' },
                { id: 'headings', label: 'D. Heading Styles' },
                { id: 'tables', label: 'E. Table Formatting' },
                { id: 'figures', label: 'F. Figure Formatting' },
                { id: 'presets', label: 'Presets' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  className={`apa-settings-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="apa-settings-scroll-content">
              {/* A. Page Setup */}
              {activeTab === 'pageSetup' && (
                <>
                  <APASettingsGroup
                    title="A. Page Setup — Paper Size & Orientation"
                    description="Default is A4 Portrait with 1.0-inch margins on all sides."
                  >
                    <div className="apa-settings-grid">
                      <APASettingsDropdown
                        id="apa-paper-size"
                        label="Page Size"
                        value={draft.page?.paperSize || 'A4'}
                        onChange={val => updatePage('paperSize', val)}
                        options={PAPER_SIZES}
                      />

                      <APASettingsDropdown
                        id="apa-orientation"
                        label="Orientation"
                        value={draft.page?.orientation || 'portrait'}
                        onChange={val => updatePage('orientation', val)}
                        options={[
                          { value: 'portrait', label: 'Portrait (Default)' },
                          { value: 'landscape', label: 'Landscape' },
                        ]}
                      />
                    </div>
                  </APASettingsGroup>

                  <APASettingsGroup
                    title="Page Margins (Inches)"
                    description="APA 7th Edition requires 1-inch margins on top, bottom, left, and right."
                  >
                    <div className="apa-settings-grid">
                      {['top', 'bottom', 'left', 'right'].map(side => (
                        <div className="apa-field" key={side}>
                          <label htmlFor={`margin-${side}`}>
                            {side.charAt(0).toUpperCase() + side.slice(1)} Margin (in)
                          </label>
                          <input
                            id={`margin-${side}`}
                            type="number"
                            min={0.25}
                            max={3.0}
                            step={0.1}
                            value={draft.page?.margins?.[side] ?? 1.0}
                            onChange={e => updateMargin(side, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </APASettingsGroup>
                </>
              )}

              {/* B. Page Numbering */}
              {activeTab === 'pageNumbering' && (
                <APASettingsGroup
                  title="B. Page Numbering Settings"
                  description="Configure page number placement, numeral format, starting page number, and title page visibility."
                >
                  <div className="apa-settings-grid">
                    <APASettingsDropdown
                      id="page-num-pos"
                      label="1. Page Number Position"
                      value={draft.pageNumbering?.position || 'top-right'}
                      onChange={val => updatePageNumbering('position', val)}
                      options={PAGE_NUMBER_POSITIONS}
                    />

                    <APASettingsDropdown
                      id="page-num-format"
                      label="2. Page Number Format"
                      value={draft.pageNumbering?.format || 'arabic'}
                      onChange={val => updatePageNumbering('format', val)}
                      options={PAGE_NUMBER_FORMATS}
                    />

                    <div className="apa-field">
                      <label htmlFor="page-num-start">
                        3. Start Page Number (e.g., 1, 45, iv, A)
                      </label>
                      <input
                        id="page-num-start"
                        type="text"
                        value={draft.pageNumbering?.startPageNumber ?? 1}
                        onChange={e => {
                          const parsed = parseStartPageNumber(
                            e.target.value,
                            draft.pageNumbering?.format || 'arabic'
                          );
                          updatePageNumbering('startPageNumber', parsed);
                        }}
                      />
                    </div>

                    <APASettingsDropdown
                      id="page-num-visibility"
                      label="4. Show Page Number on Title/First Page"
                      value={draft.pageNumbering?.showOnTitlePage !== false ? 'yes' : 'no'}
                      onChange={val => updatePageNumbering('showOnTitlePage', val === 'yes')}
                      options={[
                        { value: 'yes', label: 'Yes (APA 7 Default)' },
                        { value: 'no', label: 'No (Hide on Page 1, show Page 2+)' },
                      ]}
                    />
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      padding: '8px 12px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      fontSize: 12,
                      color: '#334155',
                    }}
                  >
                    <strong>Sequence Preview:</strong> Page 1 displays{' '}
                    <strong>
                      {formatPageNumberAtOffset(0, draft.pageNumbering) || '(Hidden)'}
                    </strong>{' '}
                    → Page 2 displays{' '}
                    <strong>{formatPageNumberAtOffset(1, draft.pageNumbering)}</strong> → Page 3
                    displays <strong>{formatPageNumberAtOffset(2, draft.pageNumbering)}</strong>.
                  </div>
                </APASettingsGroup>
              )}

              {/* C. General Text Formatting */}
              {activeTab === 'generalText' && (
                <>
                  <APASettingsGroup
                    title="C. General Text Formatting"
                    description="APA 7 requires Times New Roman 12 pt, double line spacing (2.0), left-aligned (ragged-right) text, 0.5-inch first-line indent, and 0 pt extra spacing before/after paragraphs."
                  >
                    <div className="apa-settings-grid">
                      <APASettingsDropdown
                        id="global-font-family"
                        label="Font Family"
                        value={draft.typography?.fontFamily || 'Times New Roman'}
                        onChange={val => updateGlobalTypography({ fontFamily: val })}
                        options={SUPPORTED_FONTS}
                      />

                      <div className="apa-field">
                        <label htmlFor="global-font-size">Font Size (1–100 pt)</label>
                        <input
                          id="global-font-size"
                          type="number"
                          min={1}
                          max={100}
                          step={0.5}
                          value={draft.typography?.fontSize ?? 12}
                          onChange={e =>
                            updateGlobalTypography({
                              fontSize: Math.max(1, Math.min(100, Number(e.target.value) || 12)),
                            })
                          }
                        />
                      </div>

                      <APASettingsDropdown
                        id="global-line-spacing"
                        label="Line Spacing"
                        value={draft.typography?.lineSpacing || '2.0'}
                        onChange={val => updateGlobalTypography({ lineSpacing: val })}
                        options={LINE_SPACING_OPTIONS}
                      />

                      {draft.typography?.lineSpacing === 'custom' && (
                        <div className="apa-field">
                          <label htmlFor="global-custom-spacing">Custom Line Spacing</label>
                          <input
                            id="global-custom-spacing"
                            type="number"
                            min={1.0}
                            max={4.0}
                            step={0.05}
                            value={draft.typography?.customLineSpacing ?? 2.0}
                            onChange={e =>
                              updateGlobalTypography({
                                customLineSpacing: Number(e.target.value) || 2.0,
                              })
                            }
                          />
                        </div>
                      )}

                      <APASettingsDropdown
                        id="global-text-align"
                        label="Body Alignment (Never Justified)"
                        value={draft.typography?.textAlign || 'left'}
                        onChange={val => updateGlobalTypography({ textAlign: val })}
                        options={TEXT_ALIGNMENT_OPTIONS}
                      />

                      <div className="apa-field">
                        <label htmlFor="para-first-indent">First-Line Indent (in)</label>
                        <input
                          id="para-first-indent"
                          type="number"
                          min={0}
                          max={2.5}
                          step={0.1}
                          value={draft.paragraph?.firstLineIndent ?? 0.5}
                          onChange={e =>
                            updateGlobalTypography(
                              {},
                              { firstLineIndent: Math.max(0, Number(e.target.value) || 0) }
                            )
                          }
                        />
                      </div>

                      <div className="apa-field">
                        <label htmlFor="para-space-before">Paragraph Spacing Before (pt)</label>
                        <input
                          id="para-space-before"
                          type="number"
                          min={0}
                          max={72}
                          step={1}
                          value={draft.paragraph?.spaceBefore ?? 0}
                          onChange={e =>
                            updateGlobalTypography(
                              {},
                              { spaceBefore: Math.max(0, Number(e.target.value) || 0) }
                            )
                          }
                        />
                      </div>

                      <div className="apa-field">
                        <label htmlFor="para-space-after">Paragraph Spacing After (pt)</label>
                        <input
                          id="para-space-after"
                          type="number"
                          min={0}
                          max={72}
                          step={1}
                          value={draft.paragraph?.spaceAfter ?? 0}
                          onChange={e =>
                            updateGlobalTypography(
                              {},
                              { spaceAfter: Math.max(0, Number(e.target.value) || 0) }
                            )
                          }
                        />
                      </div>
                    </div>
                  </APASettingsGroup>
                </>
              )}

              {/* D. Heading Styles */}
              {activeTab === 'headings' && (
                <APAStyleEditor
                  selectedStyleKey={selectedStyleKey}
                  onSelectStyleKey={setSelectedStyleKey}
                  stylesMap={draft.styles}
                  onChangeStyleProperty={updateSingleStyle}
                />
              )}

              {/* E. Table Formatting */}
              {activeTab === 'tables' && (
                <>
                  <APASettingsGroup
                    title="E. Table Numbering & Border Settings"
                    description="Configure starting table number (to continue from previous chapters), sequential vs. chapter-based numbering, and APA horizontal borders."
                  >
                    <div className="apa-settings-grid">
                      <div className="apa-field">
                        <label htmlFor="start-table-num">Start Table Number (Default: 1)</label>
                        <input
                          id="start-table-num"
                          type="number"
                          min={1}
                          max={999}
                          value={draft.tableNumbering?.startTableNumber ?? 1}
                          onChange={e =>
                            updateTableNumbering(
                              'startTableNumber',
                              Math.max(1, Math.floor(Number(e.target.value) || 1))
                            )
                          }
                        />
                      </div>

                      <APASettingsDropdown
                        id="table-num-style"
                        label="Table Numbering Style"
                        value={draft.tableNumbering?.numberingStyle || 'sequential'}
                        onChange={val => updateTableNumbering('numberingStyle', val)}
                        options={NUMBERING_STYLE_OPTIONS}
                      />

                      <APASettingsDropdown
                        id="table-border-style"
                        label="Table Border Style"
                        value={draft.tableNumbering?.borderStyle || 'apa-horizontal'}
                        onChange={val => updateTableNumbering('borderStyle', val)}
                        options={TABLE_BORDER_STYLE_OPTIONS}
                      />
                    </div>

                    <div
                      style={{
                        marginTop: 10,
                        padding: '8px 12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                    >
                      <strong>Table Sequence Preview:</strong> {getTableLabel(1, draft)},{' '}
                      {getTableLabel(2, draft)}, {getTableLabel(3, draft)} ... up to{' '}
                      {getTableLabel(11, draft)}.
                    </div>
                  </APASettingsGroup>

                  {renderInlineStyleCard(
                    'tableNumber',
                    'Table Number Font & Style',
                    'APA 7 Default: Bold, Flush-left, no period or colon.'
                  )}
                  {renderInlineStyleCard(
                    'tableTitle',
                    'Table Title Font & Style',
                    'APA 7 Default: Italic, Title Case, Flush-left, no period.'
                  )}
                  {renderInlineStyleCard(
                    'tableBody',
                    'Table Body Font & Style',
                    'Applies to data cells inside APA tables.'
                  )}
                  {renderInlineStyleCard(
                    'tableNote',
                    'Table Notes Font & Style',
                    'Placed directly below the table, flush-left, beginning with italicized Note.'
                  )}
                </>
              )}

              {/* F. Figure Formatting */}
              {activeTab === 'figures' && (
                <>
                  <APASettingsGroup
                    title="F. Figure Numbering & Alignment Settings"
                    description="Configure starting figure number (independent of table numbering), sequential vs. chapter-based numbering, and figure alignment."
                  >
                    <div className="apa-settings-grid">
                      <div className="apa-field">
                        <label htmlFor="start-figure-num">Start Figure Number (Default: 1)</label>
                        <input
                          id="start-figure-num"
                          type="number"
                          min={1}
                          max={999}
                          value={draft.figureNumbering?.startFigureNumber ?? 1}
                          onChange={e =>
                            updateFigureNumbering(
                              'startFigureNumber',
                              Math.max(1, Math.floor(Number(e.target.value) || 1))
                            )
                          }
                        />
                      </div>

                      <APASettingsDropdown
                        id="figure-num-style"
                        label="Figure Numbering Style"
                        value={draft.figureNumbering?.numberingStyle || 'sequential'}
                        onChange={val => updateFigureNumbering('numberingStyle', val)}
                        options={FIGURE_NUMBERING_STYLE_OPTIONS}
                      />

                      <APASettingsDropdown
                        id="figure-alignment"
                        label="Figure Alignment"
                        value={draft.figureNumbering?.alignment || 'left'}
                        onChange={val => updateFigureNumbering('alignment', val)}
                        options={FIGURE_ALIGNMENT_OPTIONS}
                      />
                    </div>

                    <div
                      style={{
                        marginTop: 10,
                        padding: '8px 12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                    >
                      <strong>Figure Sequence Preview:</strong> {getFigureLabel(1, draft)},{' '}
                      {getFigureLabel(2, draft)}, {getFigureLabel(3, draft)} ... up to{' '}
                      {getFigureLabel(16, draft)}.
                    </div>
                  </APASettingsGroup>

                  {renderInlineStyleCard(
                    'figureNumber',
                    'Figure Number Font & Style',
                    'APA 7 Default: Bold, Flush-left, no period or colon.'
                  )}
                  {renderInlineStyleCard(
                    'figureTitle',
                    'Figure Title Font & Style',
                    'APA 7 Default: Italic, Title Case, Flush-left, no period.'
                  )}
                  {renderInlineStyleCard(
                    'figureNote',
                    'Figure Notes Font & Style',
                    'Placed directly below the figure, flush-left, beginning with italicized Note.'
                  )}
                </>
              )}

              {/* Presets */}
              {activeTab === 'presets' && (
                <>
                  <APASettingsGroup
                    title="APA 7 Default Preset & Saved Configurations"
                    description="Save your custom formatting settings to match previously completed thesis chapters or reset to APA 7 Default."
                  >
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                      <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        onClick={handleResetToApa7}
                      >
                        <RotateCcw size={14} /> Load APA 7 Default Preset
                      </button>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'flex-end',
                        flexWrap: 'wrap',
                        paddingTop: 10,
                        borderTop: '1px solid #f1f5f9',
                      }}
                    >
                      <div className="apa-field" style={{ flex: 1, minWidth: 200 }}>
                        <label htmlFor="new-preset-name">Save Current Settings</label>
                        <input
                          id="new-preset-name"
                          type="text"
                          placeholder="e.g., Chapter 4 Continuation (Table 9, Figure 6)"
                          value={newPresetName}
                          onChange={e => setNewPresetName(e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        className="admin-btn"
                        onClick={handleSaveCustomPreset}
                      >
                        <Save size={14} /> Save Current Settings
                      </button>
                    </div>
                  </APASettingsGroup>

                  {customPresets.length > 0 && (
                    <APASettingsGroup title="Load Saved Settings">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {customPresets.map(p => (
                          <div
                            key={p.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              border: '1px solid #e2e8f0',
                              borderRadius: 6,
                              background: '#f8fafc',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                                {p.name}
                              </div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>
                                Saved {new Date(p.savedAt).toLocaleString()}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                className="admin-btn"
                                onClick={() => {
                                  setDraft(p.settings);
                                  setStatusMessage(`Loaded saved settings "${p.name}".`);
                                }}
                              >
                                Load Saved Settings
                              </button>
                              <button
                                type="button"
                                className="admin-btn admin-btn-danger"
                                onClick={() => handleDeletePreset(p.id)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </APASettingsGroup>
                  )}
                </>
              )}
            </div>
          </div>

          <LiveDocumentPreview draftSettings={draft} />
        </div>

        <div className="apa-settings-modal-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" className="admin-btn" onClick={handleResetToApa7}>
              <RotateCcw size={14} /> Reset to APA 7
            </button>
            {statusMessage && (
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0f766e' }}>
                {statusMessage}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button type="button" className="admin-btn" onClick={onClose}>
              Cancel Changes
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => onApply(draft)}
            >
              <Check size={14} /> Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
