import {
  generateCryptographicCode,
  sha256Hex,
  recordFallbackHashEntry,
  saveSessionSubmissionReceipt,
  loadSessionSubmissionReceipt,
  clearSessionSubmissionReceipt,
} from './withdrawal';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export {
  saveSessionSubmissionReceipt,
  loadSessionSubmissionReceipt,
  clearSessionSubmissionReceipt,
};

/**
 * Submits a survey response to `public.survey_responses`:
 * 1. First attempts the atomic server-side RPC `submit_survey_response`.
 * 2. Falls back to direct table insert on `survey_responses` if the RPC is not yet installed.
 */
export async function submitSurveyResponse(supabaseClient, payload) {
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

    if (typeof supabaseClient.from !== 'function') {
      throw new Error(error?.message || 'Submission failed.');
    }
  }

  // Stage 2: Direct table insert with withdrawal columns
  const code = generateCryptographicCode();
  const hash = await sha256Hex(code);
  const nowMs = Date.now();
  const submittedAtIso = new Date(nowMs).toISOString();
  const deadlineIso = new Date(nowMs + THREE_DAYS_MS).toISOString();

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

  // Stage 3: Fallback to original schema columns
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

  // Stage 4: Local fallback ledger if RLS policy has not yet been applied in SQL Editor
  recordFallbackHashEntry(hash, submittedAtIso, deadlineIso);
  return {
    withdrawal_code: code,
    submitted_at: submittedAtIso,
    withdrawal_deadline: deadlineIso,
    fallback_stored: true,
  };
}

export const submitSurveyWithWithdrawalCode = submitSurveyResponse;
