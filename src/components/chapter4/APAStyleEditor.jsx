import React from 'react';
import {
  SUPPORTED_FONTS,
  TEXT_ALIGNMENT_OPTIONS,
  TEXT_STYLE_DEFINITIONS,
} from '../../services/chapter4/apa7SettingsService';
import APASettingsDropdown from './APASettingsDropdown';
import APASettingsGroup from './APASettingsGroup';

/**
 * Granular Style Editor for all 20 required APA 7 Text Styles.
 * Supports font family, font size (1–100 pt), bold, italic, underline,
 * text alignment, line spacing, first-line indent, space before, and space after.
 */
export default function APAStyleEditor({
  selectedStyleKey,
  onSelectStyleKey,
  stylesMap = {},
  onChangeStyleProperty,
}) {
  const activeStyle = stylesMap[selectedStyleKey] || {};
  const activeMeta =
    TEXT_STYLE_DEFINITIONS.find(d => d.key === selectedStyleKey) || TEXT_STYLE_DEFINITIONS[0];

  const updateProp = (prop, val) => {
    onChangeStyleProperty(selectedStyleKey, prop, val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <APASettingsGroup
        title="Select Text Style to Customize (All 20 Styles)"
        description="Choose any document element below to customize its typography, spacing, and indentation."
      >
        <APASettingsDropdown
          id="apa-style-selector"
          label="Document Element Style"
          value={selectedStyleKey}
          onChange={onSelectStyleKey}
          options={TEXT_STYLE_DEFINITIONS.map(item => ({
            value: item.key,
            label: `${item.label} (${item.group})`,
          }))}
        />
      </APASettingsGroup>

      <APASettingsGroup title={`Customize: ${activeMeta.label}`}>
        <div className="apa-settings-grid">
          <APASettingsDropdown
            id="style-font-family"
            label="Font Family"
            value={activeStyle.fontFamily || 'Times New Roman'}
            onChange={val => updateProp('fontFamily', val)}
            options={SUPPORTED_FONTS}
          />

          <div className="apa-field">
            <label htmlFor="style-font-size">Font Size (1–100 pt)</label>
            <input
              id="style-font-size"
              type="number"
              min={1}
              max={100}
              step={0.5}
              value={activeStyle.fontSize ?? 12}
              onChange={e => {
                const v = Math.max(1, Math.min(100, Number(e.target.value) || 12));
                updateProp('fontSize', v);
              }}
            />
          </div>

          <APASettingsDropdown
            id="style-text-align"
            label="Text Alignment"
            value={activeStyle.textAlign || 'left'}
            onChange={val => updateProp('textAlign', val)}
            options={TEXT_ALIGNMENT_OPTIONS}
          />

          <div className="apa-field">
            <label htmlFor="style-line-spacing">Line Spacing Multiplier</label>
            <input
              id="style-line-spacing"
              type="number"
              min={0.8}
              max={4.0}
              step={0.05}
              value={activeStyle.lineSpacing ?? 2.0}
              onChange={e => updateProp('lineSpacing', Number(e.target.value) || 2.0)}
            />
          </div>

          <div className="apa-field">
            <label htmlFor="style-first-indent">First-Line Indent (inches)</label>
            <input
              id="style-first-indent"
              type="number"
              min={0}
              max={2.5}
              step={0.1}
              value={activeStyle.firstLineIndent ?? 0}
              onChange={e => updateProp('firstLineIndent', Math.max(0, Number(e.target.value) || 0))}
            />
          </div>

          <div className="apa-field">
            <label htmlFor="style-space-before">Space Before (pt)</label>
            <input
              id="style-space-before"
              type="number"
              min={0}
              max={72}
              step={1}
              value={activeStyle.spaceBefore ?? 0}
              onChange={e => updateProp('spaceBefore', Math.max(0, Number(e.target.value) || 0))}
            />
          </div>

          <div className="apa-field">
            <label htmlFor="style-space-after">Space After (pt)</label>
            <input
              id="style-space-after"
              type="number"
              min={0}
              max={72}
              step={1}
              value={activeStyle.spaceAfter ?? 0}
              onChange={e => updateProp('spaceAfter', Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
            Font Emphasis & Case
          </div>
          <div className="apa-toggle-row">
            <button
              type="button"
              className={`apa-style-toggle-btn ${activeStyle.bold ? 'active' : ''}`}
              onClick={() => updateProp('bold', !activeStyle.bold)}
            >
              <strong>B</strong> Bold
            </button>
            <button
              type="button"
              className={`apa-style-toggle-btn ${activeStyle.italic ? 'active' : ''}`}
              onClick={() => updateProp('italic', !activeStyle.italic)}
            >
              <em>I</em> Italic
            </button>
            <button
              type="button"
              className={`apa-style-toggle-btn ${activeStyle.underline ? 'active' : ''}`}
              onClick={() => updateProp('underline', !activeStyle.underline)}
            >
              <u>U</u> Underline
            </button>
            <button
              type="button"
              className={`apa-style-toggle-btn ${activeStyle.uppercase ? 'active' : ''}`}
              onClick={() => updateProp('uppercase', !activeStyle.uppercase)}
            >
              AA Uppercase
            </button>
          </div>
        </div>
      </APASettingsGroup>
    </div>
  );
}
