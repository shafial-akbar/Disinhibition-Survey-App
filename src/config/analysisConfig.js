/**
 * Central Statistical & Research Analysis Configuration
 */
export const DEFAULT_ANALYSIS_SETTINGS = {
  // Missing data rule: 'complete_construct' requires all items in a scale; 'allow_partial_80' allows up to 20% missing with mean of valid items
  missingDataRule: 'complete_construct',
  // Correlation deletion method: 'pairwise' or 'listwise'
  correlationDeletion: 'pairwise',
  // Primary hypothesis testing method: 'pearson' or 'spearman'
  primaryHypothesisMethod: 'pearson',
  // Significance threshold (two-tailed)
  alphaLevel: 0.05,
  // Whether to exclude locked/expired rules differently; locked responses are valid completed responses, while withdrawn ones are deleted
  includeOnlyCurrentVersion: true,
  // Show Bangla explanations alongside simple English explanations
  showBanglaExplanations: true,
  // Decimal precision for display
  decimals: 3,
  // Software reproducibility metadata
  softwareVersion: '1.0.0',
};

export const RESEARCH_HYPOTHESES = [
  {
    id: 'H1',
    title: 'Warmth -> Trust',
    statement:
      'Perceived Conversational Warmth (PCW) is positively associated with Perceived Trust (PT).',
    statementBn:
      'কথোপকথনমূলক আন্তরিকতা (PCW) এবং অনুভূত বিশ্বাসের (PT) মধ্যে একটি ধনাত্মক সম্পর্ক রয়েছে।',
    varX: 'PCW',
    varY: 'PT',
  },
  {
    id: 'H2',
    title: 'Trust -> Self-Disclosure',
    statement:
      'Perceived Trust (PT) is positively associated with Willingness to Self-Disclose (WSD).',
    statementBn:
      'অনুভূত বিশ্বাস (PT) এবং আত্মপ্রকাশের ইচ্ছার (WSD) মধ্যে একটি ধনাত্মক সম্পর্ক রয়েছে।',
    varX: 'PT',
    varY: 'WSD',
  },
  {
    id: 'H3',
    title: 'Warmth -> Self-Disclosure',
    statement:
      'Perceived Conversational Warmth (PCW) is positively associated with Willingness to Self-Disclose (WSD).',
    statementBn:
      'কথোপকথনমূলক আন্তরিকতা (PCW) এবং আত্মপ্রকাশের ইচ্ছার (WSD) মধ্যে একটি ধনাত্মক সম্পর্ক রয়েছে।',
    varX: 'PCW',
    varY: 'WSD',
  },
];

export const RELIABILITY_THRESHOLDS = [
  { min: 0.9, label: 'Excellent internal consistency', labelBn: 'অত্যন্ত চমৎকার অভ্যন্তরীণ সামঞ্জস্য' },
  { min: 0.8, label: 'Good internal consistency', labelBn: 'ভালো অভ্যন্তরীণ সামঞ্জস্য' },
  { min: 0.7, label: 'Acceptable internal consistency', labelBn: 'গ্রহণযোগ্য অভ্যন্তরীণ সামঞ্জস্য' },
  { min: 0.6, label: 'Questionable internal consistency', labelBn: 'সন্দেহজনক বা মাঝারি সামঞ্জস্য' },
  { min: 0.5, label: 'Poor internal consistency', labelBn: 'দুর্বল অভ্যন্তরীণ সামঞ্জস্য' },
  { min: -Infinity, label: 'Unacceptable internal consistency', labelBn: 'অগ্রহণযোগ্য অভ্যন্তরীণ সামঞ্জস্য' },
];

export const CORRELATION_STRENGTH_BANDS = [
  { min: 0.7, label: 'Strong', labelBn: 'শক্তিশালী' },
  { min: 0.5, label: 'Moderate to Strong', labelBn: 'মাঝারি থেকে শক্তিশালী' },
  { min: 0.3, label: 'Moderate', labelBn: 'মাঝারি' },
  { min: 0.1, label: 'Weak', labelBn: 'দুর্বল' },
  { min: 0, label: 'Very Weak / Negligible', labelBn: 'অত্যন্ত দুর্বল / নগণ্য' },
];
