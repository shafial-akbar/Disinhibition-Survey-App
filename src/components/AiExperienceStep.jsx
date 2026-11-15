import React, { useState } from 'react';
import { Languages } from 'lucide-react';
import { Field, Select, Multi, Nav } from './FormControls';
import {
  primaryAiToolOptions,
  questionnaireInstruction,
  questionnaireInstructionBn,
} from '../data/questions';

export const toolOpts = [
  'ChatGPT',
  'Google Gemini',
  'Microsoft Copilot',
  'Claude',
  'Meta AI',
  'Perplexity AI',
  'DeepSeek',
  'Grok',
  'Mistral AI',
  'Poe',
  'Character.AI',
  'Pi AI',
  'You.com',
  'Amazon Q',
  'Le Chat',
  'HuggingChat',
  'Other AI chatbot',
];

export const purposeOpts = [
  'Education and learning',
  'Professional or work-related tasks',
  'Information searching',
  'Writing and communication',
  'Personal discussions',
  'Entertainment',
  'Other',
];

const FREQUENCY_OPTS = [
  'Daily',
  'Several times a week',
  'Once a week',
  'A few times a month',
  'Rarely',
];

const DURATION_OPTS = [
  'Less than 3 months',
  '3–6 months',
  '6–12 months',
  '1–2 years',
  'More than 2 years',
];

const FAMILIARITY_OPTS = [
  'Not very familiar',
  'Slightly familiar',
  'Moderately familiar',
  'Very familiar',
  'Extremely familiar',
];

const AI_EXPERIENCE_CONTENT = {
  en: {
    kicker: 'STEP 3 OF 7',
    heading: 'Your AI experience',
    subtitle: 'Answer based on your use of conversational AI tools.',
    instruction: questionnaireInstruction,
    toolsUsedLabel: 'Which conversational AI tools have you used?',
    primaryToolLabel: 'Which conversational AI tool do you use most frequently?',
    otherSpecifyLabel:
      'Please specify the conversational AI tool you use most frequently',
    otherPlaceholder:
      'Enter conversational AI tool name (e.g., Perplexity, DeepSeek, Poe)',
    frequencyLabel: 'How frequently do you use conversational AI?',
    durationLabel: 'How long have you been using conversational AI?',
    purposeLabel: 'What do you mainly use conversational AI for?',
    familiarityLabel: 'How familiar are you with conversational AI tools?',
    selectPlaceholder: 'Select an option',
    backLabel: 'Back',
    nextLabel: 'Continue',
    toolOptionLabels: {},
    primaryToolOptionLabels: {},
    frequencyOptionLabels: {},
    durationOptionLabels: {},
    purposeOptionLabels: {},
    familiarityOptionLabels: {},
  },
  bn: {
    kicker: 'ধাপ ৩ / ৭',
    heading: 'আপনার এআই ব্যবহারের অভিজ্ঞতা',
    subtitle: 'কনভার্সেশনাল এআই টুল ব্যবহারের অভিজ্ঞতার ভিত্তিতে উত্তর দিন।',
    instruction: questionnaireInstructionBn,
    toolsUsedLabel: 'আপনি কোন কোন কনভার্সেশনাল এআই টুল ব্যবহার করেছেন?',
    primaryToolLabel: 'আপনি কোন কনভার্সেশনাল এআই টুলটি সবচেয়ে বেশি ব্যবহার করেন?',
    otherSpecifyLabel:
      'আপনি সবচেয়ে বেশি ব্যবহার করেন এমন কনভার্সেশনাল এআই টুলটির নাম উল্লেখ করুন',
    otherPlaceholder:
      'কনভার্সেশনাল এআই টুলটির নাম লিখুন (যেমন: Perplexity, DeepSeek, Poe)',
    frequencyLabel: 'আপনি কত ঘন ঘন কনভার্সেশনাল এআই ব্যবহার করেন?',
    durationLabel: 'আপনি কতদিন ধরে কনভার্সেশনাল এআই ব্যবহার করছেন?',
    purposeLabel: 'আপনি মূলত কী কী কাজে কনভার্সেশনাল এআই ব্যবহার করেন?',
    familiarityLabel: 'কনভার্সেশনাল এআই টুল সম্পর্কে আপনি কতটা পরিচিত?',
    selectPlaceholder: 'একটি অপশন নির্বাচন করুন',
    backLabel: 'পিছনে',
    nextLabel: 'এগিয়ে যান',
    toolOptionLabels: {
      ChatGPT: 'ChatGPT',
      'Google Gemini': 'Google Gemini',
      'Microsoft Copilot': 'Microsoft Copilot',
      Claude: 'Claude',
      'Meta AI': 'Meta AI',
      'Other AI chatbot': 'অন্যান্য এআই চ্যাটবট (Other AI chatbot)',
    },
    primaryToolOptionLabels: {
      ChatGPT: 'ChatGPT',
      Gemini: 'Gemini',
      Claude: 'Claude',
      Copilot: 'Copilot',
      Other: 'অন্যান্য (Other)',
    },
    frequencyOptionLabels: {
      Daily: 'প্রতিদিন (Daily)',
      'Several times a week': 'সপ্তাহে কয়েকবার (Several times a week)',
      'Once a week': 'সপ্তাহে একবার (Once a week)',
      'A few times a month': 'মাসে কয়েকবার (A few times a month)',
      Rarely: 'খুব কম / কদাচিৎ (Rarely)',
    },
    durationOptionLabels: {
      'Less than 3 months': '৩ মাসের কম (Less than 3 months)',
      '3–6 months': '৩–৬ মাস (3–6 months)',
      '6–12 months': '৬–১২ মাস (6–12 months)',
      '1–2 years': '১–২ বছর (1–2 years)',
      'More than 2 years': '২ বছরের বেশি (More than 2 years)',
    },
    purposeOptionLabels: {
      'Education and learning': 'শিক্ষা ও শেখা (Education and learning)',
      'Professional or work-related tasks':
        'পেশাগত বা কাজের প্রয়োজনে (Professional or work-related tasks)',
      'Information searching': 'তথ্য অনুসন্ধান (Information searching)',
      'Writing and communication': 'লেখালেখি ও যোগাযোগ (Writing and communication)',
      'Personal discussions': 'ব্যক্তিগত আলোচনা (Personal discussions)',
      Entertainment: 'বিনোদন (Entertainment)',
      Other: 'অন্যান্য (Other)',
    },
    familiarityOptionLabels: {
      'Not very familiar': 'তেমন পরিচিত নই (Not very familiar)',
      'Slightly familiar': 'কিছুটা পরিচিত (Slightly familiar)',
      'Moderately familiar': 'মোটামুটি পরিচিত (Moderately familiar)',
      'Very familiar': 'বেশ ভালোভাবে পরিচিত (Very familiar)',
      'Extremely familiar': 'অত্যন্ত ভালোভাবে পরিচিত (Extremely familiar)',
    },
  },
};

export default function AiExperienceStep({ profile, setField, toggleField, back, next }) {
  const [lang, setLang] = useState('en');
  const t = AI_EXPERIENCE_CONTENT[lang];

  const selectedChoice =
    profile.primary_ai_tool_choice ||
    (primaryAiToolOptions.slice(0, 4).includes(profile.primary_ai_tool)
      ? profile.primary_ai_tool
      : profile.primary_ai_tool
      ? 'Other'
      : '');

  const handlePrimaryChoice = option => {
    setField('primary_ai_tool_choice', option);
    if (option === 'Other') {
      setField('primary_ai_tool', (profile.primary_ai_tool_other || '').trim());
    } else {
      setField('primary_ai_tool', option);
    }
  };

  const handleOtherTextChange = e => {
    const val = e.target.value;
    setField('primary_ai_tool_other', val);
    setField('primary_ai_tool_choice', 'Other');
    setField('primary_ai_tool', val.trim());
  };

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

      <div className="instruction-box">
        <p>{t.instruction}</p>
      </div>

      <Field label={t.toolsUsedLabel} required>
        <Multi
          vals={profile.ai_tools}
          toggle={v => toggleField('ai_tools', v)}
          opts={toolOpts}
          optionLabels={t.toolOptionLabels}
        />
      </Field>

      <Field label={t.primaryToolLabel} required>
        <div className="choices">
          {primaryAiToolOptions.map(option => (
            <label
              className={selectedChoice === option ? 'active' : ''}
              key={option}
            >
              <input
                type="radio"
                name="primary_ai_tool_choice"
                checked={selectedChoice === option}
                onChange={() => handlePrimaryChoice(option)}
              />
              {t.primaryToolOptionLabels[option] || option}
            </label>
          ))}
        </div>
        {selectedChoice === 'Other' && (
          <div className="other-tool-wrap">
            <label htmlFor="primary-ai-tool-other-input" className="field-sublabel">
              {t.otherSpecifyLabel} <b>*</b>
            </label>
            <input
              id="primary-ai-tool-other-input"
              type="text"
              className="text-input"
              placeholder={t.otherPlaceholder}
              value={profile.primary_ai_tool_other || ''}
              onChange={handleOtherTextChange}
            />
          </div>
        )}
      </Field>

      <Field label={t.frequencyLabel} required>
        <Select
          value={profile.ai_frequency}
          set={v => setField('ai_frequency', v)}
          opts={FREQUENCY_OPTS}
          placeholder={t.selectPlaceholder}
          optionLabels={t.frequencyOptionLabels}
        />
      </Field>

      <Field label={t.durationLabel} required>
        <Select
          value={profile.ai_duration}
          set={v => setField('ai_duration', v)}
          opts={DURATION_OPTS}
          placeholder={t.selectPlaceholder}
          optionLabels={t.durationOptionLabels}
        />
      </Field>

      <Field label={t.purposeLabel} required>
        <Multi
          vals={profile.ai_purpose}
          toggle={v => toggleField('ai_purpose', v)}
          opts={purposeOpts}
          optionLabels={t.purposeOptionLabels}
        />
      </Field>

      <Field label={t.familiarityLabel} required>
        <Select
          value={profile.ai_familiarity}
          set={v => setField('ai_familiarity', v)}
          opts={FAMILIARITY_OPTS}
          placeholder={t.selectPlaceholder}
          optionLabels={t.familiarityOptionLabels}
        />
      </Field>

      <Nav back={back} next={next} label={t.nextLabel} backLabel={t.backLabel} />
    </>
  );
}

