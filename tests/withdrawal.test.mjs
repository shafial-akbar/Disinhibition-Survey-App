import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createServerMockSupabase,
  submitSurveyWithWithdrawalCode,
  requestWithdrawalDeletion,
  normalizeWithdrawalCode,
  isValidWithdrawalCodeFormat,
  buildWithdrawalReceiptText,
  sha256Hex,
  EXPIRED_WITHDRAWAL_MESSAGE,
  INVALID_CODE_MESSAGE,
  RATE_LIMIT_MESSAGE,
} from '../src/lib/withdrawal.js';

function createSamplePayload(overrides = {}) {
  const answers = {};
  for (let i = 1; i <= 8; i += 1) answers[`cw_${i}`] = 4;
  for (let i = 1; i <= 9; i += 1) answers[`pt_${i}`] = 5;
  for (let i = 1; i <= 9; i += 1) answers[`sd_${i}`] = 3;

  return {
    age_group: '18–24 years',
    gender: 'Female',
    education: 'Undergraduate',
    occupation: 'Student',
    ai_tools: ['ChatGPT', 'Google Gemini'],
    ai_frequency: 'Daily',
    ai_duration: '1–2 years',
    ai_purpose: ['Education and learning', 'Information searching'],
    ai_familiarity: 'Very familiar',
    ...answers,
    ...overrides,
  };
}

test('1. Successful submission generates one unique cryptographic withdrawal code and stores only its SHA-256 hash', async () => {
  const fixedNow = Date.parse('2026-11-11T12:00:00.000Z');
  const mockDb = createServerMockSupabase({ nowFn: () => fixedNow });

  const receipt = await submitSurveyWithWithdrawalCode(mockDb, createSamplePayload());

  assert.ok(isValidWithdrawalCodeFormat(receipt.withdrawal_code));
  assert.equal(receipt.submitted_at, '2026-11-11T12:00:00.000Z');
  assert.equal(receipt.withdrawal_deadline, '2026-11-14T12:00:00.000Z');

  const storedRows = mockDb._inspectResponses();
  assert.equal(storedRows.length, 1);

  const expectedHash = await sha256Hex(receipt.withdrawal_code);
  assert.equal(storedRows[0].withdrawal_code_hash, expectedHash);
  assert.equal(storedRows[0].withdrawal_code, undefined);
});

test('2. Multiple submissions generate unique unpredictable codes', async () => {
  const mockDb = createServerMockSupabase();
  const codes = new Set();

  for (let i = 0; i < 25; i += 1) {
    const res = await submitSurveyWithWithdrawalCode(mockDb, createSamplePayload());
    assert.ok(isValidWithdrawalCodeFormat(res.withdrawal_code));
    codes.add(res.withdrawal_code);
  }

  assert.equal(codes.size, 25);
  assert.equal(mockDb._inspectResponses().length, 25);
});

test('3. Receipt formatting and normalization work for Copy and Download actions', async () => {
  assert.equal(normalizeWithdrawalCode('  wdr-2345-abcd-efgh '), 'WDR-2345-ABCD-EFGH');
  assert.equal(normalizeWithdrawalCode('wdr2345abcdefgh'), 'WDR-2345-ABCD-EFGH');

  const text = buildWithdrawalReceiptText({
    withdrawal_code: 'WDR-2345-ABCD-EFGH',
    submitted_at: '2026-11-11T12:00:00.000Z',
    withdrawal_deadline: '2026-11-14T12:00:00.000Z',
  });

  assert.ok(text.includes('Your response has been submitted successfully.'));
  assert.ok(text.includes('Your Withdrawal Code: WDR-2345-ABCD-EFGH'));
  assert.ok(
    text.includes(
      'You may request deletion within 3 calendar days from the date and time of submission. After this period, your response will be locked for research analysis and individual deletion using the withdrawal code will no longer be available.'
    )
  );
});

test('4. Valid withdrawal code deletes only its corresponding response within 3 calendar days', async () => {
  let currentNow = Date.parse('2026-11-11T12:00:00.000Z');
  const mockDb = createServerMockSupabase({ nowFn: () => currentNow });

  const participant1 = await submitSurveyWithWithdrawalCode(
    mockDb,
    createSamplePayload({ age_group: '18–24 years' })
  );
  const participant2 = await submitSurveyWithWithdrawalCode(
    mockDb,
    createSamplePayload({ age_group: '25–34 years' })
  );

  assert.equal(mockDb._inspectResponses().length, 2);

  // Advance server clock by 2 days, 23 hours, 59 minutes (still within 3-day window)
  currentNow = Date.parse('2026-11-14T11:59:59.000Z');

  const delRes = await requestWithdrawalDeletion(mockDb, participant1.withdrawal_code, {
    clientKey: 'client_1',
  });

  assert.equal(delRes.status, 'deleted');
  assert.equal(mockDb._inspectResponses().length, 1);
  assert.equal(mockDb._inspectResponses()[0].age_group, '25–34 years');

  const p2Hash = await sha256Hex(participant2.withdrawal_code);
  assert.equal(mockDb._inspectResponses()[0].withdrawal_code_hash, p2Hash);
});

test('5. Invalid code cannot delete anything and does not leak participant information', async () => {
  const mockDb = createServerMockSupabase();
  await submitSurveyWithWithdrawalCode(mockDb, createSamplePayload());

  const badFormatRes = await requestWithdrawalDeletion(mockDb, 'NOT-A-VALID-CODE', {
    clientKey: 'client_invalid',
  });
  assert.equal(badFormatRes.status, 'invalid_code');
  assert.equal(badFormatRes.message, INVALID_CODE_MESSAGE);

  const nonExistentRes = await requestWithdrawalDeletion(mockDb, 'WDR-2345-6789-ABCD', {
    clientKey: 'client_invalid',
  });
  assert.equal(nonExistentRes.status, 'invalid_code');
  assert.equal(nonExistentRes.message, INVALID_CODE_MESSAGE);

  assert.equal(mockDb._inspectResponses().length, 1);
});

test('6. Expired code (> 3 calendar days on server clock) is rejected and locks the response for analysis', async () => {
  let currentNow = Date.parse('2026-11-11T12:00:00.000Z');
  const mockDb = createServerMockSupabase({ nowFn: () => currentNow });

  const receipt = await submitSurveyWithWithdrawalCode(mockDb, createSamplePayload());

  // Advance server clock to 1 second past the 3-calendar-day deadline
  currentNow = Date.parse('2026-11-14T12:00:01.000Z');

  const expRes = await requestWithdrawalDeletion(mockDb, receipt.withdrawal_code, {
    clientKey: 'client_exp',
  });

  assert.equal(expRes.status, 'expired');
  assert.equal(expRes.message, EXPIRED_WITHDRAWAL_MESSAGE);

  // Response must still exist in the database and be marked locked_for_analysis = true
  const remaining = mockDb._inspectResponses();
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].locked_for_analysis, true);
});

test('7. Repeated deletion requests for the same code are handled atomically without inconsistent state', async () => {
  const mockDb = createServerMockSupabase();
  const other = await submitSurveyWithWithdrawalCode(mockDb, createSamplePayload());
  const target = await submitSurveyWithWithdrawalCode(mockDb, createSamplePayload());

  const firstAttempt = await requestWithdrawalDeletion(mockDb, target.withdrawal_code, {
    clientKey: 'client_repeat',
  });
  assert.equal(firstAttempt.status, 'deleted');
  assert.equal(mockDb._inspectResponses().length, 1);

  // Second attempt with the already-used code must cleanly return invalid_code and leave other records untouched
  const secondAttempt = await requestWithdrawalDeletion(mockDb, target.withdrawal_code, {
    clientKey: 'client_repeat',
  });
  assert.equal(secondAttempt.status, 'invalid_code');
  assert.equal(mockDb._inspectResponses().length, 1);

  const otherHash = await sha256Hex(other.withdrawal_code);
  assert.equal(mockDb._inspectResponses()[0].withdrawal_code_hash, otherHash);
});

test('8. Rate limiting blocks brute-force guessing after 5 failed attempts within 15 minutes', async () => {
  let currentNow = Date.parse('2026-11-11T12:00:00.000Z');
  const mockDb = createServerMockSupabase({ nowFn: () => currentNow });
  const validReceipt = await submitSurveyWithWithdrawalCode(mockDb, createSamplePayload());

  for (let i = 0; i < 5; i += 1) {
    const res = await requestWithdrawalDeletion(mockDb, 'WDR-2222-3333-4444', {
      clientKey: 'brute_force_client',
    });
    assert.equal(res.status, 'invalid_code');
  }

  // 6th attempt from the same client key within 15 minutes must be blocked even with a valid code
  const blockedRes = await requestWithdrawalDeletion(mockDb, validReceipt.withdrawal_code, {
    clientKey: 'brute_force_client',
  });
  assert.equal(blockedRes.status, 'rate_limited');
  assert.equal(blockedRes.message, RATE_LIMIT_MESSAGE);
  assert.equal(mockDb._inspectResponses().length, 1);

  // After 16 minutes, the rate limit window resets and the valid code succeeds
  currentNow += 16 * 60 * 1000;
  const unblockedRes = await requestWithdrawalDeletion(mockDb, validReceipt.withdrawal_code, {
    clientKey: 'brute_force_client',
  });
  assert.equal(unblockedRes.status, 'deleted');
  assert.equal(mockDb._inspectResponses().length, 0);
});

test('9. Fallback submission succeeds via survey_responses.insert when RPC is not yet installed in Supabase', async () => {
  const insertedPayloads = [];
  const legacySupabaseClient = {
    rpc: async () => ({
      data: null,
      error: { code: 'PGRST202', message: 'Could not find function public.submit_survey_response' },
    }),
    from: tableName => ({
      insert: async row => {
        assert.equal(tableName, 'survey_responses');
        // Simulate unmigrated table that rejects unknown withdrawal_code_hash column on first try
        if ('withdrawal_code_hash' in row) {
          return {
            error: { code: 'PGRST204', message: 'Column withdrawal_code_hash does not exist' },
          };
        }
        insertedPayloads.push(row);
        return { error: null };
      },
    }),
  };

  const receipt = await submitSurveyWithWithdrawalCode(legacySupabaseClient, createSamplePayload());
  assert.ok(isValidWithdrawalCodeFormat(receipt.withdrawal_code));
  assert.ok(receipt.submitted_at);
  assert.ok(receipt.withdrawal_deadline);
  assert.equal(insertedPayloads.length, 1);
  assert.equal(insertedPayloads[0].age_group, '18–24 years');
});

