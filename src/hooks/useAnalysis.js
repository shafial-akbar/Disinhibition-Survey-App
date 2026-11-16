import { useState, useMemo, useCallback } from 'react';
import { DEFAULT_ANALYSIS_SETTINGS } from '../config/analysisConfig';
import { QUESTIONNAIRE_CONFIG } from '../config/questionnaireConfig';
import { runDataCleaningAudit } from '../services/analysis/dataCleaningService';
import { runScoringAnalysis } from '../services/analysis/scoringService';
import { runDescriptiveAnalysis } from '../services/analysis/descriptiveService';
import { runReliabilityAnalysis } from '../services/analysis/reliabilityService';
import { runNormalityAnalysis } from '../services/analysis/normalityService';
import { runCorrelationAnalysis } from '../services/analysis/correlationService';
import { runHypothesisAndExploratoryAnalysis } from '../services/analysis/hypothesisService';
import { generateChapter4Report } from '../services/analysis/chapter4Service';

const SETTINGS_STORAGE_KEY = 'research_analysis_settings_v1';

function loadStoredSettings() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_ANALYSIS_SETTINGS;
  }
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_ANALYSIS_SETTINGS;
    return { ...DEFAULT_ANALYSIS_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_ANALYSIS_SETTINGS;
  }
}

export function useAnalysis({
  rawRows = [],
  filteredRawRows = [],
  exclusionsMap = {},
  isFiltered = false,
  fetchedAt = null,
}) {
  const [settings, setSettings] = useState(() => loadStoredSettings());

  const updateSettings = useCallback(patch => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
        }
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_ANALYSIS_SETTINGS);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(
          SETTINGS_STORAGE_KEY,
          JSON.stringify(DEFAULT_ANALYSIS_SETTINGS)
        );
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  return useMemo(() => {
    const fullCleaning = runDataCleaningAudit(rawRows, exclusionsMap, settings);
    const cleaning = isFiltered
      ? runDataCleaningAudit(filteredRawRows, exclusionsMap, settings)
      : fullCleaning;

    const scoring = runScoringAnalysis(cleaning.validRows, settings);
    const descriptive = runDescriptiveAnalysis(cleaning.validRows, scoring.scoredRows);
    const reliability = runReliabilityAnalysis(cleaning.validRows);
    const normality = runNormalityAnalysis(scoring.scoredRows);
    const correlation = runCorrelationAnalysis(scoring.scoredRows, settings);
    const hypothesesResult = runHypothesisAndExploratoryAnalysis(
      scoring.scoredRows,
      cleaning.validRows,
      correlation,
      settings
    );

    const snapshotMeta = {
      analyzedAt: fetchedAt || new Date().toISOString(),
      version: QUESTIONNAIRE_CONFIG.version,
      isFiltered,
      totalRetrieved: cleaning.totalSubmitted,
      fullDatasetTotal: fullCleaning.totalSubmitted,
      validN: cleaning.validCount,
      excludedN: cleaning.excludedCount,
      missingDataRule: settings.missingDataRule,
      correlationDeletion: settings.correlationDeletion,
      primaryHypothesisMethod: settings.primaryHypothesisMethod,
      alphaLevel: settings.alphaLevel,
    };

    const chapter4 = generateChapter4Report({
      cleaning,
      scoring,
      descriptive,
      reliability,
      normality,
      correlation,
      hypothesesResult,
      snapshotMeta,
    });

    return {
      settings,
      updateSettings,
      resetSettings,
      fullCleaning,
      cleaning,
      scoring,
      descriptive,
      reliability,
      normality,
      correlation,
      hypothesesResult,
      chapter4,
      snapshotMeta,
    };
  }, [rawRows, filteredRawRows, exclusionsMap, isFiltered, fetchedAt, settings, updateSettings, resetSettings]);
}
