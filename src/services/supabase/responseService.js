import { supabase, configured } from '../../lib/supabase.js';
import { QUESTIONNAIRE_CONFIG } from '../../config/questionnaireConfig.js';

/**
 * Explicit list of safe research columns to fetch from public.survey_responses.
 * NEVER includes withdrawal_code_hash or secret fields.
 */
export const SAFE_RESPONSE_COLUMNS = [
  'id',
  'age_group',
  'gender',
  'education',
  'occupation',
  'ai_tools',
  'primary_ai_tool',
  'ai_frequency',
  'ai_duration',
  'ai_purpose',
  'ai_familiarity',
  'questionnaire_version',
  ...QUESTIONNAIRE_CONFIG.allItemKeys,
  'warmth_total',
  'warmth_mean',
  'trust_total',
  'trust_mean',
  'disclosure_total',
  'disclosure_mean',
  'submitted_at',
  'withdrawal_deadline',
  'locked_for_analysis',
];

const EXCLUSION_STORAGE_KEY = 'research_admin_exclusions_v1';

/**
 * Strips any sensitive fields (such as withdrawal_code_hash) before exposing rows to UI.
 */
export function sanitizeResponseRecord(row) {
  if (!row || typeof row !== 'object') return null;
  const { withdrawal_code_hash: _removed, ...safeRow } = row;
  return safeRow;
}

export function loadLocalExclusions() {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(EXCLUSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalExclusion(responseId, excluded, reason = '') {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  const map = loadLocalExclusions();
  if (!excluded) {
    delete map[responseId];
  } else {
    map[responseId] = {
      response_id: responseId,
      excluded: true,
      exclusion_reason: String(reason || '').trim() || 'Excluded by researcher during data cleaning',
      updated_at: new Date().toISOString(),
    };
  }
  try {
    window.localStorage.setItem(EXCLUSION_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
  return map;
}

/**
 * Fetches all actual records from public.survey_responses.
 * Tries the dedicated security-definer RPC `admin_get_survey_responses` first
 * (which strips withdrawal_code_hash server-side while keeping anon SELECT revoked),
 * then falls back to direct safe-column SELECT if RLS allows it.
 */
export async function fetchAllSurveyResponses() {
  if (!configured || !supabase) {
    return {
      rows: [],
      error: 'Supabase is not configured. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      needsAdminSql: false,
      fetchedAt: new Date().toISOString(),
    };
  }

  // Stage 1: Preferred security-definer RPC
  const rpcRes = await supabase.rpc('admin_get_survey_responses');
  if (!rpcRes.error && Array.isArray(rpcRes.data)) {
    return {
      rows: rpcRes.data.map(sanitizeResponseRecord).filter(Boolean),
      error: null,
      needsAdminSql: false,
      fetchedAt: new Date().toISOString(),
    };
  }

  // Stage 2: Safe-column SELECT fallback (never requests withdrawal_code_hash)
  const selectRes = await supabase
    .from('survey_responses')
    .select(SAFE_RESPONSE_COLUMNS.join(','))
    .order('submitted_at', { ascending: false });

  if (!selectRes.error && Array.isArray(selectRes.data)) {
    return {
      rows: selectRes.data.map(sanitizeResponseRecord).filter(Boolean),
      error: null,
      needsAdminSql: false,
      fetchedAt: new Date().toISOString(),
    };
  }

  const rlsOrMissingRpc =
    rpcRes.error?.code === 'PGRST202' ||
    selectRes.error?.code === '42501' ||
    String(selectRes.error?.message || '').toLowerCase().includes('permission denied');

  return {
    rows: [],
    error:
      selectRes.error?.message ||
      rpcRes.error?.message ||
      'Unable to read responses from Supabase.',
    needsAdminSql: rlsOrMissingRpc,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Optional Supabase SQL snippet shown to the researcher if RLS currently blocks
 * reading public.survey_responses from the Admin Dashboard.
 */
export const ADMIN_READ_RPC_SQL = `-- Run once in Supabase SQL Editor to let the Admin Dashboard read survey responses safely
-- Keeps withdrawal_code_hash hidden and preserves anonymous participant write-only security.

create or replace function public.admin_get_survey_responses()
returns table (
  id uuid,
  age_group text,
  gender text,
  education text,
  occupation text,
  ai_tools jsonb,
  primary_ai_tool text,
  ai_frequency text,
  ai_duration text,
  ai_purpose jsonb,
  ai_familiarity text,
  questionnaire_version text,
  cw_1 smallint, cw_2 smallint, cw_3 smallint, cw_4 smallint,
  pt_1 smallint, pt_2 smallint, pt_3 smallint, pt_4 smallint, pt_5 smallint, pt_6 smallint,
  sd_1 smallint, sd_2 smallint, sd_3 smallint, sd_4 smallint, sd_5 smallint, sd_6 smallint, sd_7 smallint, sd_8 smallint,
  warmth_total numeric,
  warmth_mean numeric,
  trust_total numeric,
  trust_mean numeric,
  disclosure_total numeric,
  disclosure_mean numeric,
  submitted_at timestamptz,
  withdrawal_deadline timestamptz,
  locked_for_analysis boolean
)
language sql
security definer
set search_path = public, pg_catalog
as $$
  select
    id, age_group, gender, education, occupation,
    ai_tools, primary_ai_tool, ai_frequency, ai_duration, ai_purpose, ai_familiarity,
    questionnaire_version,
    cw_1, cw_2, cw_3, cw_4,
    pt_1, pt_2, pt_3, pt_4, pt_5, pt_6,
    sd_1, sd_2, sd_3, sd_4, sd_5, sd_6, sd_7, sd_8,
    warmth_total, warmth_mean,
    trust_total, trust_mean,
    disclosure_total, disclosure_mean,
    submitted_at, withdrawal_deadline, locked_for_analysis
  from public.survey_responses
  order by submitted_at desc;
$$;

grant execute on function public.admin_get_survey_responses() to anon, authenticated, service_role;`;
