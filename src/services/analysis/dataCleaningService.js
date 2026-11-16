import { QUESTIONNAIRE_CONFIG } from '../../config/questionnaireConfig.js';

/**
 * Inspects all participant responses for potential data-quality issues without
 * deleting or altering any original raw answers.
 */
export function runDataCleaningAudit(rawRows = [], exclusionsMap = {}, settings = {}) {
  const rows = Array.isArray(rawRows) ? rawRows : [];
  const allItems = QUESTIONNAIRE_CONFIG.allItemKeys;
  const includeOnlyCurrent = settings.includeOnlyCurrentVersion !== false;

  const idCounts = new Map();
  const signatureCounts = new Map();

  for (const row of rows) {
    if (row?.id) {
      idCounts.set(row.id, (idCounts.get(row.id) || 0) + 1);
    }
    const itemVector = allItems.map(k => row?.[k] ?? '').join(',');
    const sig = `${row?.age_group || ''}|${row?.education || ''}|${row?.primary_ai_tool || ''}|${itemVector}`;
    signatureCounts.set(sig, (signatureCounts.get(sig) || 0) + 1);
  }

  const issueBuckets = {
    missing_values: {
      id: 'missing_values',
      name: 'Missing Item or Required Field Values',
      description: 'Responses missing one or more required Likert items or mandatory demographic/AI fields.',
      recommendedAction: 'Review completeness rule; exclude incomplete records from strict listwise analyses.',
      affectedIds: [],
    },
    invalid_likert: {
      id: 'invalid_likert',
      name: 'Invalid Likert Scale Values',
      description: 'Likert values outside the valid integer range of 1 to 5.',
      recommendedAction: 'Exclude record or verify raw database entry.',
      affectedIds: [],
    },
    duplicate_ids: {
      id: 'duplicate_ids',
      name: 'Duplicate Response IDs',
      description: 'Multiple rows sharing the same UUID primary key.',
      recommendedAction: 'Deduplicate in database before final statistical reporting.',
      affectedIds: [],
    },
    potential_duplicates: {
      id: 'potential_duplicates',
      name: 'Identical Response Pattern / Possible Duplicate',
      description: 'Rows sharing identical demographic profile, primary tool, and all 18 Likert responses.',
      recommendedAction: 'Inspect timestamps carefully before deciding whether to exclude as repeat submission.',
      affectedIds: [],
    },
    straight_lining: {
      id: 'straight_lining',
      name: 'Zero-Variance / Straight-Lining Pattern',
      description: 'Participant selected the exact same Likert number for every single statement across all 18 items.',
      recommendedAction: 'Inspect carefully; researchers often review straight-lining as careless responding.',
      affectedIds: [],
    },
    invalid_demographics: {
      id: 'invalid_demographics',
      name: 'Invalid Demographic Values',
      description: 'Age group or education level does not match allowed study categories.',
      recommendedAction: 'Verify eligibility criteria (adults 18+ in Bangladesh).',
      affectedIds: [],
    },
    invalid_dates: {
      id: 'invalid_dates',
      name: 'Invalid Submission or Withdrawal Dates',
      description: 'Missing/unparseable timestamp or withdrawal deadline earlier than submission date.',
      recommendedAction: 'Check server clock records.',
      affectedIds: [],
    },
    version_mismatch: {
      id: 'version_mismatch',
      name: 'Earlier / Non-Current Questionnaire Version',
      description: `Records tagged with a version other than current "${QUESTIONNAIRE_CONFIG.version}".`,
      recommendedAction: 'Keep older versions separated so 18-item and historical 26-item items are never mixed.',
      affectedIds: [],
    },
    eligibility_incomplete: {
      id: 'eligibility_incomplete',
      name: 'AI Experience / Eligibility Missing',
      description: 'Participant record lacks required conversational AI usage fields (primary tool, tools used, or frequency).',
      recommendedAction: 'Exclude from primary confirmatory analyses if eligibility cannot be verified.',
      affectedIds: [],
    },
    pending_withdrawal_window: {
      id: 'pending_withdrawal_window',
      name: 'Within 3-Day Withdrawal Window (Not Yet Locked)',
      description: 'Response is still within its 3-calendar-day participant withdrawal window.',
      recommendedAction: 'Participant may still delete this response before the deadline; lock status updates automatically after 3 days.',
      affectedIds: [],
    },
  };

  const nowMs = Date.now();
  const auditedRows = [];

  for (const row of rows) {
    const rowIssues = [];
    const rid = row?.id || 'unknown';

    // 1. Missing values & 2. Invalid Likert & 5. Incomplete
    let missingCount = 0;
    let invalidLikertCount = 0;
    const itemNums = [];

    for (const key of allItems) {
      const val = row?.[key];
      if (val === null || val === undefined || val === '') {
        missingCount += 1;
      } else {
        const num = Number(val);
        if (!Number.isInteger(num) || num < 1 || num > 5) {
          invalidLikertCount += 1;
        } else {
          itemNums.push(num);
        }
      }
    }

    if (missingCount > 0 || !row?.age_group || !row?.education) {
      rowIssues.push('missing_values');
      issueBuckets.missing_values.affectedIds.push(rid);
    }
    if (invalidLikertCount > 0) {
      rowIssues.push('invalid_likert');
      issueBuckets.invalid_likert.affectedIds.push(rid);
    }

    // 3. Duplicate IDs
    if (row?.id && idCounts.get(row.id) > 1) {
      rowIssues.push('duplicate_ids');
      issueBuckets.duplicate_ids.affectedIds.push(rid);
    }

    // 4. Potential duplicate pattern
    const itemVector = allItems.map(k => row?.[k] ?? '').join(',');
    const sig = `${row?.age_group || ''}|${row?.education || ''}|${row?.primary_ai_tool || ''}|${itemVector}`;
    if (signatureCounts.get(sig) > 1) {
      rowIssues.push('potential_duplicates');
      issueBuckets.potential_duplicates.affectedIds.push(rid);
    }

    // Straight-lining check (all 18 items identical)
    if (itemNums.length === allItems.length) {
      const uniqueVals = new Set(itemNums);
      if (uniqueVals.size === 1) {
        rowIssues.push('straight_lining');
        issueBuckets.straight_lining.affectedIds.push(rid);
      }
    }

    // 6. Invalid demographics
    const validAge = QUESTIONNAIRE_CONFIG.allowedAgeGroups.includes(row?.age_group);
    const validEdu = QUESTIONNAIRE_CONFIG.allowedEducations.includes(row?.education);
    if (!validAge || !validEdu) {
      rowIssues.push('invalid_demographics');
      issueBuckets.invalid_demographics.affectedIds.push(rid);
    }

    // 7. Invalid dates
    const subTime = row?.submitted_at ? Date.parse(row.submitted_at) : NaN;
    const deadTime = row?.withdrawal_deadline ? Date.parse(row.withdrawal_deadline) : NaN;
    if (Number.isNaN(subTime) || (row?.withdrawal_deadline && Number.isNaN(deadTime)) || (Number.isFinite(deadTime) && deadTime < subTime)) {
      rowIssues.push('invalid_dates');
      issueBuckets.invalid_dates.affectedIds.push(rid);
    }

    // 8. Questionnaire version
    const rowVersion = row?.questionnaire_version || QUESTIONNAIRE_CONFIG.version;
    if (rowVersion !== QUESTIONNAIRE_CONFIG.version) {
      rowIssues.push('version_mismatch');
      issueBuckets.version_mismatch.affectedIds.push(rid);
    }

    // 9. Eligibility / AI usage required
    const toolsArr = Array.isArray(row?.ai_tools) ? row.ai_tools : [];
    if (toolsArr.length === 0 || !row?.ai_frequency || !row?.ai_duration) {
      rowIssues.push('eligibility_incomplete');
      issueBuckets.eligibility_incomplete.affectedIds.push(rid);
    }

    // 10. Withdrawal window vs locked status
    const isLocked = Boolean(row?.locked_for_analysis) || (Number.isFinite(deadTime) && nowMs > deadTime);
    if (!isLocked && Number.isFinite(deadTime) && nowMs <= deadTime) {
      issueBuckets.pending_withdrawal_window.affectedIds.push(rid);
    }

    const adminFlag = exclusionsMap?.[rid];
    const isAdminExcluded = Boolean(adminFlag?.excluded);
    const isVersionExcluded = includeOnlyCurrent && rowVersion !== QUESTIONNAIRE_CONFIG.version;
    const hasCriticalError =
      missingCount > 0 || invalidLikertCount > 0 || !validAge || !validEdu || Number.isNaN(subTime);

    const includedInAnalysis = !isAdminExcluded && !isVersionExcluded && !hasCriticalError;

    auditedRows.push({
      ...row,
      _audit: {
        issues: rowIssues,
        missingCount,
        invalidLikertCount,
        isLocked,
        isPendingWithdrawal: !isLocked && Number.isFinite(deadTime) && nowMs <= deadTime,
        isAdminExcluded,
        exclusionReason: adminFlag?.exclusion_reason || (isVersionExcluded ? `Non-current version (${rowVersion})` : hasCriticalError ? 'Critical data validation issue' : ''),
        isVersionExcluded,
        hasCriticalError,
        includedInAnalysis,
      },
    });
  }

  const issues = Object.values(issueBuckets).map(bucket => ({
    ...bucket,
    affectedCount: bucket.affectedIds.length,
  }));

  const validRows = auditedRows.filter(r => r._audit.includedInAnalysis);
  const excludedRows = auditedRows.filter(r => !r._audit.includedInAnalysis);
  const lockedCount = auditedRows.filter(r => r._audit.isLocked).length;
  const pendingWithdrawalCount = auditedRows.filter(r => r._audit.isPendingWithdrawal).length;

  return {
    totalSubmitted: auditedRows.length,
    validCount: validRows.length,
    excludedCount: excludedRows.length,
    lockedCount,
    pendingWithdrawalCount,
    auditedRows,
    validRows,
    excludedRows,
    issues,
  };
}
