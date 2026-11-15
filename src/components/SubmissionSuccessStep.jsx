import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  Download,
  AlertTriangle,
  KeyRound,
  Languages,
} from 'lucide-react';
import { Row } from './FormControls';
import { formatServerTimestamp } from '../lib/withdrawal';

const SUCCESS_CONTENT = {
  en: {
    kicker: 'RESPONSE SUBMITTED · SAVE YOUR CODE',
    heading: 'Your response has been submitted successfully.',
    codeLabel: 'Your Withdrawal Code:',
    copiedLabel: 'Copied!',
    copyLabel: 'Copy Code',
    downloadTxtLabel: 'Download / Save Code (.txt)',
    saveNoticeBold: 'Please save this code securely.',
    saveNoticeRest:
      ' You will need it if you wish to request deletion of your submitted response.',
    deadlineParagraph:
      'You may request deletion within 3 calendar days from the date and time of submission. After this period, your response will be locked for research analysis and individual deletion using the withdrawal code will no longer be available.',
    submittedAtLabel: 'Submitted at (Server Time)',
    deadlineLabel: '3-Day Withdrawal Deadline',
    warningText:
      'Because we do not store your code in plain text or collect contact details, this code cannot be recovered if lost.',
    withdrawBtnLabel: 'Go to “Withdraw My Response”',
  },
  bn: {
    kicker: 'উত্তর জমা হয়েছে · আপনার কোডটি সংরক্ষণ করুন',
    heading: 'আপনার উত্তর সফলভাবে জমা দেওয়া হয়েছে।',
    codeLabel: 'আপনার উইথড্রয়াল কোড (Withdrawal Code):',
    copiedLabel: 'কপি হয়েছে!',
    copyLabel: 'কোড কপি করুন',
    downloadTxtLabel: 'কোড ডাউনলোড / সংরক্ষণ করুন (.txt)',
    saveNoticeBold: 'অনুগ্রহ করে এই কোডটি নিরাপদে সংরক্ষণ করুন।',
    saveNoticeRest:
      ' আপনি যদি আপনার জমা দেওয়া উত্তর মুছে ফেলার অনুরোধ করতে চান তবে এই কোডটি প্রয়োজন হবে।',
    deadlineParagraph:
      'জমা দেওয়ার তারিখ ও সময় থেকে ৩ ক্যালেন্ডার দিনের মধ্যে আপনি উত্তর মুছে ফেলার অনুরোধ করতে পারবেন। এই সময়ের পর আপনার উত্তর গবেষণা বিশ্লেষণের জন্য লক হয়ে যাবে এবং উইথড্রয়াল কোড ব্যবহার করে এককভাবে মুছে ফেলা আর সম্ভব হবে না।',
    submittedAtLabel: 'জমা দেওয়ার সময় (সার্ভার সময়)',
    deadlineLabel: '৩ দিনের প্রত্যাহারের শেষ সময়সীমা',
    warningText:
      'যেহেতু আমরা আপনার কোডটি সরাসরি সংরক্ষণ করি না এবং কোনো যোগাযোগের তথ্য রাখি না, তাই এই কোডটি হারিয়ে গেলে তা আর পুনরুদ্ধার করা সম্ভব নয়।',
    withdrawBtnLabel: '“আমার উত্তর প্রত্যাহার করুন” পেজে যান',
  },
};

export default function SubmissionSuccessStep({
  receipt,
  copied,
  onCopyCode,
  onDownloadReceipt,
  onGoWithdraw,
}) {
  const [lang, setLang] = useState('en');
  const t = SUCCESS_CONTENT[lang];

  return (
    <div className="withdrawal-receipt">
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

      <div className="success-icon">
        <CheckCircle2 size={36} />
      </div>
      <h2>{t.heading}</h2>

      <div className="code-display-card" role="region" aria-label="Withdrawal Code">
        <span className="code-label">{t.codeLabel}</span>
        <strong className="code-value" data-testid="withdrawal-code-value">
          {receipt?.withdrawal_code || '—'}
        </strong>
        <div className="code-actions">
          <button
            type="button"
            className="primary"
            onClick={onCopyCode}
            disabled={!receipt?.withdrawal_code}
          >
            {copied ? (
              <>
                <Check size={15} /> {t.copiedLabel}
              </>
            ) : (
              <>
                <Copy size={15} /> {t.copyLabel}
              </>
            )}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={onDownloadReceipt}
            disabled={!receipt?.withdrawal_code}
          >
            <Download size={15} /> {t.downloadTxtLabel}
          </button>
        </div>
      </div>

      <div className="receipt-message">
        <p>
          <strong>{t.saveNoticeBold}</strong>
          {t.saveNoticeRest}
        </p>
        <p>{t.deadlineParagraph}</p>
      </div>

      {receipt?.submitted_at && receipt?.withdrawal_deadline && (
        <div className="review deadline-box">
          <Row
            label={t.submittedAtLabel}
            value={formatServerTimestamp(receipt.submitted_at)}
          />
          <Row
            label={t.deadlineLabel}
            value={formatServerTimestamp(receipt.withdrawal_deadline)}
          />
        </div>
      )}

      <aside>
        <AlertTriangle size={18} /> {t.warningText}
      </aside>

      <div className="receipt-footer-links">
        <button type="button" className="secondary" onClick={onGoWithdraw}>
          <KeyRound size={15} /> {t.withdrawBtnLabel}
        </button>
      </div>
    </div>
  );
}
