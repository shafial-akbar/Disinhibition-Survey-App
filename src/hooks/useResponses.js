import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  fetchAllSurveyResponses,
  loadLocalExclusions,
  saveLocalExclusion,
} from '../services/supabase/responseService';

export const INITIAL_RESPONSE_FILTERS = {
  search: '',
  dateFrom: '',
  dateTo: '',
  age_group: 'all',
  gender: 'all',
  education: 'all',
  occupation: 'all',
  primary_ai_tool: 'all',
  ai_frequency: 'all',
  ai_duration: 'all',
  status: 'all',
};

export function useResponses() {
  const [rawRows, setRawRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsAdminSql, setNeedsAdminSql] = useState(false);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [exclusionsMap, setExclusionsMap] = useState(() => loadLocalExclusions());
  const [filters, setFilters] = useState(INITIAL_RESPONSE_FILTERS);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchAllSurveyResponses();
    setRawRows(res.rows || []);
    setError(res.error || null);
    setNeedsAdminSql(Boolean(res.needsAdminSql));
    setFetchedAt(res.fetchedAt || new Date().toISOString());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleExclusion = useCallback((responseId, excluded, reason = '') => {
    const updated = saveLocalExclusion(responseId, excluded, reason);
    setExclusionsMap({ ...updated });
  }, []);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_RESPONSE_FILTERS);
  }, []);

  const isFiltered = useMemo(() => {
    return Object.entries(filters).some(([k, v]) =>
      k === 'search' || k === 'dateFrom' || k === 'dateTo' ? Boolean(String(v).trim()) : v !== 'all'
    );
  }, [filters]);

  const filterOptions = useMemo(() => {
    const collect = field =>
      Array.from(new Set(rawRows.map(r => r?.[field]).filter(Boolean))).sort();
    return {
      age_group: collect('age_group'),
      gender: collect('gender'),
      education: collect('education'),
      occupation: collect('occupation'),
      primary_ai_tool: collect('primary_ai_tool'),
      ai_frequency: collect('ai_frequency'),
      ai_duration: collect('ai_duration'),
    };
  }, [rawRows]);

  const filteredRawRows = useMemo(() => {
    const nowMs = Date.now();
    const q = String(filters.search || '').trim().toLowerCase();
    const fromMs = filters.dateFrom ? Date.parse(`${filters.dateFrom}T00:00:00Z`) : null;
    const toMs = filters.dateTo ? Date.parse(`${filters.dateTo}T23:59:59Z`) : null;

    return rawRows.filter(row => {
      if (q) {
        const hay = `${row.id || ''} ${row.age_group || ''} ${row.gender || ''} ${row.education || ''} ${row.occupation || ''} ${row.primary_ai_tool || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (fromMs || toMs) {
        const subMs = row.submitted_at ? Date.parse(row.submitted_at) : NaN;
        if (Number.isNaN(subMs)) return false;
        if (fromMs && subMs < fromMs) return false;
        if (toMs && subMs > toMs) return false;
      }

      const matchFields = [
        'age_group',
        'gender',
        'education',
        'occupation',
        'primary_ai_tool',
        'ai_frequency',
        'ai_duration',
      ];
      for (const f of matchFields) {
        if (filters[f] !== 'all' && row[f] !== filters[f]) {
          return false;
        }
      }

      if (filters.status !== 'all') {
        const isExcluded = Boolean(exclusionsMap[row.id]?.excluded);
        const deadMs = row.withdrawal_deadline ? Date.parse(row.withdrawal_deadline) : NaN;
        const isLocked = Boolean(row.locked_for_analysis) || (Number.isFinite(deadMs) && nowMs > deadMs);

        if (filters.status === 'excluded' && !isExcluded) return false;
        if (filters.status === 'included' && isExcluded) return false;
        if (filters.status === 'locked' && !isLocked) return false;
        if (filters.status === 'pending' && isLocked) return false;
      }

      return true;
    });
  }, [rawRows, filters, exclusionsMap]);

  return {
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
  };
}
