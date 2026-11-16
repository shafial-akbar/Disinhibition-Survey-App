import { QUESTIONNAIRE_CONFIG } from '../../config/questionnaireConfig.js';
import { formatApaStat, formatApaNoLeadingZero, formatApaPValue } from './apa7Formatter.js';
import { buildChapter4NumberingMap } from './apa7NumberingService.js';
import { formatCI } from '../../utils/formatters/numberFormatter.js';

/**
 * Chapter 4 Academic Narrative Generation Service
 * Dynamically generates concise APA 7th Edition paragraphs for all 8 sections
 * from live database calculations, using centralized Table/Figure numbering,
 * provisional withdrawal-window status detection, and H3 parametric/non-parametric caution.
 */

const TEXT_OVERRIDES_STORAGE_KEY = 'research_chapter4_apa7_text_overrides_v2';

/**
 * Section definitions using Title Case without numerical prefixes in headings per APA 7 rules.
 */
export const CHAPTER_4_SECTIONS_META = [
  { id: '4.1', number: '4.1', title: 'Introduction and Data Screening', shortTitle: 'Data Screening' },
  { id: '4.2', number: '4.2', title: 'Demographic Characteristics of Participants', shortTitle: 'Demographics' },
  { id: '4.3', number: '4.3', title: 'Conversational AI Usage Characteristics', shortTitle: 'AI Usage' },
  { id: '4.4', number: '4.4', title: 'Descriptive Statistics of Study Variables', shortTitle: 'Descriptive Statistics' },
  { id: '4.5', number: '4.5', title: 'Reliability and Normality Analysis', shortTitle: 'Reliability & Normality' },
  { id: '4.6', number: '4.6', title: 'Correlation Analysis', shortTitle: 'Correlation Analysis' },
  { id: '4.7', number: '4.7', title: 'Hypothesis Testing', shortTitle: 'Hypothesis Testing' },
  { id: '4.8', number: '4.8', title: 'Summary of Findings', shortTitle: 'Summary of Findings' },
];

/**
 * Helper to return the top category from a frequency table.
 */
function getTopCategory(freqTable) {
  const cats = [...(freqTable?.categories || [])].filter(c => c.count > 0);
  if (cats.length === 0) return null;
  cats.sort((a, b) => b.count - a.count);
  return cats[0];
}

/**
 * Helper to return the top option from a multi-select table.
 */
function getTopMultiOption(multiTable) {
  const opts = [...(multiTable?.options || [])].filter(o => o.count > 0);
  if (opts.length === 0) return null;
  opts.sort((a, b) => b.count - a.count);
  return opts[0];
}

/**
 * Generates dynamic APA 7 academic narrative paragraphs for all 8 sections
 * using actual computed statistics and centralized Table/Figure numbering.
 *
 * @param {Object} stats - Output from computeChapter4Statistics()
 * @param {Object} textOverrides - Optional researcher manual edits keyed by section ID
 * @param {Object} apaSettings - Active APA 7 formatting and numbering configuration
 * @returns {Object} Structured narrative object keyed by section ID ('4.1'..'4.8')
 */
export function generateChapter4Narratives(stats, textOverrides = {}, apaSettings = {}) {
  const screening = stats?.screening || {};
  const validN = screening.validN ?? 0;
  const retrievedN = screening.retrievedN ?? 0;
  const excludedN = screening.excludedN ?? 0;
  const lockedN = screening.lockedN ?? 0;
  const pendingN = screening.pendingN ?? 0;
  const isProvisional = pendingN > 0;
  const version = screening.questionnaireVersion || QUESTIONNAIRE_CONFIG.version;

  const numMap = buildChapter4NumberingMap(apaSettings);
  const { tables: T, figures: F } = numMap;

  if (!stats?.hasData || validN === 0) {
    const emptyMsg = `At the time of analysis, N = ${retrievedN} total record(s) were retrieved from the database and N = ${validN} valid cases were available for statistical analysis. Quantitative findings, APA tables, and figures will populate automatically once eligible participant responses are recorded.`;
    const emptyMap = {};
    for (const sec of CHAPTER_4_SECTIONS_META) {
      emptyMap[sec.id] = {
        ...sec,
        introText: emptyMsg,
        findingsText: '',
        interpretationText: '',
        isEdited: Boolean(textOverrides?.[sec.id]),
        customText: textOverrides?.[sec.id] || null,
      };
    }
    return emptyMap;
  }

  // Extract key statistics for dynamic academic prose
  const topAge = getTopCategory(stats.demographics?.age_group);
  const topGender = getTopCategory(stats.demographics?.gender);
  const topEdu = getTopCategory(stats.demographics?.education);
  const topOcc = getTopCategory(stats.demographics?.occupation);

  const topPrimaryTool = getTopCategory(stats.aiUsage?.primary_ai_tool);
  const topFreq = getTopCategory(stats.aiUsage?.ai_frequency);
  const topDur = getTopCategory(stats.aiUsage?.ai_duration);
  const topFam = getTopCategory(stats.aiUsage?.ai_familiarity);
  const topUsedTool = getTopMultiOption(stats.aiUsage?.ai_tools);
  const topPurpose = getTopMultiOption(stats.aiUsage?.ai_purpose);

  const pcwVar = stats.studyVariables?.find(v => v.code === 'PCW')?.meanStats;
  const ptVar = stats.studyVariables?.find(v => v.code === 'PT')?.meanStats;
  const wsdVar = stats.studyVariables?.find(v => v.code === 'WSD')?.meanStats;

  const pcwRel = stats.reliability?.scales?.find(s => s.code === 'PCW');
  const ptRel = stats.reliability?.scales?.find(s => s.code === 'PT');
  const wsdRel = stats.reliability?.scales?.find(s => s.code === 'WSD');

  const pcwNorm = stats.normality?.scales?.find(s => s.code === 'PCW');
  const ptNorm = stats.normality?.scales?.find(s => s.code === 'PT');
  const wsdNorm = stats.normality?.scales?.find(s => s.code === 'WSD');

  const pairH1 = stats.correlation?.pairs?.find(p => p.id === 'H1');
  const pairH2 = stats.correlation?.pairs?.find(p => p.id === 'H2');
  const pairH3 = stats.correlation?.pairs?.find(p => p.id === 'H3');

  const hyp1 = stats.hypothesisTesting?.hypotheses?.find(h => h.id === 'H1');
  const hyp2 = stats.hypothesisTesting?.hypotheses?.find(h => h.id === 'H2');
  const hyp3 = stats.hypothesisTesting?.hypotheses?.find(h => h.id === 'H3');

  // Detect whether H3 (or any pair) has a significant Pearson r but non-significant Spearman rho
  const h3PearsonSig =
    pairH3?.pearson?.pValue !== null &&
    pairH3?.pearson?.pValue !== undefined &&
    pairH3.pearson.pValue < 0.05;
  const h3SpearmanNonSig =
    pairH3?.spearman?.pValue !== null &&
    pairH3?.spearman?.pValue !== undefined &&
    pairH3.spearman.pValue >= 0.05;

  const h3DivergenceCaution =
    h3PearsonSig && h3SpearmanNonSig
      ? ` Notably, for the association between Perceived Conversational Warmth (PCW) and Willingness to Self-Disclose (WSD), the predefined primary parametric Pearson correlation reached statistical significance (r = ${formatApaNoLeadingZero(pairH3?.pearson?.r, 3)}, p ${formatApaPValue(pairH3?.pearson?.pValue, true)}), whereas the non-parametric Spearman rank-order correlation did not reach statistical significance (ρ = ${formatApaNoLeadingZero(pairH3?.spearman?.rho, 3)}, p ${formatApaPValue(pairH3?.spearman?.pValue, true)}). Because Pearson's r evaluates linear covariance on interval-scaled composites while Spearman's ρ evaluates monotonic rank order and is less sensitive to extreme score pairings, this divergence indicates that the positive association for H3 should be interpreted with appropriate statistical caution.`
      : '';

  const screeningSnapshotText = isProvisional
    ? `Following data screening, ${excludedN} response(s) were excluded, resulting in a provisional analytical sample of N = ${validN} eligible participants (${pendingN} response(s) currently within the active 3-calendar-day participant withdrawal window and ${lockedN} locked post-withdrawal window). Because ${pendingN === validN ? `all ${validN}` : `${pendingN} of the ${validN}`} eligible responses remain within the active 3-day withdrawal period, this report represents a provisional analysis snapshot rather than the final locked dataset.`
    : `Following data screening, ${excludedN} response(s) were excluded, resulting in a final locked analytical sample of N = ${validN} valid participants (${lockedN} locked post-withdrawal window; ${pendingN} within the 3-calendar-day withdrawal window).`;

  const screeningInterpretationText = isProvisional
    ? `All composite scale scores and inferential tests reported in subsequent sections are derived from this provisional analytical sample (N = ${validN}) without imputation or modification of raw item responses. After the 3-day participant withdrawal period concludes and final screening is completed, the report can be regenerated to reflect the final locked dataset.`
    : `All composite scale scores and inferential tests reported in subsequent sections are derived strictly from the screened analytical sample (N = ${validN}) without imputation or modification of raw item responses.`;

  const sections = {
    '4.1': {
      id: '4.1',
      number: '4.1',
      title: 'Introduction and Data Screening',
      introText: `This chapter presents the empirical findings of the quantitative, cross-sectional, non-experimental, correlational study titled "${QUESTIONNAIRE_CONFIG.studyTitle}". Data were collected from adult conversational AI users in Bangladesh using an 18-item five-point Likert-scale instrument (${version}) measuring Perceived Conversational Warmth (PCW; 4 items, CW_1 to CW_4), Perceived Trust (PT; 6 items, PT_1 to PT_6), and Willingness to Self-Disclose (WSD; 8 items, SD_1 to SD_8).`,
      findingsText: `Prior to statistical analysis, all retrieved records were screened for eligibility, item completeness, valid Likert scale bounds (1 to 5), questionnaire version consistency (${version}), and participant withdrawal status (${T.t1}). A total of N = ${retrievedN} responses were retrieved from the database. ${screeningSnapshotText}`,
      interpretationText: screeningInterpretationText,
    },
    '4.2': {
      id: '4.2',
      number: '4.2',
      title: 'Demographic Characteristics of Participants',
      introText: `Demographic distributions of the analytical sample (N = ${validN}) across age group, gender, educational attainment, and occupation are presented in ${T.t2} and illustrated in ${numMap.figureRange(1, 4)} (${F.f1}, ${F.f2}, ${F.f3}, and ${F.f4}).`,
      findingsText: `${
        topAge
          ? `With respect to age distribution (${F.f1}), the largest group of participants belonged to the ${topAge.category} category (n = ${topAge.count}, ${formatApaStat(topAge.percentTotal, 1)}%). `
          : ''
      }${
        topGender
          ? `Regarding gender (${F.f2}), the highest proportion identified as ${topGender.category} (n = ${topGender.count}, ${formatApaStat(topGender.percentTotal, 1)}%). `
          : ''
      }${
        topEdu
          ? `In terms of educational qualification (${F.f3}), the modal group was ${topEdu.category} (n = ${topEdu.count}, ${formatApaStat(topEdu.percentTotal, 1)}%), `
          : ''
      }${
        topOcc
          ? `and the most common occupational category (${F.f4}) was ${topOcc.category} (n = ${topOcc.count}, ${formatApaStat(topOcc.percentTotal, 1)}%).`
          : ''
      }`,
      interpretationText: `Overall, the demographic profile reflects adult participants in Bangladesh who actively engage with conversational AI systems in academic, professional, and everyday contexts.`,
    },
    '4.3': {
      id: '4.3',
      number: '4.3',
      title: 'Conversational AI Usage Characteristics',
      introText: `Participants reported their primary conversational AI platform, frequency of use, duration of experience, familiarity, all platforms used, and purposes of use (${T.t3}; ${numMap.figurePair(5, 6)}). For multiple-response items, percentages were calculated using the valid participant count (N = ${validN}) as the denominator.`,
      findingsText: `${
        topPrimaryTool
          ? `As shown in ${T.t3} and ${F.f5}, the most frequently used primary conversational AI tool was ${topPrimaryTool.category} (n = ${topPrimaryTool.count}, ${formatApaStat(topPrimaryTool.percentTotal, 1)}%). `
          : ''
      }${
        topFreq
          ? `In terms of usage frequency (${F.f6}), the largest share of respondents reported using conversational AI ${topFreq.category.toLowerCase()} (n = ${topFreq.count}, ${formatApaStat(topFreq.percentTotal, 1)}%), `
          : ''
      }${
        topDur
          ? `with a modal usage duration of ${topDur.category} (n = ${topDur.count}, ${formatApaStat(topDur.percentTotal, 1)}%). `
          : ''
      }${
        topFam
          ? `Most participants described themselves as ${topFam.category.toLowerCase()} with conversational AI (n = ${topFam.count}, ${formatApaStat(topFam.percentTotal, 1)}%). `
          : ''
      }${
        topUsedTool
          ? `Across multiple-response platform selections, ${topUsedTool.option} was selected by ${topUsedTool.count} participants (${formatApaStat(topUsedTool.percentOfRespondents, 1)}% of valid respondents), `
          : ''
      }${
        topPurpose
          ? `and the most frequently endorsed purpose of use was ${topPurpose.option} (n = ${topPurpose.count}, ${formatApaStat(topPurpose.percentOfRespondents, 1)}%).`
          : ''
      }`,
      interpretationText: `These usage patterns confirm that respondents possessed direct, ongoing interaction experience with their selected primary conversational AI platform prior to evaluating perceived warmth, trust, and willingness to self-disclose.`,
    },
    '4.4': {
      id: '4.4',
      number: '4.4',
      title: 'Descriptive Statistics of Study Variables',
      introText: `Composite mean and total scores were computed for Perceived Conversational Warmth (PCW; 4 items), Perceived Trust (PT; 6 items), and Willingness to Self-Disclose (WSD; 8 items) on a 5-point Likert scale ranging from 1 (Strongly Disagree) to 5 (Strongly Agree). Sample standard deviations were calculated using the n − 1 denominator (${T.t4}).`,
      findingsText: `Across the analytical sample (N = ${validN}), Perceived Conversational Warmth yielded a mean score of M = ${formatApaStat(pcwVar?.mean, 2)} (SD = ${formatApaStat(pcwVar?.sd, 2)}, Mdn = ${formatApaStat(pcwVar?.median, 2)}, range = ${formatApaStat(pcwVar?.min, 2)}–${formatApaStat(pcwVar?.max, 2)}). Perceived Trust demonstrated a mean score of M = ${formatApaStat(ptVar?.mean, 2)} (SD = ${formatApaStat(ptVar?.sd, 2)}, Mdn = ${formatApaStat(ptVar?.median, 2)}, range = ${formatApaStat(ptVar?.min, 2)}–${formatApaStat(ptVar?.max, 2)}). Willingness to Self-Disclose recorded a mean of M = ${formatApaStat(wsdVar?.mean, 2)} (SD = ${formatApaStat(wsdVar?.sd, 2)}, Mdn = ${formatApaStat(wsdVar?.median, 2)}, range = ${formatApaStat(wsdVar?.min, 2)}–${formatApaStat(wsdVar?.max, 2)}).`,
      interpretationText: `The observed central tendency and dispersion metrics in ${T.t4} indicate moderate-to-high endorsement of conversational warmth and trust alongside variability in participants' willingness to disclose non-sensitive personal information to conversational AI.`,
    },
    '4.5': {
      id: '4.5',
      number: '4.5',
      title: 'Reliability and Normality Analysis',
      introText: `Internal consistency reliability was assessed for each multi-item construct using Cronbach's alpha computed from raw item-level responses (${numMap.tablePair(5, 6)}). Distributional normality of composite scores was evaluated using the Shapiro-Wilk test, skewness, kurtosis, histograms, and normal Q-Q plots (${T.t7}; ${numMap.figureRange(7, 12)}).`,
      findingsText: `As reported in ${T.t5} and item-level diagnostics in ${T.t6}, Cronbach's alpha coefficients were α = ${formatApaNoLeadingZero(pcwRel?.alpha, 3)} for Perceived Conversational Warmth (4 items; ${pcwRel?.interpretation?.label || 'N/A'}), α = ${formatApaNoLeadingZero(ptRel?.alpha, 3)} for Perceived Trust (6 items; ${ptRel?.interpretation?.label || 'N/A'}), and α = ${formatApaNoLeadingZero(wsdRel?.alpha, 3)} for Willingness to Self-Disclose (8 items; ${wsdRel?.interpretation?.label || 'N/A'}). Shapiro-Wilk normality tests (${T.t7}) yielded W = ${formatApaStat(pcwNorm?.wStatistic, 3)} (p ${formatApaPValue(pcwNorm?.pValue, true)}, skewness = ${formatApaStat(pcwNorm?.skewness, 2)}, kurtosis = ${formatApaStat(pcwNorm?.kurtosis, 2)}) for PCW (${F.f7} and ${F.f8}); W = ${formatApaStat(ptNorm?.wStatistic, 3)} (p ${formatApaPValue(ptNorm?.pValue, true)}, skewness = ${formatApaStat(ptNorm?.skewness, 2)}, kurtosis = ${formatApaStat(ptNorm?.kurtosis, 2)}) for PT (${F.f9} and ${F.f10}); and W = ${formatApaStat(wsdNorm?.wStatistic, 3)} (p ${formatApaPValue(wsdNorm?.pValue, true)}, skewness = ${formatApaStat(wsdNorm?.skewness, 2)}, kurtosis = ${formatApaStat(wsdNorm?.kurtosis, 2)}) for WSD (${F.f11} and ${F.f12}).`,
      interpretationText: `Because normality tests are sensitive to sample size and ordinal composite distributions can exhibit mild skewness or tail departures across ${numMap.figureRange(7, 12)}, both parametric (Pearson's r) and non-parametric rank-order (Spearman's ρ) correlation coefficients are reported alongside one another.`,
    },
    '4.6': {
      id: '4.6',
      number: '4.6',
      title: 'Correlation Analysis',
      introText: `Two-tailed bivariate correlation analyses (Pearson product-moment correlation r and Spearman rank-order correlation ρ) were conducted to examine the associations among Perceived Conversational Warmth (PCW), Perceived Trust (PT), and Willingness to Self-Disclose (WSD) (${numMap.tableRange(8, 10)}; ${numMap.figureRange(13, 16)}).`,
      findingsText: `As detailed in ${T.t8}, ${T.t9} (Pearson matrix), ${T.t10} (Spearman matrix), and the correlation heatmap (${F.f13}), for the association between PCW and PT (${F.f14}), results showed r(${Math.max(0, (pairH1?.n || 0) - 2)}) = ${formatApaNoLeadingZero(pairH1?.pearson?.r, 3)}, p ${formatApaPValue(pairH1?.pearson?.pValue, true)}, 95% CI ${formatCI(pairH1?.pearson?.ci, 2)} (Spearman ρ = ${formatApaNoLeadingZero(pairH1?.spearman?.rho, 3)}, p ${formatApaPValue(pairH1?.spearman?.pValue, true)}, n = ${pairH1?.n ?? 0}). For PT and WSD (${F.f15}), results indicated r(${Math.max(0, (pairH2?.n || 0) - 2)}) = ${formatApaNoLeadingZero(pairH2?.pearson?.r, 3)}, p ${formatApaPValue(pairH2?.pearson?.pValue, true)}, 95% CI ${formatCI(pairH2?.pearson?.ci, 2)} (Spearman ρ = ${formatApaNoLeadingZero(pairH2?.spearman?.rho, 3)}, p ${formatApaPValue(pairH2?.spearman?.pValue, true)}, n = ${pairH2?.n ?? 0}). For PCW and WSD (${F.f16}), analysis revealed r(${Math.max(0, (pairH3?.n || 0) - 2)}) = ${formatApaNoLeadingZero(pairH3?.pearson?.r, 3)}, p ${formatApaPValue(pairH3?.pearson?.pValue, true)}, 95% CI ${formatCI(pairH3?.pearson?.ci, 2)} (Spearman ρ = ${formatApaNoLeadingZero(pairH3?.spearman?.rho, 3)}, p ${formatApaPValue(pairH3?.spearman?.pValue, true)}, n = ${pairH3?.n ?? 0}).`,
      interpretationText: `The correlation matrices (${T.t9} and ${T.t10}) and bivariate scatterplots (${F.f14}, ${F.f15}, and ${F.f16}) illustrate the direction, magnitude, and precision of the linear and monotonic associations among the three study constructs.${h3DivergenceCaution}`,
    },
    '4.7': {
      id: '4.7',
      number: '4.7',
      title: 'Hypothesis Testing',
      introText: `The three pre-specified correlational research hypotheses (H1, H2, and H3) were evaluated using two-tailed Pearson product-moment correlation tests as the predefined primary hypothesis test at the α = .05 significance threshold (${T.t11}).`,
      findingsText: `Hypothesis 1 (H1), which posited that Perceived Conversational Warmth is positively associated with Perceived Trust, was ${hyp1?.decision?.toLowerCase() || 'evaluated'} (r = ${formatApaNoLeadingZero(hyp1?.coefficient, 3)}, p ${formatApaPValue(hyp1?.pValue, true)}, 95% CI ${formatCI(hyp1?.ci, 2)}, n = ${hyp1?.n ?? 0}). Hypothesis 2 (H2), which proposed that Perceived Trust is positively associated with Willingness to Self-Disclose, was ${hyp2?.decision?.toLowerCase() || 'evaluated'} (r = ${formatApaNoLeadingZero(hyp2?.coefficient, 3)}, p ${formatApaPValue(hyp2?.pValue, true)}, 95% CI ${formatCI(hyp2?.ci, 2)}, n = ${hyp2?.n ?? 0}). Hypothesis 3 (H3), which stated that Perceived Conversational Warmth is positively associated with Willingness to Self-Disclose, was ${hyp3?.decision?.toLowerCase() || 'evaluated'} based on the predefined primary Pearson test (r = ${formatApaNoLeadingZero(hyp3?.coefficient, 3)}, p ${formatApaPValue(hyp3?.pValue, true)}, 95% CI ${formatCI(hyp3?.ci, 2)}, n = ${hyp3?.n ?? 0}).`,
      interpretationText: `${
        h3PearsonSig && h3SpearmanNonSig
          ? `Although H3 is supported under the predefined primary parametric test (Pearson's r = ${formatApaNoLeadingZero(pairH3?.pearson?.r, 3)}, p ${formatApaPValue(pairH3?.pearson?.pValue, true)}), the corresponding non-parametric Spearman rank-order correlation was not statistically significant (ρ = ${formatApaNoLeadingZero(pairH3?.spearman?.rho, 3)}, p ${formatApaPValue(pairH3?.spearman?.pValue, true)}); consequently, the direct association between Perceived Conversational Warmth and Willingness to Self-Disclose should be interpreted with caution. `
          : ''
      }Furthermore, because this study employed a cross-sectional, non-experimental correlational design, these results reflect statistical associations among variables and must not be interpreted as evidence of causal direction.`,
    },
    '4.8': {
      id: '4.8',
      number: '4.8',
      title: 'Summary of Findings',
      introText: `In summary, Chapter 4 examined data from N = ${validN} eligible adult conversational AI users in Bangladesh${isProvisional ? ' in this provisional analysis snapshot' : ''} across the 18-item study instrument.`,
      findingsText: `Descriptive and psychometric analyses (${T.t4} and ${T.t5}) established scale means of M = ${formatApaStat(pcwVar?.mean, 2)} (α = ${formatApaNoLeadingZero(pcwRel?.alpha, 3)}) for Perceived Conversational Warmth, M = ${formatApaStat(ptVar?.mean, 2)} (α = ${formatApaNoLeadingZero(ptRel?.alpha, 3)}) for Perceived Trust, and M = ${formatApaStat(wsdVar?.mean, 2)} (α = ${formatApaNoLeadingZero(wsdRel?.alpha, 3)}) for Willingness to Self-Disclose. Confirmatory hypothesis testing at α = .05 (two-tailed Pearson correlation; ${T.t11}) indicated the following outcomes: H1 (PCW and PT): ${hyp1?.decision || 'N/A'}; H2 (PT and WSD): ${hyp2?.decision || 'N/A'}; and H3 (PCW and WSD): ${hyp3?.decision || 'N/A'}${h3PearsonSig && h3SpearmanNonSig ? ' (with an academic caution noting that the non-parametric Spearman correlation for H3 was non-significant)' : ''}.`,
      interpretationText: `These empirical findings provide the quantitative foundation for theoretical discussion, practical implications, and methodological limitations in Chapter 5.${isProvisional ? ' Final verification should be re-run once the 3-day participant withdrawal window has closed for all responses.' : ''}`,
    },
  };

  // Merge any manual researcher overrides
  for (const key of Object.keys(sections)) {
    const override = textOverrides?.[key];
    sections[key].isEdited = Boolean(override);
    sections[key].customText = override || null;
  }

  return sections;
}

/**
 * Loads saved per-section researcher text overrides from localStorage.
 */
export function loadChapter4TextOverrides() {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(TEXT_OVERRIDES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Saves a manual paragraph override for a specific section ID ('4.1'..'4.8').
 */
export function saveChapter4SectionOverride(sectionId, customParagraphsObject) {
  const current = loadChapter4TextOverrides();
  const updated = {
    ...current,
    [sectionId]: {
      ...customParagraphsObject,
      updatedAt: new Date().toISOString(),
    },
  };
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(TEXT_OVERRIDES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
  return updated;
}

/**
 * Resets a single section back to dynamic auto-generated text.
 */
export function resetChapter4SectionOverride(sectionId) {
  const current = loadChapter4TextOverrides();
  delete current[sectionId];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(TEXT_OVERRIDES_STORAGE_KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
  }
  return { ...current };
}

/**
 * Clears all manual overrides so every section uses fresh live auto-generated text.
 */
export function clearAllChapter4Overrides() {
  if (typeof window !== 'undefined' || !window.localStorage) {
    try {
      window.localStorage.removeItem(TEXT_OVERRIDES_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  return {};
}
