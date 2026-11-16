import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminLoading from '../../components/admin/AdminLoading';
import AdminError from '../../components/admin/AdminError';
import { useResponses } from '../../hooks/useResponses';
import { useAnalysis } from '../../hooks/useAnalysis';

import DataOverview from './reports/DataOverview';
import AllResponses from './reports/AllResponses';
import RawDataReport from './reports/RawDataReport';
import DataCleaningReport from './reports/DataCleaningReport';
import DataQualityReport from './reports/DataQualityReport';
import DemographicReport from './reports/DemographicReport';
import AIUsageReport from './reports/AIUsageReport';
import ScoringAnalysis from './analysis/ScoringAnalysis';
import DescriptiveAnalysis from './analysis/DescriptiveAnalysis';
import ReliabilityAnalysis from './analysis/ReliabilityAnalysis';
import NormalityAnalysis from './analysis/NormalityAnalysis';
import CorrelationAnalysis from './analysis/CorrelationAnalysis';
import HypothesisTesting from './analysis/HypothesisTesting';
import Chapter4Analysis from './analysis/Chapter4Analysis';
import Chapter4Page from './thesis/Chapter4Page';
import ExportCenter from './reports/ExportCenter';
import AnalysisSettings from './settings/AnalysisSettings';
import AdminSettings from './settings/AdminSettings';

export default function AdminDashboard({ session, onLogout }) {
  const location = useLocation();
  const isThesisReportRoute = location.pathname.startsWith('/admin/thesis-report');

  const {
    rawRows,
    filteredRawRows,
    loading,
    error,
    needsAdminSql,
    fetchedAt,
    exclusionsMap,
    filters,
    filterOptions,
    isFiltered,
    refresh,
    toggleExclusion,
    updateFilter,
    resetFilters,
  } = useResponses();

  const analysis = useAnalysis({
    rawRows,
    filteredRawRows,
    exclusionsMap,
    isFiltered,
    fetchedAt,
  });

  const sharedProps = {
    rawRows,
    filteredRawRows,
    analysis,
    filters,
    filterOptions,
    isFiltered,
    onUpdateFilter: updateFilter,
    onResetFilters: resetFilters,
    onToggleExclusion: toggleExclusion,
    onRefresh: refresh,
    session,
  };

  return (
    <AdminLayout
      session={session}
      onLogout={onLogout}
      onRefresh={refresh}
      loading={loading}
      isFiltered={isFiltered}
      snapshotMeta={analysis.snapshotMeta}
    >
      {loading && rawRows.length === 0 ? (
        <AdminLoading />
      ) : error && rawRows.length === 0 ? (
        <AdminError error={error} needsAdminSql={needsAdminSql} onRetry={refresh} />
      ) : isThesisReportRoute ? (
        <Routes>
          <Route path="chapter-4" element={<Chapter4Page {...sharedProps} />} />
          <Route path="*" element={<Navigate to="/admin/thesis-report/chapter-4" replace />} />
        </Routes>
      ) : (
        <Routes>
          <Route index element={<DataOverview {...sharedProps} />} />
          <Route path="responses" element={<AllResponses {...sharedProps} />} />
          <Route path="raw-data" element={<RawDataReport {...sharedProps} />} />
          <Route path="cleaning" element={<DataCleaningReport {...sharedProps} />} />
          <Route path="quality" element={<DataQualityReport {...sharedProps} />} />
          <Route path="demographics" element={<DemographicReport {...sharedProps} />} />
          <Route path="ai-usage" element={<AIUsageReport {...sharedProps} />} />
          <Route path="scoring" element={<ScoringAnalysis {...sharedProps} />} />
          <Route path="descriptive" element={<DescriptiveAnalysis {...sharedProps} />} />
          <Route path="reliability" element={<ReliabilityAnalysis {...sharedProps} />} />
          <Route path="normality" element={<NormalityAnalysis {...sharedProps} />} />
          <Route path="correlation" element={<CorrelationAnalysis {...sharedProps} />} />
          <Route path="hypotheses" element={<HypothesisTesting {...sharedProps} />} />
          <Route path="chapter-4" element={<Chapter4Analysis {...sharedProps} />} />
          <Route path="thesis-report/chapter-4" element={<Chapter4Page {...sharedProps} />} />
          <Route path="export" element={<ExportCenter {...sharedProps} />} />
          <Route path="analysis-settings" element={<AnalysisSettings {...sharedProps} />} />
          <Route path="admin-settings" element={<AdminSettings {...sharedProps} />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      )}
    </AdminLayout>
  );
}
