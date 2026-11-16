import React from 'react';

/**
 * Reusable Dropdown Control for APA 7 Formatting Settings.
 */
export default function APASettingsDropdown({ label, value, onChange, options = [], id }) {
  return (
    <div className="apa-field">
      {label && <label htmlFor={id}>{label}</label>}
      <select id={id} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(opt => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const text = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val}>
              {text}
            </option>
          );
        })}
      </select>
    </div>
  );
}
