import React, { useState } from 'react';
import { Languages, Download } from 'lucide-react';
import { Field, Choices, Nav } from './FormControls';
import { downloadPdfAndWord } from '../lib/documentExport';

const CONSENT_CONTENT = {
  en: {
    kicker: 'STEP 1 OF 7',
    heading: 'Consent and eligibility',
    subtitle: 'Read the summary below and confirm your eligibility to participate.',
    boxHeading: 'Informed Consent',
    studyTitleLabel: 'Study Title:',
    studyTitle:
      'Perceived Conversational Warmth, Trust, and Willingness to Self-Disclose to Conversational AI: A Questionnaire-Based Study among Adults in Bangladesh.',
    inviteParagraph:
      'You are invited to participate in an academic research study conducted as part of the Professional MS in Psychology programme at the Department of Psychology, University of Dhaka.',
    bullets: [
      'Participation is voluntary and you may stop before submitting without any penalty.',
      'You must be at least 18 years old and have previously used conversational AI.',
      'The questionnaire will take approximately 8–12 minutes.',
      'No clinical assessment, treatment, or live AI chat interaction will take place.',
      'You will not be asked to provide sensitive personal information.',
      'Your responses will be handled confidentially and accessed only by the principal investigator and authorised research supervisor.',
    ],
    policyHeading: 'Withdrawal & 3-Day Data Deletion Policy:',
    policyPrefix: 'After submitting your response, you will receive a unique ',
    policyCodeBold: 'Withdrawal Code',
    policyMiddle1:
      '. You must save this code securely because it is not stored in plain text and cannot be retrieved later. You may request deletion of your submitted response within ',
    policyDaysBold: '3 calendar days',
    policyMiddle2: ' on the ',
    policyLinkLabel: 'Withdraw My Response',
    policySuffix: ' page. After 3 calendar days, your response will be locked for research analysis.',
    ageQuestion: 'Are you 18 years of age or older?',
    usedQuestion: 'Have you previously used a conversational AI tool?',
    choiceLabels: { yes: 'Yes', no: 'No' },
    consentCheckbox:
      'I have read and understood the participant information. I voluntarily agree to participate in this research study.',
    backLabel: 'Back',
    nextLabel: 'Continue',
    downloadBtnLabel: 'Download (PDF & Word)',
  },
  bn: {
    kicker: 'ধাপ ১ / ৭ · সম্মতি ও যোগ্যতা',
    heading: 'সম্মতি ও অংশগ্রহণের যোগ্যতা',
    subtitle: 'নিচের সারসংক্ষেপটি পড়ুন এবং গবেষণায় অংশগ্রহণের জন্য আপনার যোগ্যতা ও সম্মতি নিশ্চিত করুন।',
    boxHeading: 'অবহিত সম্মতিপত্র (Informed Consent)',
    studyTitleLabel: 'গবেষণার শিরোনাম:',
    studyTitle:
      'কনভার্সেশনাল এআই-এর প্রতি অনুভূত আন্তরিকতা, বিশ্বাস এবং নিজের সাধারণ তথ্য শেয়ার করার ইচ্ছা: বাংলাদেশের প্রাপ্তবয়স্কদের ওপর একটি প্রশ্নমালাভিত্তিক গবেষণা।',
    inviteParagraph:
      'ঢাকা বিশ্ববিদ্যালয়ের মনোবিজ্ঞান বিভাগের প্রফেশনাল এমএস ইন সাইকোলজি (Professional MS in Psychology) প্রোগ্রামের অংশ হিসেবে পরিচালিত একটি একাডেমিক গবেষণায় অংশগ্রহণের জন্য আপনাকে আমন্ত্রণ জানানো হচ্ছে।',
    bullets: [
      'অংশগ্রহণ সম্পূর্ণ ঐচ্ছিক এবং উত্তর জমা দেওয়ার আগে যেকোনো সময় কোনো জরিমানা ছাড়াই আপনি তা বন্ধ করতে পারবেন।',
      'অংশগ্রহণের জন্য আপনার বয়স কমপক্ষে ১৮ বছর হতে হবে এবং পূর্বে কনভার্সেশনাল এআই ব্যবহারের অভিজ্ঞতা থাকতে হবে।',
      'প্রশ্নমালাটি সম্পূর্ণ করতে আনুমানিক ৮–১২ মিনিট সময় লাগবে।',
      'এতে কোনো ক্লিনিক্যাল মূল্যায়ন, চিকিৎসা বা সরাসরি এআই চ্যাট কথোপকথন অন্তর্ভুক্ত নয়।',
      'আপনার কাছে কোনো সংবেদনশীল ব্যক্তিগত তথ্য চাওয়া হবে না।',
      'আপনার দেওয়া উত্তরগুলো সম্পূর্ণ গোপনীয়তার সঙ্গে সংরক্ষণ করা হবে এবং শুধুমাত্র প্রধান গবেষক ও অনুমোদিত গবেষণা তত্ত্বাবধায়ক তা দেখতে পারবেন।',
    ],
    policyHeading: 'প্রত্যাহার ও ৩ দিনের মধ্যে তথ্য মুছে ফেলার নীতি:',
    policyPrefix: 'আপনার উত্তর জমা দেওয়ার পর আপনি একটি অনন্য ',
    policyCodeBold: 'প্রত্যাহার কোড (Withdrawal Code)',
    policyMiddle1:
      ' পাবেন। এই কোডটি নিরাপদে সংরক্ষণ করতে হবে কারণ এটি প্লেইন টেক্সটে সংরক্ষিত থাকে না এবং পরে আর পুনরুদ্ধার করা সম্ভব নয়। উত্তর জমা দেওয়ার পর ',
    policyDaysBold: '৩ ক্যালেন্ডার দিনের',
    policyMiddle2: ' মধ্যে নির্ধারিত ',
    policyLinkLabel: 'Withdraw My Response',
    policySuffix:
      ' পেজে গিয়ে আপনি আপনার জমা দেওয়া উত্তর মুছে ফেলার অনুরোধ করতে পারবেন। ৩ ক্যালেন্ডার দিন পর আপনার উত্তর গবেষণা বিশ্লেষণের জন্য লক হয়ে যাবে।',
    ageQuestion: 'আপনার বয়স কি ১৮ বছর বা তার বেশি?',
    usedQuestion: 'আপনি কি এর আগে কখনো কনভার্সেশনাল এআই টুল ব্যবহার করেছেন?',
    choiceLabels: { yes: 'হ্যাঁ (Yes)', no: 'না (No)' },
    consentCheckbox:
      'আমি অংশগ্রহণকারীর তথ্যপত্রটি পড়েছি এবং বুঝতে পেরেছি। আমি স্বেচ্ছায় এই গবেষণায় অংশগ্রহণ করতে সম্মতি দিচ্ছি।',
    backLabel: 'পিছনে',
    nextLabel: 'এগিয়ে যান',
    downloadBtnLabel: 'ডাউনলোড (PDF ও Word)',
  },
};

export default function ConsentStep({
  age,
  setAge,
  used,
  setUsed,
  consent,
  setConsent,
  onGoWithdraw,
  back,
  next,
}) {
  const [lang, setLang] = useState('en');
  const t = CONSENT_CONTENT[lang];

  const handleToggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'bn' : 'en'));
  };

  const handleDownloadBoth = () => {
    downloadPdfAndWord({
      filenameBase:
        lang === 'bn' ? 'Consent-and-Eligibility-BN' : 'Consent-and-Eligibility-EN',
      badge: `${t.kicker} · ${t.boxHeading}`,
      title: t.heading,
      subtitle: `${t.studyTitleLabel} ${t.studyTitle}`,
      sections: [
        {
          heading: t.boxHeading,
          paragraphs: [t.inviteParagraph],
          bullets: t.bullets,
        },
        {
          heading: t.policyHeading,
          paragraphs: [
            `${t.policyPrefix}${t.policyCodeBold}${t.policyMiddle1}${t.policyDaysBold}${t.policyMiddle2}${t.policyLinkLabel}${t.policySuffix}`,
          ],
        },
        {
          heading: lang === 'bn' ? 'যোগ্যতা ও সম্মতির প্রশ্নসমূহ' : 'Eligibility & Consent Questions',
          bullets: [
            `${t.ageQuestion} [${t.choiceLabels.yes} / ${t.choiceLabels.no}]`,
            `${t.usedQuestion} [${t.choiceLabels.yes} / ${t.choiceLabels.no}]`,
            t.consentCheckbox,
          ],
        },
      ],
      footerNote: 'Department of Psychology · University of Dhaka',
    });
  };

  return (
    <>
      <div className="kicker-bar">
        <div className="kicker">{t.kicker}</div>
        <div className="kicker-actions">
          <button
            type="button"
            className="header-action-btn lang-toggle-btn"
            onClick={handleToggleLanguage}
            title="Toggle English / বাংলা"
          >
            <Languages size={15} />
            <span>{lang === 'en' ? 'বাংলা' : 'English'}</span>
          </button>
          <button
            type="button"
            className="header-action-btn download-both-btn"
            onClick={handleDownloadBoth}
            title="Download PDF and Word (.doc) in 1 click"
          >
            <Download size={15} />
            <span>{t.downloadBtnLabel}</span>
          </button>
        </div>
      </div>

      <h2>{t.heading}</h2>
      <p className="muted">{t.subtitle}</p>

      <div className="consent">
        <b>{t.boxHeading}</b>
        <p>
          <strong>{t.studyTitleLabel}</strong> {t.studyTitle}
        </p>
        <p>{t.inviteParagraph}</p>
        <ul>
          {t.bullets.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="consent-policy">
          <strong>{t.policyHeading}</strong>
          <p>
            {t.policyPrefix}
            <strong>{t.policyCodeBold}</strong>
            {t.policyMiddle1}
            <strong>{t.policyDaysBold}</strong>
            {t.policyMiddle2}
            <button type="button" className="text-link" onClick={onGoWithdraw}>
              {t.policyLinkLabel}
            </button>
            {t.policySuffix}
          </p>
        </div>
      </div>

      <Field label={t.ageQuestion} required>
        <Choices
          value={age}
          set={setAge}
          options={['yes', 'no']}
          labels={t.choiceLabels}
        />
      </Field>

      <Field label={t.usedQuestion} required>
        <Choices
          value={used}
          set={setUsed}
          options={['yes', 'no']}
          labels={t.choiceLabels}
        />
      </Field>

      <label className="consentcheck">
        <input
          type="checkbox"
          checked={consent}
          onChange={e => setConsent(e.target.checked)}
        />
        <span>
          {t.consentCheckbox} <b>*</b>
        </span>
      </label>

      <Nav back={back} next={next} label={t.nextLabel} backLabel={t.backLabel} />
    </>
  );
}
