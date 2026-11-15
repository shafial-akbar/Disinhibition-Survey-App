import React, { useState } from 'react';
import {
  ArrowRight,
  ClipboardList,
  ShieldCheck,
  Clock,
  BookOpen,
  UserCheck,
  FileText,
  Lock,
  KeyRound,
  Languages,
  Download,
} from 'lucide-react';
import { downloadPdfAndWord } from '../lib/documentExport';

const INFO_CONTENT = {
  en: {
    kicker: 'PARTICIPANT INFORMATION SHEET',
    studyBadge: 'STUDY TITLE',
    studyTitle:
      'Perceived Conversational Warmth, Trust, and Willingness to Self-Disclose to Conversational AI: A Questionnaire-Based Study among Adults in Bangladesh.',
    purposeTitle: 'Purpose of the Study',
    purposeText:
      "You are invited to participate in an academic research study conducted as part of the Professional MS in Psychology programme at the University of Dhaka. This study aims to understand adults' perceptions of conversational warmth, trust, and willingness to share everyday, non-sensitive information with conversational AI.",
    cards: [
      {
        title: 'Nature of Participation',
        text: 'This study involves completing an online questionnaire. It does not involve live interaction with any AI system, clinical assessment, psychological treatment, or counselling.',
      },
      {
        title: 'Voluntary Participation',
        text: 'Your participation is entirely voluntary. You may choose not to participate or stop completing the questionnaire before submitting your responses without any penalty or negative consequences.',
      },
      {
        title: 'Time Required',
        text: 'Completing the questionnaire is expected to take approximately 8–12 minutes.',
      },
      {
        title: 'Confidentiality and Data Access',
        text: 'Your responses will be handled confidentially. Direct personal identifiers such as your name, phone number, and email address will not be requested. The research data will be accessible only to the principal investigator and the authorised research supervisor for academic research purposes.',
      },
    ],
    collectedTitle: 'Information Collected',
    collectedText:
      'The questionnaire will collect demographic information, previous experience with conversational AI, and responses concerning perceived conversational warmth, trust, and willingness to self-disclose.',
    collectedHighlight:
      'You will not be asked to provide passwords, financial information, medical information, or other sensitive personal details.',
    withdrawalTitle: 'Withdrawal and Data Deletion',
    withdrawalText1Prefix:
      'After submitting the questionnaire, you will receive a unique withdrawal code. You may request deletion of your submitted response within ',
    withdrawalDaysBold: 'three calendar days',
    withdrawalText1Middle: ' by entering this code on the designated ',
    withdrawalLinkLabel: 'Withdraw My Response',
    withdrawalText1Suffix: ' page.',
    withdrawalText2:
      'After the three-day withdrawal period, individual responses will be locked for research analysis and cannot be deleted through the withdrawal-code mechanism.',
    storageTitle: 'Data Storage, Hosting, Access and Retention',
    storageText:
      'Your questionnaire responses will be stored in a secure database hosted by Online Supabase powered by Postgre. The online application is hosted through Google Cloud infrastructure. Your responses will be accessible to the principal investigator and the authorised research supervisor for academic research purposes. Your research data will be retained for five years after completion of the study and securely deleted thereafter, subject to applicable university requirements. You may request deletion of your submitted response within three calendar days using your unique withdrawal code.',
    proceedBtn: 'Proceed to Consent & Eligibility',
    footerTiny: 'Participation is voluntary · Adults aged 18+',
    toggleBtnLabel: 'বাংলা / EN',
    downloadBtnLabel: 'Download (PDF & Word)',
  },
  bn: {
    kicker: 'অংশগ্রহণকারীর তথ্যপত্র (PARTICIPANT INFORMATION SHEET)',
    studyBadge: 'গবেষণার শিরোনাম',
    studyTitle:
      'কনভার্সেশনাল এআই-এর প্রতি অনুভূত আন্তরিকতা, বিশ্বাস এবং নিজের সাধারণ তথ্য শেয়ার করার ইচ্ছা: বাংলাদেশের প্রাপ্তবয়স্কদের ওপর একটি প্রশ্নমালাভিত্তিক গবেষণা।',
    purposeTitle: 'গবেষণার উদ্দেশ্য',
    purposeText:
      'ঢাকা বিশ্ববিদ্যালয়ের মনোবিজ্ঞান বিভাগের প্রফেশনাল এমএস ইন সাইকোলজি (Professional MS in Psychology) প্রোগ্রামের অংশ হিসেবে পরিচালিত একটি একাডেমিক গবেষণায় অংশগ্রহণের জন্য আপনাকে আমন্ত্রণ জানানো হচ্ছে। এই গবেষণার উদ্দেশ্য হলো কনভার্সেশনাল এআই-এর সঙ্গে কথোপকথনে প্রাপ্তবয়স্কদের অনুভূত আন্তরিকতা, বিশ্বাস এবং দৈনন্দিন সাধারণ ও সংবেদনশীল নয় এমন তথ্য শেয়ার করার ইচ্ছা সম্পর্কে ধারণা লাভ করা।',
    cards: [
      {
        title: 'অংশগ্রহণের ধরন',
        text: 'এই গবেষণায় একটি অনলাইন প্রশ্নমালা পূরণ করতে হবে। এতে কোনো এআই সিস্টেমের সঙ্গে সরাসরি কথোপকথন, ক্লিনিক্যাল মূল্যায়ন, মানসিক চিকিৎসা বা কাউন্সেলিং অন্তর্ভুক্ত নয়।',
      },
      {
        title: 'স্বতঃস্ফূর্ত ও ঐচ্ছিক অংশগ্রহণ',
        text: 'আপনার অংশগ্রহণ সম্পূর্ণ ঐচ্ছিক। কোনো ধরনের জরিমানা বা নেতিবাচক ফলাফল ছাড়াই আপনি এতে অংশগ্রহণ না করার সিদ্ধান্ত নিতে পারেন অথবা উত্তর জমা দেওয়ার আগে যেকোনো সময় প্রশ্নমালা পূরণ বন্ধ করতে পারেন।',
      },
      {
        title: 'প্রয়োজনীয় সময়',
        text: 'প্রশ্নমালাটি সম্পূর্ণ করতে আনুমানিক ৮–১২ মিনিট সময় লাগতে পারে।',
      },
      {
        title: 'গোপনীয়তা ও তথ্যের সুরক্ষা',
        text: 'আপনার দেওয়া উত্তরগুলো সম্পূর্ণ গোপনীয়তার সঙ্গে সংরক্ষণ করা হবে। আপনার নাম, ফোন নম্বর বা ইমেইল ঠিকানার মতো কোনো প্রত্যক্ষ ব্যক্তিগত পরিচয় চাওয়া হবে না। গবেষণার তথ্য শুধুমাত্র প্রধান গবেষক এবং অনুমোদিত গবেষণা তত্ত্বাবধায়ক একাডেমিক গবেষণার কাজে ব্যবহার করতে পারবেন।',
      },
    ],
    collectedTitle: 'সংগৃহীত তথ্যের বিবরণ',
    collectedText:
      'এই প্রশ্নমালায় আপনার জনমিতিক তথ্য (Demographic information), কনভার্সেশনাল এআই ব্যবহারের পূর্ব অভিজ্ঞতা এবং কথোপকথনের আন্তরিকতা, বিশ্বাস ও নিজের তথ্য শেয়ার করার ইচ্ছা সম্পর্কিত উত্তর সংগ্রহ করা হবে।',
    collectedHighlight:
      'আপনার কাছে কোনো পাসওয়ার্ড, আর্থিক তথ্য, চিকিৎসা-সংক্রান্ত তথ্য বা অন্য কোনো সংবেদনশীল ব্যক্তিগত তথ্য চাওয়া হবে না।',
    withdrawalTitle: 'প্রত্যাহার ও তথ্য মুছে ফেলার নীতি',
    withdrawalText1Prefix:
      'প্রশ্নমালাটি জমা দেওয়ার পর আপনি একটি অনন্য প্রত্যাহার কোড (Withdrawal Code) পাবেন। উত্তর জমা দেওয়ার পর ',
    withdrawalDaysBold: 'তিন (৩) ক্যালেন্ডার দিনের',
    withdrawalText1Middle: ' মধ্যে নির্ধারিত ',
    withdrawalLinkLabel: 'Withdraw My Response',
    withdrawalText1Suffix: ' পেজে এই কোডটি প্রদান করে আপনার জমা দেওয়া উত্তর মুছে ফেলার অনুরোধ করতে পারবেন।',
    withdrawalText2:
      'তিন দিনের প্রত্যাহার সময়সীমা শেষ হওয়ার পর উত্তরগুলো গবেষণা বিশ্লেষণের জন্য লক করা হবে এবং এরপর কোড ব্যবহার করে এককভাবে কোনো উত্তর মুছে ফেলা যাবে না।',
    storageTitle: 'তথ্য সংরক্ষণ, হোস্টিং ও মেয়াদ',
    storageText:
      'আপনার প্রশ্নমালার উত্তরগুলো PostgreSQL চালিত নিরাপদ অনলাইন Supabase ডাটাবেজে সংরক্ষিত থাকবে এবং অনলাইন অ্যাপ্লিকেশনটি Google Cloud অবকাঠামোর মাধ্যমে হোস্ট করা হয়েছে। শুধুমাত্র প্রধান গবেষক এবং অনুমোদিত গবেষণা তত্ত্বাবধায়ক একাডেমিক গবেষণার উদ্দেশ্যে এই তথ্যে প্রবেশাধিকার পাবেন। বিশ্ববিদ্যালয়ের প্রযোজ্য নিয়ম অনুসারে গবেষণা শেষ হওয়ার পর পাঁচ বছর পর্যন্ত তথ্য সংরক্ষণ করা হবে এবং এরপর নিরাপদভাবে মুছে ফেলা হবে। এছাড়া আপনি আপনার অনন্য প্রত্যাহার কোড ব্যবহার করে তিন ক্যালেন্ডার দিনের মধ্যে আপনার জমা দেওয়া উত্তর মুছে ফেলার অনুরোধ করতে পারবেন।',
    proceedBtn: 'সম্মতি ও যোগ্যতা যাচাই ধাপে এগিয়ে যান',
    footerTiny: 'অংশগ্রহণ সম্পূর্ণ ঐচ্ছিক · বয়স ১৮ বছর বা তদূর্ধ্ব',
    toggleBtnLabel: 'English / বাংলা',
    downloadBtnLabel: 'ডাউনলোড (PDF ও Word)',
  },
};

export default function ParticipantInfoStep({ onStart, onGoWithdraw }) {
  const [lang, setLang] = useState('en');
  const t = INFO_CONTENT[lang];

  const handleToggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'bn' : 'en'));
  };

  const handleDownloadBoth = () => {
    downloadPdfAndWord({
      filenameBase:
        lang === 'bn'
          ? 'Participant-Information-Sheet-BN'
          : 'Participant-Information-Sheet-EN',
      badge: `${t.kicker} · ${t.studyBadge}`,
      title: t.studyTitle,
      subtitle: 'Department of Psychology · University of Dhaka',
      sections: [
        {
          heading: t.purposeTitle,
          paragraphs: [t.purposeText],
        },
        ...t.cards.map(c => ({
          heading: c.title,
          paragraphs: [c.text],
        })),
        {
          heading: t.collectedTitle,
          paragraphs: [t.collectedText],
          highlight: t.collectedHighlight,
        },
        {
          heading: t.withdrawalTitle,
          paragraphs: [
            `${t.withdrawalText1Prefix}${t.withdrawalDaysBold}${t.withdrawalText1Middle}${t.withdrawalLinkLabel}${t.withdrawalText1Suffix}`,
            t.withdrawalText2,
          ],
        },
        {
          heading: t.storageTitle,
          paragraphs: [t.storageText],
        },
      ],
      footerNote: `${t.footerTiny} · Department of Psychology, University of Dhaka`,
    });
  };

  const cardIcons = [
    <FileText size={16} key="file" />,
    <UserCheck size={16} key="user" />,
    <Clock size={16} key="clock" />,
    <Lock size={16} key="lock" />,
  ];

  return (
    <div className="info-sheet">
      <div className="kicker-bar">
        <div className="kicker">
          <ClipboardList size={15} /> {t.kicker}
        </div>
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

      <div className="study-banner">
        <span className="study-badge">{t.studyBadge}</span>
        <h1>{t.studyTitle}</h1>
      </div>

      <div className="info-section">
        <div className="info-section-title">
          <BookOpen size={16} />
          <h3>{t.purposeTitle}</h3>
        </div>
        <p>{t.purposeText}</p>
      </div>

      <div className="info-grid">
        {t.cards.map((card, idx) => (
          <div className="info-card" key={card.title}>
            <div className="info-card-header">
              {cardIcons[idx]}
              <h4>{card.title}</h4>
            </div>
            <p>{card.text}</p>
          </div>
        ))}
      </div>

      <div className="info-section">
        <div className="info-section-title">
          <ShieldCheck size={16} />
          <h3>{t.collectedTitle}</h3>
        </div>
        <p>{t.collectedText}</p>
        <p className="info-highlight">{t.collectedHighlight}</p>
      </div>

      <div className="info-section withdrawal-highlight-box">
        <div className="info-section-title">
          <KeyRound size={16} />
          <h3>{t.withdrawalTitle}</h3>
        </div>
        <p>
          {t.withdrawalText1Prefix}
          <strong>{t.withdrawalDaysBold}</strong>
          {t.withdrawalText1Middle}
          <button type="button" className="text-link" onClick={onGoWithdraw}>
            {t.withdrawalLinkLabel}
          </button>
          {t.withdrawalText1Suffix}
        </p>
        <p>{t.withdrawalText2}</p>
      </div>

      <div className="info-section">
        <div className="info-section-title">
          <ShieldCheck size={16} />
          <h3>{t.storageTitle}</h3>
        </div>
        <p>{t.storageText}</p>
      </div>

      <button type="button" className="primary wide" onClick={onStart}>
        {t.proceedBtn} <ArrowRight size={17} />
      </button>
      <p className="tiny center">{t.footerTiny}</p>
    </div>
  );
}
