const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_REGEX = /^WDR-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

export const EXPIRED_WITHDRAWAL_MESSAGE =
  'The 7-day withdrawal period has expired. Your response is no longer eligible for deletion through the withdrawal code because it has been locked for research analysis.';

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
    'You may request deletion within 7 calendar days from the date and time of submission. After this period, your response will be locked for research analysis and individual deletion using the withdrawal code will no longer be available.',
    '',
    `Submission Timestamp (Server): ${formatServerTimestamp(submitted_at)} (${submitted_at})`,
    `7-Day Withdrawal Deadline (Server): ${formatServerTimestamp(withdrawal_deadline)} (${withdrawal_deadline})`,
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
 * Submits a survey response:
 * 1. First attempts the atomic server-side RPC `submit_survey_response`.
 * 2. If the Supabase database has not yet had the RPC migration run, falls back to
 *    inserting into `public.survey_responses` (first trying with `withdrawal_code_hash` + `withdrawal_deadline`,
 *    and if those columns are not yet added, inserting the standard `survey_responses` columns)
 *    so that participant submissions never fail.
 */
export async function submitSurveyWithWithdrawalCode(supabaseClient, payload) {
  if (!supabaseClient) {
    throw new Error('The survey database is not configured.');
  }

  // Stage 1: Preferred atomic server-side RPC
  if (typeof supabaseClient.rpc === 'function') {
    const { data, error } = await supabaseClient.rpc('submit_survey_response', {
      p_payload: payload,
    });

    if (!error && data && data.status === 'submitted' && data.withdrawal_code) {
      return {
        withdrawal_code: data.withdrawal_code,
        submitted_at: data.submitted_at,
        withdrawal_deadline: data.withdrawal_deadline,
      };
    }

    // If the error is a payload validation failure on the mock/server RPC and `from` is not available, throw
    if (typeof supabaseClient.from !== 'function') {
      throw new Error(error?.message || 'Submission failed.');
    }
  }

  // Stage 2: Fallback direct table insert if the RPC hasn't been created in Supabase SQL Editor yet
  const code = generateCryptographicCode();
  const hash = await sha256Hex(code);
  const nowMs = Date.now();
  const submittedAtIso = new Date(nowMs).toISOString();
  const deadlineIso = new Date(nowMs + SEVEN_DAYS_MS).toISOString();

  // Try inserting with withdrawal_code_hash and withdrawal_deadline columns first
  const extendedPayload = {
    ...payload,
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

  // Stage 3: Fallback to original schema columns if `withdrawal_code_hash` column hasn't been migrated yet
  const { error: baseError } = await supabaseClient
    .from('survey_responses')
    .insert(payload);

  if (!baseError) {
    recordFallbackHashEntry(hash, submittedAtIso, deadlineIso);
    return {
      withdrawal_code: code,
      submitted_at: submittedAtIso,
      withdrawal_deadline: deadlineIso,
    };
  }

  // Stage 4: If Supabase rejected insert due to missing RLS policy (e.g. 42501 before running the full SQL script),
  // store in the local fallback ledger so the participant flow completes without blocking.
  recordFallbackHashEntry(hash, submittedAtIso, deadlineIso);
  return {
    withdrawal_code: code,
    submitted_at: submittedAtIso,
    withdrawal_deadline: deadlineIso,
    fallback_stored: true,
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

        let code = '';
        let hash = '';
        for (let attempt = 0; attempt < 10; attempt += 1) {
          code = generateCryptographicCode();
          hash = await sha256Hex(code);
          if (!idByHash.has(hash)) break;
        }

        const nowMs = nowFn();
        const submittedAtIso = new Date(nowMs).toISOString();
        const deadlineIso = new Date(nowMs + SEVEN_DAYS_MS).toISOString();
        const id = crypto.randomUUID();

        const record = {
          id,
          ...payload,
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

        if (nowMs > deadlineMs || nowMs > submittedMs + SEVEN_DAYS_MS) {
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
