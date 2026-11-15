import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck, Languages } from 'lucide-react';
import { Row } from './FormControls';

const VALUE_TRANSLATIONS_BN = {
  '18–24 years': '১৮–২৪ বছর',
  '25–34 years': '২৫–৩৪ বছর',
  '35–44 years': '৩৫–৪৪ বছর',
  '45 years or above': '৪৫ বছর বা তার বেশি',
  'Other AI chatbot': 'অন্যান্য এআই চ্যাটবট',
  Daily: 'প্রতিদিন',
  'Several times a week': 'সপ্তাহে কয়েকবার',
  'Once a week': 'সপ্তাহে একবার',
  'A few times a month': 'মাসে কয়েকবার',
  Rarely: 'খুব কম / কদাচিৎ',
};

const REVIEW_CONTENT = {
  en: {
    kicker: 'FINAL STEP · REVIEW',
    heading: 'Review and submit',
    subtitle:
      'Please confirm that you have completed the questionnaire. Upon submission, you will receive a one-time Withdrawal Code valid for 3 calendar days.',
    ageGroupLabel: 'Age group',
    aiToolsLabel: 'AI tools used',
    primaryToolLabel: 'Most frequently used AI tool',
    aiFrequencyLabel: 'AI frequency',
    warmthLabel: 'Conversational warmth',
    warmthValue: '4 of 4 answered',
    trustLabel: 'Perceived trust',
    trustValue: '6 of 6 answered',
    disclosureLabel: 'Willingness to self-disclose',
    disclosureValue: '8 of 8 answered',
    confirmationText:
      'By submitting, you confirm that your answers reflect your own experience and contain no sensitive personal information. Make sure to save your Withdrawal Code on the next screen if you may wish to withdraw within 3 days.',
    backLabel: 'Back',
    submitLabel: 'Submit response',
    submittingLabel: 'Submitting…',
  },
  bn: {
    kicker: 'চূড়ান্ত ধাপ · পর্যালোচনা',
    heading: 'পর্যালোচনা ও জমা দিন',
    subtitle:
      'অনুগ্রহ করে নিশ্চিত করুন যে আপনি প্রশ্নমালাটি সম্পূর্ণ করেছেন। জমা দেওয়ার পর আপনি একটি এককালীন উইথড্রয়াল কোড (Withdrawal Code) পাবেন, যা ৩ ক্যালেন্ডার দিন পর্যন্ত কার্যকর থাকবে।',
    ageGroupLabel: 'বয়সের সীমা',
    aiToolsLabel: 'ব্যবহৃত এআই টুলসমূহ',
    primaryToolLabel: 'সবচেয়ে বেশি ব্যবহৃত এআই টুল',
    aiFrequencyLabel: 'এআই ব্যবহারের হার',
    warmthLabel: 'কথোপকথনমূলক আন্তরিকতা (Conversational warmth)',
    warmthValue: '৪টির মধ্যে ৪টি উত্তর দেওয়া হয়েছে',
    trustLabel: 'অনুভূত বিশ্বাস (Perceived trust)',
    trustValue: '৬টির মধ্যে ৬টি উত্তর দেওয়া হয়েছে',
    disclosureLabel: 'আত্মপ্রকাশের ইচ্ছা (Willingness to self-disclose)',
    disclosureValue: '৮টির মধ্যে ৮টি উত্তর দেওয়া হয়েছে',
    confirmationText:
      'জমা দেওয়ার মাধ্যমে আপনি নিশ্চিত করছেন যে আপনার উত্তরগুলো আপনার নিজস্ব অভিজ্ঞতার প্রতিফলন এবং এতে কোনো সংবেদনশীল ব্যক্তিগত তথ্য নেই। আপনি যদি ৩ দিনের মধ্যে উত্তর প্রত্যাহার করতে চান, তবে পরবর্তী স্ক্রিনে দেওয়া আপনার উইথড্রয়াল কোডটি অবশ্যই সংরক্ষণ করে রাখুন।',
    backLabel: 'পিছনে',
    submitLabel: 'উত্তর জমা দিন',
    submittingLabel: 'জমা হচ্ছে…',
  },
};

export default function ReviewStep({ profile, back, submit, busy }) {
  const [lang, setLang] = useState('en');
  const t = REVIEW_CONTENT[lang];

  const localizedAgeGroup =
    lang === 'bn'
      ? VALUE_TRANSLATIONS_BN[profile.age_group] || profile.age_group
      : profile.age_group;

  const localizedAiTools =
    lang === 'bn'
      ? profile.ai_tools.map(tool => VALUE_TRANSLATIONS_BN[tool] || tool).join(', ')
      : profile.ai_tools.join(', ');

  const localizedFrequency =
    lang === 'bn'
      ? VALUE_TRANSLATIONS_BN[profile.ai_frequency] || profile.ai_frequency
      : profile.ai_frequency;

  return (
    <>
      <div className="kicker-bar">
        <div className="kicker">{t.kicker}</div>
        <div className="kicker-actions">
          <button
            type="button"
            className="header-action-btn lang-toggle-btn"
            onClick={() => setLang(prev => (prev === 'en' ? 'bn' : 'en'))}
            title="Toggle English / বাংলা"
          >
            <Languages size={15} />
            <span>{lang === 'en' ? 'বাংলা' : 'English'}</span>
          </button>
        </div>
      </div>

      <h2>{t.heading}</h2>
      <p className="muted">{t.subtitle}</p>

      <div className="review">
        <Row label={t.ageGroupLabel} value={localizedAgeGroup} />
        <Row label={t.aiToolsLabel} value={localizedAiTools} />
        <Row label={t.primaryToolLabel} value={profile.primary_ai_tool} />
        <Row label={t.aiFrequencyLabel} value={localizedFrequency} />
        <Row label={t.warmthLabel} value={t.warmthValue} />
        <Row label={t.trustLabel} value={t.trustValue} />
        <Row label={t.disclosureLabel} value={t.disclosureValue} />
      </div>

      <aside>
        <ShieldCheck size={18} /> {t.confirmationText}
      </aside>

      <div className="nav">
        <button type="button" className="secondary" onClick={back}>
          <ArrowLeft size={16} /> {t.backLabel}
        </button>
        <button type="button" className="primary" disabled={busy} onClick={submit}>
          {busy ? t.submittingLabel : t.submitLabel} <ArrowRight size={17} />
        </button>
      </div>
    </>
  );
}
