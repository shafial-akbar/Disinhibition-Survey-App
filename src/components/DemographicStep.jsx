import React, { useState } from 'react';
import { Languages } from 'lucide-react';
import { Field, Select, Nav } from './FormControls';

const AGE_OPTS = ['18–24 years', '25–34 years', '35–44 years', '45 years or above'];
const GENDER_OPTS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const EDUCATION_OPTS = [
  'Secondary',
  'Higher Secondary',
  'Undergraduate',
  'Postgraduate',
  'Other',
];
const OCCUPATION_OPTS = [
  'Student',
  'Government employee',
  'Private-sector employee',
  'Business / Self-employed',
  'Other',
  'Prefer not to say',
];

const DEMOGRAPHIC_CONTENT = {
  en: {
    kicker: 'STEP 2 OF 7',
    heading: 'About you',
    subtitle: 'Please provide general demographic details only.',
    ageLabel: 'Age group',
    genderLabel: 'Gender',
    educationLabel: 'Highest educational qualification',
    occupationLabel: 'Current occupation',
    selectRequired: 'Select an option',
    selectOptional: 'Select an option (optional)',
    backLabel: 'Back',
    nextLabel: 'Continue',
    ageOptionLabels: {},
    genderOptionLabels: {},
    educationOptionLabels: {},
    occupationOptionLabels: {},
  },
  bn: {
    kicker: 'ধাপ ২ / ৭',
    heading: 'আপনার সম্পর্কে',
    subtitle: 'অনুগ্রহ করে শুধুমাত্র সাধারণ জনমিতিক (Demographic) তথ্য প্রদান করুন।',
    ageLabel: 'বয়সের সীমা (Age group)',
    genderLabel: 'লিঙ্গ (Gender)',
    educationLabel: 'সর্বোচ্চ শিক্ষাগত যোগ্যতা (Highest educational qualification)',
    occupationLabel: 'বর্তমান পেশা (Current occupation)',
    selectRequired: 'একটি অপশন নির্বাচন করুন',
    selectOptional: 'একটি অপশন নির্বাচন করুন (ঐচ্ছিক)',
    backLabel: 'পিছনে',
    nextLabel: 'এগিয়ে যান',
    ageOptionLabels: {
      '18–24 years': '১৮–২৪ বছর (18–24 years)',
      '25–34 years': '২৫–৩৪ বছর (25–34 years)',
      '35–44 years': '৩৫–৪৪ বছর (35–44 years)',
      '45 years or above': '৪৫ বছর বা তার বেশি (45 years or above)',
    },
    genderOptionLabels: {
      Male: 'পুরুষ (Male)',
      Female: 'নারী (Female)',
      Other: 'অন্যান্য (Other)',
      'Prefer not to say': 'বলতে ইচ্ছুক নই (Prefer not to say)',
    },
    educationOptionLabels: {
      Secondary: 'মাধ্যমিক / এসএসসি সমমান (Secondary)',
      'Higher Secondary': 'উচ্চ মাধ্যমিক / এইচএসসি সমমান (Higher Secondary)',
      Undergraduate: 'স্নাতক / অনার্স সমমান (Undergraduate)',
      Postgraduate: 'স্নাতকোত্তর / মাস্টার্স বা তদূর্ধ্ব (Postgraduate)',
      Other: 'অন্যান্য (Other)',
    },
    occupationOptionLabels: {
      Student: 'শিক্ষার্থী (Student)',
      'Government employee': 'সরকারি চাকরিজীবী (Government employee)',
      'Private-sector employee': 'বেসরকারি চাকরিজীবী (Private-sector employee)',
      'Business / Self-employed': 'ব্যবসা / আত্মকর্মসংস্থান (Business / Self-employed)',
      Other: 'অন্যান্য (Other)',
      'Prefer not to say': 'বলতে ইচ্ছুক নই (Prefer not to say)',
    },
  },
};

export default function DemographicStep({ profile, setField, back, next }) {
  const [lang, setLang] = useState('en');
  const t = DEMOGRAPHIC_CONTENT[lang];

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

      <Field label={t.ageLabel} required>
        <Select
          value={profile.age_group}
          set={v => setField('age_group', v)}
          opts={AGE_OPTS}
          placeholder={t.selectRequired}
          optionLabels={t.ageOptionLabels}
        />
      </Field>

      <Field label={t.genderLabel}>
        <Select
          value={profile.gender}
          set={v => setField('gender', v)}
          opts={GENDER_OPTS}
          optional
          placeholder={t.selectOptional}
          optionLabels={t.genderOptionLabels}
        />
      </Field>

      <Field label={t.educationLabel} required>
        <Select
          value={profile.education}
          set={v => setField('education', v)}
          opts={EDUCATION_OPTS}
          placeholder={t.selectRequired}
          optionLabels={t.educationOptionLabels}
        />
      </Field>

      <Field label={t.occupationLabel}>
        <Select
          value={profile.occupation}
          set={v => setField('occupation', v)}
          opts={OCCUPATION_OPTS}
          optional
          placeholder={t.selectOptional}
          optionLabels={t.occupationOptionLabels}
        />
      </Field>

      <Nav back={back} next={next} label={t.nextLabel} backLabel={t.backLabel} />
    </>
  );
}
