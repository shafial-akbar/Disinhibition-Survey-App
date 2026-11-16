import { QUESTIONNAIRE_CONFIG, CONSTRUCT_LIST } from '../../config/questionnaireConfig.js';
import { formatNumber, formatPValue, formatCI } from '../../utils/formatters/numberFormatter.js';
import { formatPercentage } from '../../utils/formatters/percentageFormatter.js';

/**
 * Generates an automated academic Chapter 4 report (Sections 4.1 to 4.13)
 * grounded strictly in the live calculated statistical outputs.
 */
export function generateChapter4Report({
  cleaning,
  scoring,
  descriptive,
  reliability,
  normality,
  correlation,
  hypothesesResult,
  snapshotMeta,
}) {
  const validN = cleaning?.validCount || 0;
  const totalN = cleaning?.totalSubmitted || 0;
  const excludedN = cleaning?.excludedCount || 0;

  if (totalN === 0 || validN === 0) {
    return {
      hasData: false,
      generatedAt: snapshotMeta?.analyzedAt || new Date().toISOString(),
      sections: [
        {
          id: '4.1',
          title: '4.1 Introduction to the Results',
          simpleText:
            'No valid participant responses are available yet. Once participants submit responses through the survey and data are fetched from Supabase, all Chapter 4 sections will populate automatically.',
          academicText:
            `This chapter presents the statistical results for the study "${QUESTIONNAIRE_CONFIG.studyTitle}". At the time of analysis (${snapshotMeta?.analyzedAt || 'current session'}), ${totalN} total records were retrieved and ${validN} valid cases were available for statistical testing; therefore, quantitative tables cannot yet be computed.`,
          limitations: 'Data collection is ongoing or awaiting records in public.survey_responses.',
        },
      ],
    };
  }

  // Helper summaries for academic prose
  const getScaleDesc = code =>
    descriptive?.compositeSummaries?.find(c => c.code === code)?.meanSummary;
  const pcwDesc = getScaleDesc('PCW');
  const ptDesc = getScaleDesc('PT');
  const wsdDesc = getScaleDesc('WSD');

  const getRel = code => reliability?.scales?.find(s => s.code === code);
  const pcwRel = getRel('PCW');
  const ptRel = getRel('PT');
  const wsdRel = getRel('WSD');

  const getNorm = code => normality?.scales?.find(s => s.code === code);
  const pcwNorm = getNorm('PCW');
  const ptNorm = getNorm('PT');
  const wsdNorm = getNorm('WSD');

  const ageTop = [...(descriptive?.demographics?.age_group?.categories || [])].sort(
    (a, b) => b.count - a.count
  )[0];
  const genderCats = descriptive?.demographics?.gender?.categories || [];
  const toolTop = [...(descriptive?.aiUsage?.primary_ai_tool?.categories || [])].sort(
    (a, b) => b.count - a.count
  )[0];

  const h1 = hypothesesResult?.hypotheses?.find(h => h.id === 'H1');
  const h2 = hypothesesResult?.hypotheses?.find(h => h.id === 'H2');
  const h3 = hypothesesResult?.hypotheses?.find(h => h.id === 'H3');

  const lockedN = cleaning?.lockedCount || 0;
  const pendingN = cleaning?.pendingWithdrawalCount || 0;
  const isProvisional = pendingN > 0;

  const h3DivergenceNote =
    h3 &&
    h3.pearsonP !== null &&
    h3.spearmanP !== null &&
    h3.pearsonP < (hypothesesResult?.alphaLevel || 0.05) &&
    h3.spearmanP >= (hypothesesResult?.alphaLevel || 0.05)
      ? ` Although H3 is supported based on the predefined primary parametric test (Pearson's r = ${formatNumber(h3.pearsonR, 3)}, p ${formatPValue(h3.pearsonP) === '< .001' ? '< .001' : `= ${formatPValue(h3.pearsonP)}`}), the non-parametric Spearman rank-order correlation was not statistically significant (ρ = ${formatNumber(h3.spearmanRho, 3)}, p ${formatPValue(h3.spearmanP) === '< .001' ? '< .001' : `= ${formatPValue(h3.spearmanP)}`}); therefore, this association should be interpreted with appropriate statistical caution.`
      : '';

  const sections = [
    {
      id: '4.1',
      title: 'Introduction to the Results',
      simpleText:
        'This section introduces the statistical findings generated directly from participant responses collected in the research database.',
      academicText:
        `This chapter reports the empirical findings of the study titled "${QUESTIONNAIRE_CONFIG.studyTitle}". Analyses were conducted on N = ${validN} eligible adult participants in Bangladesh who completed the ${QUESTIONNAIRE_CONFIG.totalItemCount}-item questionnaire (version ${QUESTIONNAIRE_CONFIG.version}).${isProvisional ? ` Because ${pendingN} of the ${validN} eligible responses are currently within the active 3-calendar-day participant withdrawal window (${lockedN} locked), this report represents a provisional analysis snapshot rather than the final locked dataset, and can be regenerated after the withdrawal window closes.` : ''} The results cover data screening, sample demographics, conversational AI usage profiles, psychometric scoring, internal consistency reliability, normality diagnostics, bivariate correlations, and confirmatory hypothesis testing for H1–H3.`,
      whyMatters:
        'Establishing a transparent, reproducible analytical pipeline ensures every reported statistic maps directly to raw participant responses.',
    },
    {
      id: '4.2',
      title: 'Data Screening and Preparation',
      simpleText: `Out of ${totalN} total submitted records, ${excludedN} were excluded during quality screening, leaving ${validN} eligible responses for this ${isProvisional ? 'provisional analysis snapshot' : 'final locked dataset'}.`,
      academicText:
        `A total of N = ${totalN} questionnaire submissions were retrieved from the database. Automated screening verified item completeness across all ${QUESTIONNAIRE_CONFIG.totalItemCount} Likert items (CW1–CW4, PT1–PT6, SD1–SD8), valid scale bounds (1–5), demographic eligibility, timestamp integrity, and questionnaire version alignment (${QUESTIONNAIRE_CONFIG.version}). Following screening, ${excludedN} record(s) were excluded, yielding an analytical sample of N = ${validN} (${lockedN} locked post-withdrawal deadline; ${pendingN} currently within the active 3-calendar-day withdrawal window). ${isProvisional ? 'Accordingly, these results constitute a provisional analysis snapshot and may be regenerated once the 3-day withdrawal period concludes and final screening is completed.' : 'All responses have passed the 3-day withdrawal window and form the final locked dataset.'}`,
      whyMatters:
        'Transparent data screening protects statistical validity without altering or fabricating raw participant answers.',
    },
    {
      id: '4.3',
      title: 'Response and Sample Overview',
      simpleText: `The active dataset contains ${validN} valid participants across ${CONSTRUCT_LIST.length} psychological constructs measured on a 5-point Likert scale.`,
      academicText:
        `The screened analytical dataset comprised N = ${validN} complete adult respondents. Composite variables were constructed from item-level scores for Perceived Conversational Warmth (4 items), Perceived Trust (6 items), and Willingness to Self-Disclose (8 items) using ${snapshotMeta?.missingDataRule || 'complete-construct'} scoring rules.`,
      whyMatters:
        'Clarifying the exact analytical sample size provides the denominator for all subsequent descriptive and inferential tests.',
    },
    {
      id: '4.4',
      title: 'Demographic Characteristics',
      simpleText: ageTop
        ? `The largest age group was "${ageTop.category}" (${ageTop.count} participants, ${formatPercentage(ageTop.count, validN)}).`
        : 'Demographic distributions summarize the background of participants.',
      academicText: `Demographic frequencies describe participants' age group, gender, education, and occupation (N = ${validN}). ${
        ageTop
          ? `The modal age category was ${ageTop.category} (n = ${ageTop.count}, ${formatPercentage(ageTop.count, validN)}). `
          : ''
      }${
        genderCats
          .filter(c => c.count > 0)
          .map(c => `${c.category}: n = ${c.count} (${formatPercentage(c.count, validN)})`)
          .join('; ')
      }.`,
      whyMatters:
        'Demographic profiles contextualize generalizability among adult conversational AI users in Bangladesh.',
    },
    {
      id: '4.5',
      title: 'Conversational AI Usage Characteristics',
      simpleText: toolTop
        ? `The most frequently used primary conversational AI tool was ${toolTop.category} (${toolTop.count} participants, ${formatPercentage(toolTop.count, validN)}).`
        : 'AI usage summaries show which tools participants rely on most and how often they use them.',
      academicText: `Participants reported their primary conversational AI platform, frequency, duration, familiarity, and multi-select usage purposes (N = ${validN}). ${
        toolTop
          ? `${toolTop.category} was identified as the most frequently used primary tool by ${toolTop.count} respondents (${formatPercentage(toolTop.count, validN)}). `
          : ''
      }Note that for multi-select questions (tools ever used and purposes of use), percentages reflect proportion of valid respondents (N = ${validN}) and may exceed 100%.`,
      whyMatters:
        'Understanding participants\' primary AI tool grounds the warmth, trust, and self-disclosure ratings in real usage habits.',
    },
    {
      id: '4.6',
      title: 'Descriptive Statistics of Research Variables',
      simpleText:
        'These averages and standard deviations show typical participant ratings for Warmth, Trust, and Self-Disclosure on the 1–5 scale.',
      academicText: `Sample descriptive statistics (computed using sample variance/SD with n - 1 denominator) for composite mean scores (N = ${validN}) were as follows: Perceived Conversational Warmth (M = ${formatNumber(pcwDesc?.mean, 2)}, SD = ${formatNumber(pcwDesc?.sd, 2)}, Mdn = ${formatNumber(pcwDesc?.median, 2)}), Perceived Trust (M = ${formatNumber(ptDesc?.mean, 2)}, SD = ${formatNumber(ptDesc?.sd, 2)}, Mdn = ${formatNumber(ptDesc?.median, 2)}), and Willingness to Self-Disclose (M = ${formatNumber(wsdDesc?.mean, 2)}, SD = ${formatNumber(wsdDesc?.sd, 2)}, Mdn = ${formatNumber(wsdDesc?.median, 2)}).`,
      whyMatters:
        'Descriptive statistics establish central tendency and dispersion prior to correlation and hypothesis testing.',
    },
    {
      id: '4.7',
      title: 'Questionnaire Scoring Summary',
      simpleText:
        'Each construct score was calculated by summing its valid items and dividing by the number of items in that section (4 for Warmth, 6 for Trust, 8 for Self-Disclosure).',
      academicText: `Scale composites were computed strictly from raw item scores: PCW Total (possible range 4–20; observed ${formatNumber(scoring?.constructSummaries?.[0]?.actualTotalMin, 0)}–${formatNumber(scoring?.constructSummaries?.[0]?.actualTotalMax, 0)}), PT Total (possible range 6–30; observed ${formatNumber(scoring?.constructSummaries?.[1]?.actualTotalMin, 0)}–${formatNumber(scoring?.constructSummaries?.[1]?.actualTotalMax, 0)}), and WSD Total (possible range 8–40; observed ${formatNumber(scoring?.constructSummaries?.[2]?.actualTotalMin, 0)}–${formatNumber(scoring?.constructSummaries?.[2]?.actualTotalMax, 0)}).`,
      whyMatters:
        'Transparent scoring rules ensure reproducible composite scores across statistical packages.',
    },
    {
      id: '4.8',
      title: 'Reliability Analysis',
      simpleText:
        'Cronbach\'s Alpha tells us whether the questions inside each scale measure the same idea consistently in this sample.',
      academicText: `Internal consistency reliability was evaluated using Cronbach's alpha computed from individual item-level responses (N = ${validN}). Results showed: Perceived Conversational Warmth (4 items, α = ${formatNumber(pcwRel?.alpha, 3)} — ${pcwRel?.interpretation?.label || 'N/A'}), Perceived Trust (6 items, α = ${formatNumber(ptRel?.alpha, 3)} — ${pcwRel?.interpretation?.label ? ptRel?.interpretation?.label : 'N/A'}), and Willingness to Self-Disclose (8 items, α = ${formatNumber(wsdRel?.alpha, 3)} — ${wsdRel?.interpretation?.label || 'N/A'}). Note that reliability is a sample-dependent property and high internal consistency alone does not establish construct validity.`,
      whyMatters:
        'Acceptable internal consistency confirms that items within each construct co-vary reliably before forming composite scores.',
      limitations:
        validN < 30
          ? `Caution: current sample size (N = ${validN}) is small; alpha estimates stabilize as sample size increases.`
          : null,
    },
    {
      id: '4.9',
      title: 'Normality Assessment',
      simpleText:
        'Shapiro-Wilk tests, skewness, kurtosis, histograms, and Q-Q plots help us check whether scores follow an approximately bell-shaped distribution.',
      academicText: `Distributional normality of the three composite mean scores (N = ${validN}) was assessed via Shapiro-Wilk tests, skewness, and excess kurtosis: PCW (W = ${formatNumber(pcwNorm?.wStatistic, 3)}, p ${formatPValue(pcwNorm?.pValue) === '< .001' ? '< .001' : `= ${formatPValue(pcwNorm?.pValue)}`}, skewness = ${formatNumber(pcwNorm?.skewness, 2)}), PT (W = ${formatNumber(ptNorm?.wStatistic, 3)}, p ${formatPValue(ptNorm?.pValue) === '< .001' ? '< .001' : `= ${formatPValue(ptNorm?.pValue)}`}, skewness = ${formatNumber(ptNorm?.skewness, 2)}), and WSD (W = ${formatNumber(wsdNorm?.wStatistic, 3)}, p ${formatPValue(wsdNorm?.pValue) === '< .001' ? '< .001' : `= ${formatPValue(wsdNorm?.pValue)}`}, skewness = ${formatNumber(wsdNorm?.skewness, 2)}). Accordingly, both parametric (Pearson's r) and non-parametric rank-based (Spearman's ρ) correlations are reported alongside visual Q-Q inspection.`,
      whyMatters:
        'Evaluating normality prevents relying blindly on parametric assumptions when Likert composites are skewed.',
    },
    {
      id: '4.10',
      title: 'Correlation Analysis',
      simpleText:
        'Correlation tests show whether participants who rate AI higher on Warmth or Trust also tend to report higher Trust or Willingness to Self-Disclose.',
      academicText: `Two-tailed bivariate correlations (${correlation?.deletionMode || 'pairwise'} deletion) examined relationships among PCW, PT, and WSD. ${
        correlation?.pairs
          ?.map(
            p =>
              `${p.varX}–${p.varY}: Pearson r = ${formatNumber(p.pearson?.r, 3)} (p ${formatPValue(p.pearson?.pValue) === '< .001' ? '< .001' : `= ${formatPValue(p.pearson?.pValue)}`}, 95% CI ${formatCI(p.pearson?.ci, 2)}, n = ${p.n}); Spearman ρ = ${formatNumber(p.spearman?.rho, 3)} (p ${formatPValue(p.spearman?.pValue) === '< .001' ? '< .001' : `= ${formatPValue(p.spearman?.pValue)}`})`
          )
          .join('. ')
      }.${h3DivergenceNote}`,
      whyMatters:
        'Quantifying direction, strength, precision (95% CI), and significance tests the theoretical model directly.',
    },
    {
      id: '4.11',
      title: 'Hypothesis Testing',
      simpleText:
        'Each research hypothesis (H1, H2, H3) is evaluated as Supported or Not supported based on the predefined primary Pearson correlation test.',
      academicText: `Confirmatory hypothesis testing (using predefined primary ${hypothesesResult?.methodUsed === 'spearman' ? "Spearman's ρ" : "Pearson's r"}, two-tailed α = ${hypothesesResult?.alphaLevel || 0.05}) yielded: H1 (PCW -> PT): ${h1?.decision} (r = ${formatNumber(h1?.coefficient, 3)}, p ${formatPValue(h1?.pValue) === '< .001' ? '< .001' : `= ${formatPValue(h1?.pValue)}`}); H2 (PT -> WSD): ${h2?.decision} (r = ${formatNumber(h2?.coefficient, 3)}, p ${formatPValue(h2?.pValue) === '< .001' ? '< .001' : `= ${formatPValue(h2?.pValue)}`}); H3 (PCW -> WSD): ${h3?.decision} (r = ${formatNumber(h3?.coefficient, 3)}, p ${formatPValue(h3?.pValue) === '< .001' ? '< .001' : `= ${formatPValue(h3?.pValue)}`}).${h3DivergenceNote} Because the research uses a cross-sectional correlational design, findings reflect statistical associations and do not establish causality.`,
      whyMatters:
        'Directly answers the core research questions of the thesis without overclaiming causation.',
    },
    {
      id: '4.12',
      title: 'Additional Exploratory Findings',
      simpleText:
        'Exploratory comparisons check whether scores appear to differ across gender, age groups, or usage frequency (when subgroup sizes are large enough).',
      academicText: `Optional exploratory subgroup comparisons (Welch's t-test, Mann-Whitney U, one-way ANOVA, and Kruskal-Wallis H) and simple linear regressions were evaluated only where subgroup sample requirements (n >= 2 per group) were met. All subgroup findings are strictly exploratory and hypothesis-generating rather than confirmatory.`,
      whyMatters:
        'Maintains strict separation between confirmatory hypothesis tests (H1–H3) and post-hoc exploratory checks.',
    },
    {
      id: '4.13',
      title: 'Summary of Major Findings',
      simpleText: `In summary, ${[h1, h2, h3].filter(h => h?.supported).length} of 3 primary hypotheses were statistically supported in this ${isProvisional ? 'provisional snapshot' : 'sample'} of N = ${validN} participants.`,
      academicText: `Across N = ${validN} valid adult respondents in Bangladesh, scale reliability was α = ${formatNumber(pcwRel?.alpha, 3)} (PCW), α = ${formatNumber(ptRel?.alpha, 3)} (PT), and α = ${formatNumber(wsdRel?.alpha, 3)} (WSD). Hypothesis outcomes under the primary Pearson test were: H1 — ${h1?.decision}; H2 — ${h2?.decision}; H3 — ${h3?.decision}.${h3DivergenceNote} Future interpretation in Chapter 5 should consider sample size, cross-sectional design limitations, and self-report bias.`,
      limitations:
        'Cross-sectional self-report survey data among convenience adult samples cannot establish causal direction.',
    },
  ];

  return {
    hasData: true,
    generatedAt: snapshotMeta?.analyzedAt || new Date().toISOString(),
    sections,
  };
}
