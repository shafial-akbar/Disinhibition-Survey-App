import React from 'react';

/**
 * Reusable Settings Group Card inside the APA 7 Formatting Settings Panel.
 */
export default function APASettingsGroup({ title, description, children }) {
  return (
    <div className="apa-settings-group">
      {title && <h4 className="apa-settings-group-title">{title}</h4>}
      {description && (
        <p style={{ margin: '0 0 12px', fontSize: 12, color: '#64748b' }}>{description}</p>
      )}
      {children}
    </div>
  );
}
