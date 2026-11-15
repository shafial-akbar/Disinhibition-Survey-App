import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sections,
  QUESTIONNAIRE_VERSION,
  LEGACY_QUESTIONNAIRE_VERSION,
  primaryAiToolOptions,
} from '../src/data/questions.js';
import {
  createServerMockSupabase,
  submitSurveyWithWithdrawalCode,
  requestWithdrawalDeletion,
  normalizeWithdrawalCode,
  isValidWithdrawalCodeFormat,
  buildWithdrawalReceiptText,
  sha256Hex,
  calculateSurveyScores,
  prepareSurveySubmissionPayload,
  WARMTH_KEYS,
  TRUST_KEYS,
  DISCLOSURE_KEYS,
  ALL_LIKERT_KEYS,
  OBSOLETE_LIKERT_KEYS,
  EXPIRED_WITHDRAWAL_MESSAGE,
  INVALID_CODE_MESSAGE,
  RATE_LIMIT_MESSAGE,
} from '../src/lib/withdrawal.js';
import {
  RESEARCH_EXPORT_COLUMNS_V1,
  classifyResponseVersion,
  filterResponsesByVersion,
  formatResponsesToCsv,
} from '../src/lib/researchExport.js';

function createSamplePayload(overrides = {}) {
  const answers = {};
  for (let i = 1; i <= 4; i += 1) answers[`cw_${i}`] = 4;
  for (let i = 1; i <= 6; i += 1) answers[`pt_${i}`] = 5;
  for (let i = 1; i <= 8; i += 1) answers[`sd_${i}`] = 3;

  return {
    age_group: '18–24 years',
    gender: 'Female',
    education: 'Undergraduate',
    occupation: 'Student',
    ai_tools: ['ChatGPT', 'Google Gemini'],
    primary_ai_tool: 'ChatGPT',
    ai_frequency: 'Daily',
    ai_duration: '1–2 years',
    ai_purpose: ['Education and learning', 'Information searching'],
    ai_familiarity: 'Very familiar',
    ...answers,
    ...overrides,
  };
}

test('1. Questionnaire configuration contains 18 items (4 CW, 6 PT, 8 SD) with bilingual labels', () => {
  assert.equal(sections.length, 3);
  const [warmth, trust, disclosure] = sections;

  assert.equal(warmth.prefix, 'cw');
  assert.equal(warmth.items.length, 4);
  assert.equal(warmth.itemsBn.length, 4);

  assert.equal(trust.prefix, 'pt');
  assert.equal(trust.items.length, 6);
  assert.equal(trust.itemsBn.length, 6);
  assert.equal(
    trust.items[4],
    'I feel confident relying on the AI tool I use most frequently for assistance with everyday tasks and problem-solving.'
  );
  assert.equal(
    trust.items[5],
    'Overall, I consider the AI tool I use most frequently to be trustworthy.'
  );

  assert.equal(disclosure.prefix, 'sd');
  assert.equal(disclosure.items.length, 8);
  assert.equal(disclosure.itemsBn.length, 8);

  assert.equal(WARMTH_KEYS.length, 4);
  assert.equal(TRUST_KEYS.length, 6);
  assert.deepEqual(TRUST_KEYS, ['pt_1', 'pt_2', 'pt_3', 'pt_4', 'pt_5', 'pt_6']);
  assert.equal(DISCLOSURE_KEYS.length, 8);
  assert.equal(ALL_LIKERT_KEYS.length, 18);
  assert.deepEqual(primaryAiToolOptions, [
    'ChatGPT',
    'Google Gemini',
    'Microsoft Copilot',
    'Claude',
    'Other',
  ]);
});

test('2. Successful submission generates one unique cryptographic withdrawal code and stores only its SHA-256 hash', async () => {
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
  assert.equal(storedRows[0].questionnaire_version, 'v1_16_items');
  assert.equal(storedRows[0].primary_ai_tool, 'ChatGPT');
  assert.equal(storedRows[0].pt_5, 5);
  assert.equal(storedRows[0].pt_6, 5);
});

test('3. Multiple submissions generate unique unpredictable codes', async () => {
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

test('4. Receipt formatting and normalization work for Copy and Download actions', async () => {
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

test('5. Valid withdrawal code deletes only its corresponding response within 3 calendar days', async () => {
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

test('6. Invalid code cannot delete anything and does not leak participant information', async () => {
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

test('7. Expired code (> 3 calendar days on server clock) is rejected and locks the response for analysis', async () => {
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

  const remaining = mockDb._inspectResponses();
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].locked_for_analysis, true);
});

test('8. Repeated deletion requests for the same code are handled atomically without inconsistent state', async () => {
  const mockDb = createServerMockSupabase();
  const other = await submitSurveyWithWithdrawalCode(mockDb, createSamplePayload());
  const target = await submitSurveyWithWithdrawalCode(mockDb, createSamplePayload());

  const firstAttempt = await requestWithdrawalDeletion(mockDb, target.withdrawal_code, {
    clientKey: 'client_repeat',
  });
  assert.equal(firstAttempt.status, 'deleted');
  assert.equal(mockDb._inspectResponses().length, 1);

  const secondAttempt = await requestWithdrawalDeletion(mockDb, target.withdrawal_code, {
    clientKey: 'client_repeat',
  });
  assert.equal(secondAttempt.status, 'invalid_code');
  assert.equal(mockDb._inspectResponses().length, 1);

  const otherHash = await sha256Hex(other.withdrawal_code);
  assert.equal(mockDb._inspectResponses()[0].withdrawal_code_hash, otherHash);
});

test('9. Rate limiting blocks brute-force guessing after 5 failed attempts within 15 minutes', async () => {
  let currentNow = Date.parse('2026-11-11T12:00:00.000Z');
  const mockDb = createServerMockSupabase({ nowFn: () => currentNow });
  const validReceipt = await submitSurveyWithWithdrawalCode(mockDb, createSamplePayload());

  for (let i = 0; i < 5; i += 1) {
    const res = await requestWithdrawalDeletion(mockDb, 'WDR-2222-3333-4444', {
      clientKey: 'brute_force_client',
    });
    assert.equal(res.status, 'invalid_code');
  }

  const blockedRes = await requestWithdrawalDeletion(mockDb, validReceipt.withdrawal_code, {
    clientKey: 'brute_force_client',
  });
  assert.equal(blockedRes.status, 'rate_limited');
  assert.equal(blockedRes.message, RATE_LIMIT_MESSAGE);
  assert.equal(mockDb._inspectResponses().length, 1);

  currentNow += 16 * 60 * 1000;
  const unblockedRes = await requestWithdrawalDeletion(mockDb, validReceipt.withdrawal_code, {
    clientKey: 'brute_force_client',
  });
  assert.equal(unblockedRes.status, 'deleted');
  assert.equal(mockDb._inspectResponses().length, 0);
});

test('10. Fallback submission succeeds via survey_responses.insert when RPC is not yet installed in Supabase', async () => {
  const insertedPayloads = [];
  const legacySupabaseClient = {
    rpc: async () => ({
      data: null,
      error: { code: 'PGRST202', message: 'Could not find function public.submit_survey_response' },
    }),
    from: tableName => ({
      insert: async row => {
        assert.equal(tableName, 'survey_responses');
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
  assert.equal(insertedPayloads[0].primary_ai_tool, 'ChatGPT');
  assert.equal(insertedPayloads[0].questionnaire_version, 'v1_16_items');
  assert.equal(insertedPayloads[0].warmth_total, 16);
  assert.equal(insertedPayloads[0].warmth_mean, 4);
  assert.equal(insertedPayloads[0].trust_total, 30);
  assert.equal(insertedPayloads[0].trust_mean, 5);
  assert.equal(insertedPayloads[0].disclosure_total, 24);
  assert.equal(insertedPayloads[0].disclosure_mean, 3);
});

test('11. 18-item composite score calculation (including PT5 and PT6), primary_ai_tool ("Other"), and stripping of obsolete columns', async () => {
  const cwValues = [4, 5, 3, 5]; // sum = 17, mean = 17 / 4 = 4.25
  const ptValues = [4, 4, 5, 4, 5, 3]; // sum = 25, mean = 25 / 6 = 4.17
  const sdValues = [3, 4, 3, 2, 4, 3, 5, 3]; // sum = 27, mean = 27 / 8 = 3.38

  const sampleAnswers = {};
  cwValues.forEach((v, idx) => {
    sampleAnswers[`cw_${idx + 1}`] = v;
  });
  ptValues.forEach((v, idx) => {
    sampleAnswers[`pt_${idx + 1}`] = v;
  });
  sdValues.forEach((v, idx) => {
    sampleAnswers[`sd_${idx + 1}`] = v;
  });

  // Also pass obsolete keys to verify they are ignored in score calculation and stripped from the DB payload
  const payloadWithOtherTool = createSamplePayload({
    ...sampleAnswers,
    primary_ai_tool_choice: 'Other',
    primary_ai_tool_other: '  Perplexity AI  ',
    cw_5: 1,
    cw_8: 1,
    pt_7: 1,
    pt_9: 1,
    sd_9: 1,
  });

  const { rawAnswers, scores } = calculateSurveyScores(payloadWithOtherTool);
  assert.equal(Object.keys(rawAnswers).length, 18);
  assert.equal(scores.warmth_total, 17);
  assert.equal(scores.warmth_mean, 4.25);
  assert.equal(scores.trust_total, 25);
  assert.equal(scores.trust_mean, 4.17);
  assert.equal(scores.disclosure_total, 27);
  assert.equal(scores.disclosure_mean, 3.38);

  const mockDb = createServerMockSupabase();
  await submitSurveyWithWithdrawalCode(mockDb, payloadWithOtherTool);

  const storedRows = mockDb._inspectResponses();
  assert.equal(storedRows.length, 1);
  const savedRecord = storedRows[0];

  // Verify primary_ai_tool saved the custom "Other" tool name and kept ai_tools intact
  assert.equal(savedRecord.primary_ai_tool, 'Perplexity AI');
  assert.deepEqual(savedRecord.ai_tools, ['ChatGPT', 'Google Gemini']);
  assert.equal(savedRecord.questionnaire_version, QUESTIONNAIRE_VERSION);

  // Verify all 18 active raw responses (including pt_5 and pt_6) are saved
  cwValues.forEach((v, idx) => assert.equal(savedRecord[`cw_${idx + 1}`], v));
  ptValues.forEach((v, idx) => assert.equal(savedRecord[`pt_${idx + 1}`], v));
  sdValues.forEach((v, idx) => assert.equal(savedRecord[`sd_${idx + 1}`], v));

  // Verify no obsolete columns were inserted
  for (const obsKey of OBSOLETE_LIKERT_KEYS) {
    assert.equal(savedRecord[obsKey], undefined);
  }
  assert.equal(savedRecord.primary_ai_tool_choice, undefined);
  assert.equal(savedRecord.primary_ai_tool_other, undefined);
});

test('12. Validation and data integrity: rejects missing primary_ai_tool, empty Other tool name, missing/invalid Likert items (including pt_5 and pt_6)', async () => {
  const mockDb = createServerMockSupabase();

  // Missing primary_ai_tool
  await assert.rejects(
    () => submitSurveyWithWithdrawalCode(mockDb, createSamplePayload({ primary_ai_tool: '' })),
    /Please select the conversational AI tool you use most frequently/
  );

  // Selected "Other" without specifying tool name
  await assert.rejects(
    () =>
      submitSurveyWithWithdrawalCode(
        mockDb,
        createSamplePayload({
          primary_ai_tool_choice: 'Other',
          primary_ai_tool_other: '   ',
          primary_ai_tool: '',
        })
      ),
    /Please specify the name of the conversational AI tool you use most frequently/
  );

  // Missing pt_5 or pt_6
  const missingPt5 = createSamplePayload();
  delete missingPt5.pt_5;
  await assert.rejects(
    () => submitSurveyWithWithdrawalCode(mockDb, missingPt5),
    /Missing required questionnaire response for pt_5/
  );

  const missingPt6 = createSamplePayload();
  delete missingPt6.pt_6;
  await assert.rejects(
    () => submitSurveyWithWithdrawalCode(mockDb, missingPt6),
    /Missing required questionnaire response for pt_6/
  );

  // Out of range (0 or 6) or non-integer (3.5)
  await assert.rejects(
    () => submitSurveyWithWithdrawalCode(mockDb, createSamplePayload({ pt_5: 0 })),
    /Invalid Likert response for pt_5/
  );
  await assert.rejects(
    () => submitSurveyWithWithdrawalCode(mockDb, createSamplePayload({ pt_6: 6 })),
    /Invalid Likert response for pt_6/
  );
  await assert.rejects(
    () => submitSurveyWithWithdrawalCode(mockDb, createSamplePayload({ cw_2: 3.5 })),
    /Invalid Likert response for cw_2/
  );

  assert.equal(mockDb._inspectResponses().length, 0);
});

test('13. Research export and version filtering include pt_5 and pt_6 in v1 exports and keep legacy v0_26_items separated', () => {
  const legacyRecord = {
    id: 'legacy-1',
    age_group: '25–34 years',
    education: 'Graduate',
    ai_tools: ['ChatGPT'],
    ai_frequency: 'Daily',
    ai_duration: '1–2 years',
    ai_purpose: ['Education and learning'],
    ai_familiarity: 'Very familiar',
    cw_1: 4, cw_2: 4, cw_3: 4, cw_4: 4, cw_5: 4, cw_6: 4, cw_7: 4, cw_8: 4,
    pt_1: 4, pt_2: 4, pt_3: 4, pt_4: 4, pt_5: 4, pt_6: 4, pt_7: 4, pt_8: 4, pt_9: 4,
    sd_1: 3, sd_2: 3, sd_3: 3, sd_4: 3, sd_5: 3, sd_6: 3, sd_7: 3, sd_8: 3, sd_9: 3,
  };

  const newRecord = {
    id: 'new-1',
    questionnaire_version: QUESTIONNAIRE_VERSION,
    submitted_at: '2026-11-13T12:00:00.000Z',
    age_group: '18–24 years',
    gender: 'Male',
    education: 'Undergraduate',
    occupation: 'Student',
    primary_ai_tool: 'Claude',
    ai_tools: ['ChatGPT', 'Claude'],
    ai_frequency: 'Daily',
    ai_duration: '1–2 years',
    ai_purpose: ['Education and learning'],
    ai_familiarity: 'Very familiar',
    cw_1: 5, cw_2: 4, cw_3: 5, cw_4: 4,
    pt_1: 4, pt_2: 5, pt_3: 4, pt_4: 5, pt_5: 4, pt_6: 5,
    sd_1: 4, sd_2: 4, sd_3: 3, sd_4: 4, sd_5: 4, sd_6: 5, sd_7: 3, sd_8: 5,
    warmth_total: 18,
    warmth_mean: 4.5,
    trust_total: 27,
    trust_mean: 4.5,
    disclosure_total: 32,
    disclosure_mean: 4,
  };

  assert.ok(RESEARCH_EXPORT_COLUMNS_V1.includes('pt_5'));
  assert.ok(RESEARCH_EXPORT_COLUMNS_V1.includes('pt_6'));
  assert.equal(classifyResponseVersion(legacyRecord), LEGACY_QUESTIONNAIRE_VERSION);
  assert.equal(classifyResponseVersion(newRecord), QUESTIONNAIRE_VERSION);

  const v1Dataset = filterResponsesByVersion([legacyRecord, newRecord], QUESTIONNAIRE_VERSION);
  assert.equal(v1Dataset.length, 1);
  assert.equal(v1Dataset[0].id, 'new-1');

  const csv = formatResponsesToCsv([legacyRecord, newRecord]);
  const lines = csv.split('\n');
  assert.equal(lines.length, 2);
  assert.equal(lines[0], RESEARCH_EXPORT_COLUMNS_V1.join(','));
  assert.ok(lines[0].includes('pt_1,pt_2,pt_3,pt_4,pt_5,pt_6'));
  assert.ok(lines[1].includes('new-1'));
  assert.ok(lines[1].includes('Claude'));
  assert.ok(!lines[1].includes('legacy-1'));
});
