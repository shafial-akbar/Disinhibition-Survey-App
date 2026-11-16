import React from 'react';
import { RotateCcw } from 'lucide-react';
import PageTitle from '../../../components/common/PageTitle';
import AdminCard from '../../../components/admin/AdminCard';
import { QUESTIONNAIRE_CONFIG } from '../../../config/questionnaireConfig';

export default function AnalysisSettings({ analysis }) {
  const { settings, updateSettings, resetSettings } = analysis;

  return (
    <>
      <PageTitle
        title="Statistical Analysis Settings"
        subtitle="Configure missing-data rules, correlation deletion, primary hypothesis test, alpha level, and bilingual explanations. All calculations update immediately."
        actions={
          <button type="button" className="admin-btn" onClick={resetSettings}>
            <RotateCcw size={14} /> Reset Defaults
          </button>
        }
      />

      <AdminCard title="Analytical Parameters">
        <div className="analysis-grid-2">
          <div className="admin-form-group">
            <label htmlFor="setting-missing">Missing Data Rule (Construct Scoring)</label>
            <select
              id="setting-missing"
              className="admin-select"
              value={settings.missingDataRule}
              onChange={e => updateSettings({ missingDataRule: e.target.value })}
            >
              <option value="complete_construct">Strict Complete Construct (0 missing items allowed per scale)</option>
              <option value="allow_partial_80">Allow &ge; 80% Answered Items (pro-rated mean)</option>
            </select>
          </div>

          <div className="admin-form-group">
            <label htmlFor="setting-deletion">Correlation Missing-Data Deletion</label>
            <select
              id="setting-deletion"
              className="admin-select"
              value={settings.correlationDeletion}
              onChange={e => updateSettings({ correlationDeletion: e.target.value })}
            >
              <option value="pairwise">Pairwise Deletion (recommended when complete cases differ)</option>
              <option value="listwise">Listwise Deletion (identical n across all 3 constructs)</option>
            </select>
          </div>

          <div className="admin-form-group">
            <label htmlFor="setting-method">Primary Confirmatory Hypothesis Test (H1–H3)</label>
            <select
              id="setting-method"
              className="admin-select"
              value={settings.primaryHypothesisMethod}
              onChange={e => updateSettings({ primaryHypothesisMethod: e.target.value })}
            >
              <option value="pearson">Pearson&apos;s r (Parametric, two-tailed)</option>
              <option value="spearman">Spearman&apos;s ρ (Non-parametric rank, two-tailed)</option>
            </select>
          </div>

          <div className="admin-form-group">
            <label htmlFor="setting-alpha">Significance Threshold (α)</label>
            <select
              id="setting-alpha"
              className="admin-select"
              value={String(settings.alphaLevel)}
              onChange={e => updateSettings({ alphaLevel: Number(e.target.value) })}
            >
              <option value="0.05">α = 0.05 (Standard Psychology Threshold)</option>
              <option value="0.01">α = 0.01 (Strict Threshold)</option>
            </select>
          </div>

          <div className="admin-form-group">
            <label htmlFor="setting-decimals">Decimal Precision (Descriptive Tables)</label>
            <select
              id="setting-decimals"
              className="admin-select"
              value={String(settings.decimals)}
              onChange={e => updateSettings({ decimals: Number(e.target.value) })}
            >
              <option value="2">2 Decimal Places (APA standard for Means/SDs)</option>
              <option value="3">3 Decimal Places</option>
            </select>
          </div>

          <div className="admin-form-group">
            <label htmlFor="setting-version">Questionnaire Version Guard</label>
            <select
              id="setting-version"
              className="admin-select"
              value={settings.includeOnlyCurrentVersion ? 'current' : 'all'}
              onChange={e => updateSettings({ includeOnlyCurrentVersion: e.target.value === 'current' })}
            >
              <option value="current">Analyze Current Version Only ({QUESTIONNAIRE_CONFIG.version})</option>
              <option value="all">Include All Versions (not recommended if item count differs)</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={Boolean(settings.showBanglaExplanations)}
              onChange={e => updateSettings({ showBanglaExplanations: e.target.checked })}
            />
            Show simple Bangla explanations alongside English interpretations
          </label>
        </div>
      </AdminCard>
    </>
  );
}
