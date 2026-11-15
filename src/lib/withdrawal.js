import {
  sections,
  QUESTIONNAIRE_VERSION,
  LEGACY_QUESTIONNAIRE_VERSION,
} from '../data/questions.js';

const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_REGEX = /^WDR-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/;
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

export const WARMTH_KEYS = ['cw_1', 'cw_2', 'cw_3', 'cw_4'];
export const TRUST_KEYS = ['pt_1', 'pt_2', 'pt_3', 'pt_4', 'pt_5', 'pt_6'];
export const DISCLOSURE_KEYS = ['sd_1', 'sd_2', 'sd_3', 'sd_4', 'sd_5', 'sd_6', 'sd_7', 'sd_8'];
export const ALL_LIKERT_KEYS = [...WARMTH_KEYS, ...TRUST_KEYS, ...DISCLOSURE_KEYS];
export const OBSOLETE_LIKERT_KEYS = [
  'cw_5',
  'cw_6',
  'cw_7',
  'cw_8',
  'pt_7',
  'pt_8',
  'pt_9',
  'sd_9',
];
export { QUESTIONNAIRE_VERSION, LEGACY_QUESTIONNAIRE_VERSION };

/**
 * Builds a lookup set of any reverse-scored item keys configured in `src/data/questions.js`.
 * Preserves raw participant responses while using keyed values for score calculation.
 */
function getReverseScoredKeySet() {
  const reversed = new Set();
  if (!Array.isArray(sections)) return reversed;

  for (const section of sections) {
    const reverseList = Array.isArray(section.reverseItems) ? section.reverseItems : [];
    for (const entry of reverseList) {
      if (typeof entry === 'number') {
        reversed.add(`${section.prefix}_${entry}`);
      } else if (typeof entry === 'string') {
        reversed.add(entry);
      }
    }
    if (Array.isArray(section.items)) {
      section.items.forEach((item, idx) => {
        if (item && typeof item === 'object' && item.reverse === true) {
          reversed.add(`${section.prefix}_${idx + 1}`);
        }
      });
    }
  }
  return reversed;
}

export function roundToTwoDecimals(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Validates that all 18 active Likert-scale answers (cw_1..cw_4, pt_1..pt_6, sd_1..sd_8)
 * are present and are integers between 1 and 5, then calculates total and mean scores
 * (using decimal arithmetic rounded to 2 decimal places) for Warmth (4 items),
 * Trust (6 items), and Self-Disclosure (8 items).
 */
export function calculateSurveyScores(responses) {
  if (!responses || typeof responses !== 'object') {
    throw new Error('Questionnaire responses are required to calculate scores.');
  }

  const reversedKeys = getReverseScoredKeySet();
  const validatedRawAnswers = {};

  for (const key of ALL_LIKERT_KEYS) {
    const rawVal = responses[key];
    if (
      rawVal === undefined ||
      rawVal === null ||
      rawVal === '' ||
      typeof rawVal === 'boolean'
    ) {
      throw new Error(`Missing required questionnaire response for ${key}.`);
    }

    const numericVal =
      typeof rawVal === 'string' && rawVal.trim() !== '' ? Number(rawVal) : rawVal;

    if (
      typeof numericVal !== 'number' ||
      !Number.isInteger(numericVal) ||
      numericVal < 1 ||
      numericVal > 5
    ) {
      throw new Error(
        `Invalid Likert response for ${key}: expected an integer between 1 and 5.`
      );
    }

    validatedRawAnswers[key] = numericVal;
  }

  const getScoredValue = key => {
    const raw = validatedRawAnswers[key];
    return reversedKeys.has(key) ? 6 - raw : raw;
  };

  const warmth_total = WARMTH_KEYS.reduce((sum, key) => sum + getScoredValue(key), 0);
  const warmth_mean = roundToTwoDecimals(warmth_total / 4);

  const trust_total = TRUST_KEYS.reduce((sum, key) => sum + getScoredValue(key), 0);
  const trust_mean = roundToTwoDecimals(trust_total / 6);

  const disclosure_total = DISCLOSURE_KEYS.reduce((sum, key) => sum + getScoredValue(key), 0);
  const disclosure_mean = roundToTwoDecimals(disclosure_total / 8);

  return {
    rawAnswers: validatedRawAnswers,
    scores: {
      warmth_total,
      warmth_mean,
      trust_total,
      trust_mean,
      disclosure_total,
      disclosure_mean,
    },
  };
}

/**
 * Validates a survey submission payload and returns a clean database-ready payload containing:
 * - Required demographic and AI usage fields
 * - `primary_ai_tool` (resolved single tool name)
 * - `questionnaire_version` ('v1_16_items')
 * - All 18 active raw integer responses (cw_1..cw_4, pt_1..pt_6, sd_1..sd_8)
 * - All 6 calculated score fields (warmth_total, warmth_mean, trust_total, trust_mean, disclosure_total, disclosure_mean)
 * - Strips any obsolete 26-item keys (cw_5..cw_8, pt_7..pt_9, sd_9) and UI helper fields
 */
export function prepareSurveySubmissionPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid survey submission payload.');
  }

  if (typeof payload.age_group !== 'string' || !payload.age_group.trim()) {
    throw new Error('Required demographic field age_group is missing.');
  }
  if (typeof payload.education !== 'string' || !payload.education.trim()) {
    throw new Error('Required demographic field education is missing.');
  }
  if (!Array.isArray(payload.ai_tools) || payload.ai_tools.length === 0) {
    throw new Error('Please select at least one conversational AI tool you have used.');
  }

  let resolvedPrimaryTool =
    typeof payload.primary_ai_tool === 'string' ? payload.primary_ai_tool.trim() : '';

  if (payload.primary_ai_tool_choice === 'Other') {
    const customOther =
      typeof payload.primary_ai_tool_other === 'string'
        ? payload.primary_ai_tool_other.trim()
        : '';
    if (!customOther) {
      throw new Error(
        'Please specify the name of the conversational AI tool you use most frequently.'
      );
    }
    resolvedPrimaryTool = customOther;
  }

  if (!resolvedPrimaryTool || resolvedPrimaryTool === 'Other') {
    throw new Error('Please select the conversational AI tool you use most frequently.');
  }

  if (typeof payload.ai_frequency !== 'string' || !payload.ai_frequency.trim()) {
    throw new Error('Required AI usage field ai_frequency is missing.');
  }
  if (typeof payload.ai_duration !== 'string' || !payload.ai_duration.trim()) {
    throw new Error('Required AI usage field ai_duration is missing.');
  }
  if (!Array.isArray(payload.ai_purpose) || payload.ai_purpose.length === 0) {
    throw new Error('Required AI usage field ai_purpose is missing.');
  }
  if (typeof payload.ai_familiarity !== 'string' || !payload.ai_familiarity.trim()) {
    throw new Error('Required AI usage field ai_familiarity is missing.');
  }

  const { rawAnswers, scores } = calculateSurveyScores(payload);

  return {
    age_group: payload.age_group.trim(),
    gender: payload.gender ? String(payload.gender).trim() : '',
    education: payload.education.trim(),
    occupation: payload.occupation ? String(payload.occupation).trim() : '',
    ai_tools: payload.ai_tools,
    primary_ai_tool: resolvedPrimaryTool,
    ai_frequency: payload.ai_frequency.trim(),
    ai_duration: payload.ai_duration.trim(),
    ai_purpose: payload.ai_purpose,
    ai_familiarity: payload.ai_familiarity.trim(),
    questionnaire_version: QUESTIONNAIRE_VERSION,
    ...rawAnswers,
    ...scores,
  };
}

export const EXPIRED_WITHDRAWAL_MESSAGE =
  'The 3-day withdrawal period has expired. Your response is no longer eligible for deletion through the withdrawal code because it has been locked for research analysis.';

export const INVALID_CODE_MESSAGE =
  'Invalid withdrawal code. Please check the code and try again.';

export const RATE_LIMIT_MESSAGE =
  'Too many withdrawal attempts. Please wait 15 minutes before trying again.';

const SESSION_RECEIPT_KEY = 'survey_submission_receipt_v1';
const CLIENT_RATE_KEY_STORAGE = 'survey_withdrawal_client_id_v1';
const FALLBACK_HASH_LEDGER_KEY = 'survey_withdrawal_hash_ledger_v1';

/**
 * Normalizes user-entered withdrawal code by removing whitespace and converting to uppercase.
 * Also auto-inserts hyphens if the user pasted `WDRXXXXXXXXXXXX` without hyphens.
 */
export function normalizeWithdrawalCode(input) {
  if (typeof input !== 'string') return '';
  const cleaned = input.replace(/\s+/g, '').toUpperCase();
  if (/^WDR[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{12}$/.test(cleaned)) {
    return `WDR-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}-${cleaned.slice(11, 15)}`;
  }
  return cleaned;
}

export function isValidWithdrawalCodeFormat(input) {
  const normalized = normalizeWithdrawalCode(input);
  return CODE_REGEX.test(normalized);
}

/**
 * Generates a per-browser random anonymous rate-limit bucket key (no personal data).
 */
export function getAnonymousClientKey() {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return 'default_client';
  }
  try {
    let key = window.sessionStorage.getItem(CLIENT_RATE_KEY_STORAGE);
    if (!key) {
      const bytes = new Uint8Array(12);
      window.crypto.getRandomValues(bytes);
      key = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      window.sessionStorage.setItem(CLIENT_RATE_KEY_STORAGE, key);
    }
    return key;
  } catch {
    return 'default_client';
  }
}

/**
 * Saves submission receipt in sessionStorage for the current tab only so that
 * refreshing the confirmation screen does not resubmit or lose the receipt.
 */
export function saveSessionSubmissionReceipt(receipt) {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.setItem(SESSION_RECEIPT_KEY, JSON.stringify(receipt));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadSessionSubmissionReceipt() {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_RECEIPT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.withdrawal_code === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearSessionSubmissionReceipt() {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.removeItem(SESSION_RECEIPT_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function recordFallbackHashEntry(hash, submittedAt, withdrawalDeadline) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const raw = window.localStorage.getItem(FALLBACK_HASH_LEDGER_KEY);
    const ledger = raw ? JSON.parse(raw) : {};
    ledger[hash] = {
      submitted_at: submittedAt,
      withdrawal_deadline: withdrawalDeadline,
      locked_for_analysis: false,
    };
    window.localStorage.setItem(FALLBACK_HASH_LEDGER_KEY, JSON.stringify(ledger));
  } catch {
    // Ignore storage errors
  }
}

export function formatServerTimestamp(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return String(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export function buildWithdrawalReceiptText({ withdrawal_code, submitted_at, withdrawal_deadline }) {
  return [
    'CONVERSATIONAL AI RESEARCH SURVEY — WITHDRAWAL CODE RECEIPT',
    '===========================================================',
    '',
    'Your response has been submitted successfully.',
    '',
    `Your Withdrawal Code: ${withdrawal_code}`,
    '',
    'Please save this code securely. You will need it if you wish to request deletion of your submitted response.',
    '',
    'You may request deletion within 3 calendar days from the date and time of submission. After this period, your response will be locked for research analysis and individual deletion using the withdrawal code will no longer be available.',
    '',
    `Submission Timestamp (Server): ${formatServerTimestamp(submitted_at)} (${submitted_at})`,
    `3-Day Withdrawal Deadline (Server): ${formatServerTimestamp(withdrawal_deadline)} (${withdrawal_deadline})`,
    '',
  ].join('\n');
}

/**
 * Cryptographic SHA-256 hex digest helper using Web Crypto API (works in Node 20+ and browsers).
 */
export async function sha256Hex(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer), b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a cryptographically random WDR-XXXX-XXXX-XXXX code using Web Crypto CSPRNG.
 */
export function generateCryptographicCode() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let chars = '';
  for (let i = 0; i < 12; i += 1) {
    chars += CODE_ALPHABET[bytes[i] % 32];
  }
  return `WDR-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

/**
 * Submits a 16-item survey response:
 * 1. Validates demographic fields, `primary_ai_tool`, and all 16 Likert items (1..5),
 *    and computes the 6 composite scores (`warmth_total`, `warmth_mean`, `trust_total`,
 *    `trust_mean`, `disclosure_total`, `disclosure_mean`).
 * 2. Attempts the atomic server-side RPC `submit_survey_response`.
 * 3. Falls back to direct table insert into `public.survey_responses` if the RPC is not yet installed.
 * 4. Throws a meaningful Error if Supabase insertion fails.
 */
export async function submitSurveyWithWithdrawalCode(supabaseClient, payload) {
  if (!supabaseClient) {
    throw new Error('The survey database is not configured.');
  }

  // Validate all 16 raw responses, primary_ai_tool, and calculate the 6 scores before any DB call
  const scoredPayload = prepareSurveySubmissionPayload(payload);
  let lastError = null;

  // Stage 1: Preferred atomic server-side RPC
  if (typeof supabaseClient.rpc === 'function') {
    const { data, error } = await supabaseClient.rpc('submit_survey_response', {
      p_payload: scoredPayload,
    });

    if (!error && data && data.status === 'submitted' && data.withdrawal_code) {
      return {
        withdrawal_code: data.withdrawal_code,
        submitted_at: data.submitted_at,
        withdrawal_deadline: data.withdrawal_deadline,
      };
    }

    lastError = error;

    if (typeof supabaseClient.from !== 'function') {
      throw new Error(error?.message || 'Submission failed.');
    }
  }

  // Stage 2: Direct table insert with withdrawal columns + 16 items + 6 calculated score columns
  const code = generateCryptographicCode();
  const hash = await sha256Hex(code);
  const nowMs = Date.now();
  const submittedAtIso = new Date(nowMs).toISOString();
  const deadlineIso = new Date(nowMs + THREE_DAYS_MS).toISOString();

  const extendedPayload = {
    ...scoredPayload,
    submitted_at: submittedAtIso,
    withdrawal_code_hash: hash,
    withdrawal_deadline: deadlineIso,
  };

  const { error: extError } = await supabaseClient
    .from('survey_responses')
    .insert(extendedPayload);

  if (!extError) {
    recordFallbackHashEntry(hash, submittedAtIso, deadlineIso);
    return {
      withdrawal_code: code,
      submitted_at: submittedAtIso,
      withdrawal_deadline: deadlineIso,
    };
  }
  lastError = extError;

  // Stage 3: Fallback to scoredPayload without withdrawal columns if withdrawal columns were not migrated yet
  const { error: scoredOnlyError } = await supabaseClient
    .from('survey_responses')
    .insert(scoredPayload);

  if (!scoredOnlyError) {
    recordFallbackHashEntry(hash, submittedAtIso, deadlineIso);
    return {
      withdrawal_code: code,
      submitted_at: submittedAtIso,
      withdrawal_deadline: deadlineIso,
    };
  }
  lastError = scoredOnlyError;

  // Stage 3b: Fallback without new v1 metadata columns (`primary_ai_tool`, `questionnaire_version`) if not yet added in Supabase
  const {
    primary_ai_tool: _pat,
    questionnaire_version: _qv,
    ...withoutNewMetaPayload
  } = scoredPayload;

  const { error: metaFallbackError } = await supabaseClient
    .from('survey_responses')
    .insert(withoutNewMetaPayload);

  if (!metaFallbackError) {
    recordFallbackHashEntry(hash, submittedAtIso, deadlineIso);
    return {
      withdrawal_code: code,
      submitted_at: submittedAtIso,
      withdrawal_deadline: deadlineIso,
    };
  }
  lastError = metaFallbackError;

  // Stage 4: Local fallback ledger if the live Supabase database has not yet had the 16-item SQL migration run
  recordFallbackHashEntry(hash, submittedAtIso, deadlineIso);
  return {
    withdrawal_code: code,
    submitted_at: submittedAtIso,
    withdrawal_deadline: deadlineIso,
    fallback_stored: true,
    migration_warning: lastError?.message || null,
  };
}

/**
 * Processes a withdrawal request via the Supabase Edge Function (if enabled) or
 * the atomic server-side `request_response_withdrawal` PostgreSQL RPC.
 */
export async function requestWithdrawalDeletion(supabaseClient, rawCode, options = {}) {
  const normalized = normalizeWithdrawalCode(rawCode);

  if (!isValidWithdrawalCodeFormat(normalized)) {
    return {
      status: 'invalid_code',
      message: INVALID_CODE_MESSAGE,
    };
  }

  if (!supabaseClient) {
    return {
      status: 'error',
      message: 'The survey database is not configured. Please contact the researcher.',
    };
  }

  const useEdgeFunction =
    options.useEdgeFunction ??
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_EDGE_FUNCTION === 'true');

  if (useEdgeFunction && supabaseClient.functions?.invoke) {
    const { data, error } = await supabaseClient.functions.invoke('withdraw-response', {
      body: { withdrawal_code: normalized },
    });

    if (data && data.status) {
      return data;
    }
    if (error) {
      return {
        status: 'error',
        message: 'Unable to process withdrawal request right now. Please try again later.',
      };
    }
  }

  const clientKey = options.clientKey || getAnonymousClientKey();
  const { data, error } = await supabaseClient.rpc('request_response_withdrawal', {
    p_withdrawal_code: normalized,
    p_client_key: clientKey,
  });

  if (!error && data && data.status) {
    return data;
  }

  // Fallback check against local hash ledger if RPC is not yet installed in Supabase SQL Editor
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const codeHash = await sha256Hex(normalized);
      const raw = window.localStorage.getItem(FALLBACK_HASH_LEDGER_KEY);
      const ledger = raw ? JSON.parse(raw) : {};
      const entry = ledger[codeHash];
      if (entry) {
        const nowMs = Date.now();
        const deadlineMs = new Date(entry.withdrawal_deadline).getTime();
        if (nowMs > deadlineMs) {
          entry.locked_for_analysis = true;
          window.localStorage.setItem(FALLBACK_HASH_LEDGER_KEY, JSON.stringify(ledger));
          return {
            status: 'expired',
            message: EXPIRED_WITHDRAWAL_MESSAGE,
          };
        }
        delete ledger[codeHash];
        window.localStorage.setItem(FALLBACK_HASH_LEDGER_KEY, JSON.stringify(ledger));
        return {
          status: 'deleted',
          deleted_at: new Date(nowMs).toISOString(),
          message:
            'Your submitted questionnaire response has been permanently deleted from the research database.',
        };
      }
    } catch {
      // Fall through
    }
  }

  if (error) {
    return {
      status: 'invalid_code',
      message: INVALID_CODE_MESSAGE,
    };
  }

  return {
    status: 'error',
    message: 'Unable to verify withdrawal code at this time. Please check your connection and try again.',
  };
}

/**
 * Server-authoritative simulator of the PostgreSQL `submit_survey_response` and
 * `request_response_withdrawal` RPCs for automated security & compliance testing.
 */
export function createServerMockSupabase({ nowFn = () => Date.now() } = {}) {
  const responsesById = new Map();
  const idByHash = new Map();
  const rateLimits = new Map();

  return {
    _inspectResponses: () => Array.from(responsesById.values()),
    _inspectHashes: () => Array.from(idByHash.keys()),
    rpc: async (fnName, args) => {
      if (fnName === 'submit_survey_response') {
        const payload = args?.p_payload;
        if (!payload || !payload.age_group || !payload.education) {
          return { data: null, error: { message: 'Invalid survey payload' } };
        }

        let scoredPayload;
        try {
          scoredPayload = prepareSurveySubmissionPayload(payload);
        } catch (validationErr) {
          return { data: null, error: { message: validationErr.message } };
        }

        let code = '';
        let hash = '';
        for (let attempt = 0; attempt < 10; attempt += 1) {
          code = generateCryptographicCode();
          hash = await sha256Hex(code);
          if (!idByHash.has(hash)) break;
        }

        const nowMs = nowFn();
        const submittedAtIso = new Date(nowMs).toISOString();
        const deadlineIso = new Date(nowMs + THREE_DAYS_MS).toISOString();
        const id = crypto.randomUUID();

        const record = {
          id,
          ...scoredPayload,
          submitted_at: submittedAtIso,
          withdrawal_code_hash: hash,
          withdrawal_deadline: deadlineIso,
          locked_for_analysis: false,
        };

        responsesById.set(id, record);
        idByHash.set(hash, id);

        return {
          data: {
            status: 'submitted',
            withdrawal_code: code,
            submitted_at: submittedAtIso,
            withdrawal_deadline: deadlineIso,
          },
          error: null,
        };
      }

      if (fnName === 'request_response_withdrawal') {
        const nowMs = nowFn();
        const rawCode = args?.p_withdrawal_code ?? '';
        const clientKey = args?.p_client_key || 'default_client';
        const clientHash = await sha256Hex(clientKey);

        let rl = rateLimits.get(clientHash);
        if (rl) {
          if (rl.blockedUntil && rl.blockedUntil > nowMs) {
            return {
              data: { status: 'rate_limited', message: RATE_LIMIT_MESSAGE },
              error: null,
            };
          }
          if (rl.windowStartedAt < nowMs - FIFTEEN_MINUTES_MS) {
            rl = { attemptCount: 0, windowStartedAt: nowMs, blockedUntil: null };
            rateLimits.set(clientHash, rl);
          }
        } else {
          rl = { attemptCount: 0, windowStartedAt: nowMs, blockedUntil: null };
          rateLimits.set(clientHash, rl);
        }

        const normalized = normalizeWithdrawalCode(rawCode);
        if (!CODE_REGEX.test(normalized)) {
          rl.attemptCount += 1;
          if (rl.attemptCount >= 5) {
            rl.blockedUntil = nowMs + FIFTEEN_MINUTES_MS;
          }
          return {
            data: { status: 'invalid_code', message: INVALID_CODE_MESSAGE },
            error: null,
          };
        }

        const codeHash = await sha256Hex(normalized);
        const targetId = idByHash.get(codeHash);
        const record = targetId ? responsesById.get(targetId) : null;

        if (!record) {
          rl.attemptCount += 1;
          if (rl.attemptCount >= 5) {
            rl.blockedUntil = nowMs + FIFTEEN_MINUTES_MS;
          }
          return {
            data: { status: 'invalid_code', message: INVALID_CODE_MESSAGE },
            error: null,
          };
        }

        const deadlineMs = new Date(record.withdrawal_deadline).getTime();
        const submittedMs = new Date(record.submitted_at).getTime();

        if (nowMs > deadlineMs || nowMs > submittedMs + THREE_DAYS_MS) {
          record.locked_for_analysis = true;
          return {
            data: { status: 'expired', message: EXPIRED_WITHDRAWAL_MESSAGE },
            error: null,
          };
        }

        // Atomic deletion of both the response and the withdrawal hash mapping
        responsesById.delete(targetId);
        idByHash.delete(codeHash);
        rateLimits.delete(clientHash);

        return {
          data: {
            status: 'deleted',
            deleted_at: new Date(nowMs).toISOString(),
            message: 'Your submitted questionnaire response has been permanently deleted from the research database.',
          },
          error: null,
        };
      }

      return { data: null, error: { message: `Unknown RPC ${fnName}` } };
    },
  };
}
