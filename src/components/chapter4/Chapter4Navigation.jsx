import React from 'react';

const NAV_SECTIONS = [
  { id: 'section-4-1', code: '4.1', label: 'Introduction and Data Screening' },
  { id: 'section-4-2', code: '4.2', label: 'Demographic Characteristics' },
  { id: 'section-4-3', code: '4.3', label: 'Conversational AI Usage Characteristics' },
  { id: 'section-4-4', code: '4.4', label: 'Descriptive Statistics of Study Variables' },
  { id: 'section-4-5', code: '4.5', label: 'Reliability and Normality Analysis' },
  { id: 'section-4-6', code: '4.6', label: 'Correlation Analysis' },
  { id: 'section-4-7', code: '4.7', label: 'Hypothesis Testing' },
  { id: 'section-4-8', code: '4.8', label: 'Summary of Findings' },
];

/**
 * Sticky Internal Section Navigation for Chapter 4 Sections.
 */
export default function Chapter4Navigation({ activeSection = '4.1', onSelectSection }) {
  const handleJump = sec => {
    if (onSelectSection) onSelectSection(sec.code);
    const el = document.getElementById(sec.id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="chapter4-section-nav no-print" aria-label="Chapter 4 Section Navigation">
      {NAV_SECTIONS.map(sec => (
        <button
          key={sec.code}
          type="button"
          className={`chapter4-nav-btn ${activeSection === sec.code ? 'active' : ''}`}
          onClick={() => handleJump(sec)}
        >
          {sec.label}
        </button>
      ))}
    </nav>
  );
}
