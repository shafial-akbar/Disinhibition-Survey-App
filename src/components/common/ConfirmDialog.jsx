import React from 'react';
import { X } from 'lucide-react';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  children,
}) {
  if (!open) return null;

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
      <div className="admin-modal" style={{ maxWidth: 480 }}>
        <div className="admin-modal-header">
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{title}</h3>
          <button
            type="button"
            className="admin-btn admin-btn-sm"
            onClick={onCancel}
            aria-label="Close dialog"
          >
            <X size={14} />
          </button>
        </div>
        {message && (
          <p style={{ margin: '0 0 14px', fontSize: 13.5, lineHeight: 1.6, color: '#334155' }}>
            {message}
          </p>
        )}
        {children}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <button type="button" className="admin-btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="admin-btn admin-btn-primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
