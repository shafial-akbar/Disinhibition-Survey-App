import React, { useState } from 'react';
import { Copy, Check, Languages } from 'lucide-react';

export default function InterpretationBox({
  title = 'Beginner Guide & Thesis Interpretation',
  whatItIs,
  whyUseIt,
  howCalculated,
  highVsLow,
  howToInterpret,
  thesisText,
  banglaSummary,
  showBanglaDefault = true,
}) {
  const [showBn, setShowBn] = useState(showBanglaDefault);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!thesisText) return;
    try {
      await navigator.clipboard.writeText(thesisText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="interpretation-box">
      <div className="interpretation-header">
        <h4 className="interpretation-title">{title}</h4>
        <div style={{ display: 'flex', gap: 8 }}>
          {banglaSummary && (
            <button
              type="button"
              className="admin-btn admin-btn-sm"
              onClick={() => setShowBn(v => !v)}
            >
              <Languages size={13} /> {showBn ? 'Hide Bangla' : 'Show Bangla'}
            </button>
          )}
          {thesisText && (
            <button
              type="button"
              className="admin-btn admin-btn-sm admin-btn-primary"
              onClick={handleCopy}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy Thesis Text'}
            </button>
          )}
        </div>
      </div>

      <div className="interpretation-grid">
        {whatItIs && (
          <div className="interpretation-item">
            <h5>What Is This Test?</h5>
            <p>{whatItIs}</p>
          </div>
        )}
        {whyUseIt && (
          <div className="interpretation-item">
            <h5>Why Do Researchers Use It?</h5>
            <p>{whyUseIt}</p>
          </div>
        )}
        {howCalculated && (
          <div className="interpretation-item">
            <h5>How Is It Calculated?</h5>
            <p>{howCalculated}</p>
          </div>
        )}
        {highVsLow && (
          <div className="interpretation-item">
            <h5>What High vs. Low Values Mean</h5>
            <p>{highVsLow}</p>
          </div>
        )}
        {howToInterpret && (
          <div className="interpretation-item" style={{ gridColumn: '1 / -1' }}>
            <h5>How to Interpret This Result</h5>
            <p>{howToInterpret}</p>
          </div>
        )}
        {thesisText && (
          <div className="interpretation-item" style={{ gridColumn: '1 / -1' }}>
            <h5>Ready-to-Use Thesis Paragraph</h5>
            <p
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 7,
                padding: '10px 12px',
              }}
            >
              {thesisText}
            </p>
          </div>
        )}
      </div>

      {showBn && banglaSummary && (
        <div className="interpretation-bn">
          <strong>সহজ বাংলা ব্যাখ্যা:</strong> {banglaSummary}
        </div>
      )}
    </div>
  );
}
