import {
  sections,
  likert,
  questionnaireInstruction,
  questionnaireInstructionBn,
  primaryAiToolOptions,
  QUESTIONNAIRE_VERSION,
  LEGACY_QUESTIONNAIRE_VERSION,
} from '../data/questions.js';

/**
 * Central Questionnaire Configuration
 * Derived directly from src/data/questions.js so all analysis modules stay synced
 * with the live 18-item questionnaire (4 PCW + 6 PT + 8 WSD).
 */
function buildConstructConfig(section, code, shortName) {
  const itemKeys = section.items.map((_, index) => `${section.prefix}_${index + 1}`);
  const reverseItems = Array.isArray(section.reverseItems)
    ? section.reverseItems.map(entry =>
        typeof entry === 'number' ? `${section.prefix}_${entry}` : entry
      )
    : [];

  return {
    id: section.id,
    code,
    shortName,
    name: section.title,
    nameBn: section.titleBn,
    prefix: section.prefix,
    description: section.description,
    descriptionBn: section.descriptionBn,
    itemCount: section.items.length,
    items: itemKeys,
    itemTexts: section.items,
    itemTextsBn: section.itemsBn || [],
    dbColumns: itemKeys,
    reverseItems,
    minItemScore: 1,
    maxItemScore: 5,
    minPossibleTotal: section.items.length * 1,
    maxPossibleTotal: section.items.length * 5,
    totalColumn: `${section.id}_total`,
    meanColumn: `${section.id}_mean`,
  };
}

const warmthSection = sections.find(s => s.id === 'warmth') || sections[0];
const trustSection = sections.find(s => s.id === 'trust') || sections[1];
const disclosureSection = sections.find(s => s.id === 'disclosure') || sections[2];

export const CONSTRUCTS = {
  PCW: buildConstructConfig(warmthSection, 'PCW', 'Warmth'),
  PT: buildConstructConfig(trustSection, 'PT', 'Trust'),
  WSD: buildConstructConfig(disclosureSection, 'WSD', 'Self-Disclosure'),
};

export const CONSTRUCT_LIST = [CONSTRUCTS.PCW, CONSTRUCTS.PT, CONSTRUCTS.WSD];

export const QUESTIONNAIRE_CONFIG = {
  studyTitle:
    'Perceived Conversational Warmth, Trust, and Willingness to Self-Disclose to Conversational AI: A Questionnaire-Based Study among Adults in Bangladesh.',
  institution: 'Department of Psychology, University of Dhaka',
  version: QUESTIONNAIRE_VERSION,
  legacyVersion: LEGACY_QUESTIONNAIRE_VERSION,
  likertMin: 1,
  likertMax: 5,
  likertScale: likert.map(([value, label, labelBn]) => ({
    value: Number(value),
    label,
    labelBn,
  })),
  instruction: questionnaireInstruction,
  instructionBn: questionnaireInstructionBn,
  primaryAiToolOptions,
  constructs: CONSTRUCTS,
  allItemKeys: CONSTRUCT_LIST.flatMap(c => c.items),
  totalItemCount: CONSTRUCT_LIST.reduce((sum, c) => sum + c.itemCount, 0),
  demographicFields: ['age_group', 'gender', 'education', 'occupation'],
  aiUsageFields: [
    'primary_ai_tool',
    'ai_tools',
    'ai_frequency',
    'ai_duration',
    'ai_purpose',
    'ai_familiarity',
  ],
  allowedAgeGroups: [
    '18–24 years',
    '25–34 years',
    '35–44 years',
    '45 years or above',
  ],
  allowedGenders: ['Male', 'Female', 'Other', 'Prefer not to say'],
  allowedEducations: [
    'Secondary',
    'Higher Secondary',
    'Undergraduate',
    'Postgraduate',
    'Other',
  ],
  allowedOccupations: [
    'Student',
    'Government employee',
    'Private-sector employee',
    'Business / Self-employed',
    'Other',
    'Prefer not to say',
  ],
  allowedFrequencies: [
    'Daily',
    'Several times a week',
    'Once a week',
    'A few times a month',
    'Rarely',
  ],
  allowedDurations: [
    'Less than 3 months',
    '3–6 months',
    '6–12 months',
    '1–2 years',
    'More than 2 years',
  ],
  allowedFamiliarities: [
    'Not very familiar',
    'Slightly familiar',
    'Moderately familiar',
    'Very familiar',
    'Extremely familiar',
  ],
  sensitiveColumns: ['withdrawal_code_hash'],
  scoringRules: {
    reverseFormula: '6 - originalScore',
    compositeRule: 'Complete construct items required (0 missing allowed for strict scoring; optional pro-rating available in settings)',
    decimalPrecision: 2,
  },
};
