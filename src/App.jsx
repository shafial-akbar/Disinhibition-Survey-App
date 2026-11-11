import React, { useEffect, useMemo, useState } from 'react';
import { configured, supabase } from './lib/supabase';
import { sections } from './data/questions';
import {
  submitSurveyWithWithdrawalCode,
  requestWithdrawalDeletion,
  buildWithdrawalReceiptText,
  saveSessionSubmissionReceipt,
  loadSessionSubmissionReceipt,
  clearSessionSubmissionReceipt,
  normalizeWithdrawalCode,
} from './lib/withdrawal';

import Navbar from './components/Navbar';
import ParticipantInfoStep from './components/ParticipantInfoStep';
import ConsentStep from './components/ConsentStep';
import DemographicStep from './components/DemographicStep';
import AiExperienceStep from './components/AiExperienceStep';
import WarmthStep from './components/WarmthStep';
import TrustStep from './components/TrustStep';
import DisclosureStep from './components/DisclosureStep';
import ReviewStep from './components/ReviewStep';
import SubmissionSuccessStep from './components/SubmissionSuccessStep';
import WithdrawResponsePage from './components/WithdrawResponsePage';

const blank = {
  age_group: '',
  gender: '',
  education: '',
  occupation: '',
  ai_tools: [],
  ai_frequency: '',
  ai_duration: '',
  ai_purpose: [],
  ai_familiarity: '',
};

export default function App() {
  const initialReceipt = loadSessionSubmissionReceipt();
  const initialView =
    typeof window !== 'undefined' && window.location.hash === '#withdraw'
      ? 'withdraw'
      : 'survey';

  const [view, setView] = useState(initialView);
  const [step, S] = useState(initialReceipt ? 8 : 0);
  const [age, A] = useState('');
  const [used, U] = useState('');
  const [consent, C] = useState(false);
  const [p, P] = useState(blank);
  const [a, Q] = useState({});
  const [err, E] = useState('');
  const [busy, B] = useState(false);

  const [receipt, setReceipt] = useState(initialReceipt);
  const [copied, setCopied] = useState(false);

  const [withdrawCodeInput, setWithdrawCodeInput] = useState('');
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [withdrawResult, setWithdrawResult] = useState(null);

  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash === '#withdraw') {
        setView('withdraw');
      } else {
        setView('survey');
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateToWithdraw = () => {
    E('');
    setWithdrawResult(null);
    setView('withdraw');
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '#withdraw');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateToHome = () => {
    E('');
    setWithdrawResult(null);
    setView('survey');
    S(0);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scale = step >= 4 && step <= 6 ? sections[step - 4] : null;
  const all = useMemo(
    () => sections.flatMap(s => s.items.map((_, i) => `${s.prefix}_${i + 1}`)),
    []
  );

  const setField = (k, v) => P(old => ({ ...old, [k]: v }));

  const toggleField = (k, v) =>
    P(old => ({
      ...old,
      [k]: old[k].includes(v) ? old[k].filter(x => x !== v) : [...old[k], v],
    }));

  const setAnswer = (k, val) => Q(old => ({ ...old, [k]: val }));

  const next = () => {
    E('');
    if (step === 1 && (age !== 'yes' || used !== 'yes' || !consent)) {
      E(
        age !== 'yes'
          ? 'You must be at least 18 years old to participate.'
          : used !== 'yes'
          ? 'This study is for people who have previously used conversational AI.'
          : 'Please provide your voluntary consent.'
      );
      return;
    }
    if (step === 2 && (!p.age_group || !p.education)) {
      E('Please complete the required demographic questions.');
      return;
    }
    if (
      step === 3 &&
      (!p.ai_tools.length ||
        !p.ai_frequency ||
        !p.ai_duration ||
        !p.ai_purpose.length ||
        !p.ai_familiarity)
    ) {
      E('Please complete all required AI usage questions.');
      return;
    }
    if (scale && scale.items.some((_, i) => !a[`${scale.prefix}_${i + 1}`])) {
      E('Please answer every statement before continuing.');
      return;
    }
    S(x => Math.min(x + 1, 7));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const back = () => {
    E('');
    S(x => Math.max(0, x - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  async function submit() {
    E('');
    if (receipt?.withdrawal_code) {
      S(8);
      return;
    }
    if (all.some(k => !a[k])) {
      E('Please complete all questionnaire statements.');
      return;
    }
    if (!configured) {
      E('The survey database is not configured. Please contact the researcher.');
      return;
    }
    B(true);
    try {
      const payload = {
        ...p,
        ...Object.fromEntries(all.map(k => [k, Number(a[k])])),
      };
      const serverReceipt = await submitSurveyWithWithdrawalCode(supabase, payload);
      setReceipt(serverReceipt);
      saveSessionSubmissionReceipt(serverReceipt);
      B(false);
      S(8);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      B(false);
      E('Submission failed. Please check your connection and try again.');
    }
  }

  async function handleCopyCode() {
    if (!receipt?.withdrawal_code) return;
    try {
      await navigator.clipboard.writeText(receipt.withdrawal_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = receipt.withdrawal_code;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  function handleDownloadReceipt() {
    if (!receipt?.withdrawal_code) return;
    const content = buildWithdrawalReceiptText(receipt);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'survey-withdrawal-code.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleWithdrawSubmit(e) {
    e.preventDefault();
    setWithdrawResult(null);

    if (!withdrawCodeInput.trim()) {
      setWithdrawResult({
        status: 'invalid_code',
        message: 'Please enter your withdrawal code.',
      });
      return;
    }

    setWithdrawBusy(true);
    const result = await requestWithdrawalDeletion(supabase, withdrawCodeInput);
    setWithdrawBusy(false);
    setWithdrawResult(result);

    if (
      result.status === 'deleted' &&
      receipt?.withdrawal_code &&
      normalizeWithdrawalCode(withdrawCodeInput) === normalizeWithdrawalCode(receipt.withdrawal_code)
    ) {
      clearSessionSubmissionReceipt();
      setReceipt(null);
      S(0);
      P(blank);
      Q({});
      A('');
      U('');
      C(false);
    }
  }

  const pct = step >= 2 && step <= 7 ? Math.round(((step - 1) / 7) * 100) : 0;

  return (
    <main className="shell">
      <Navbar
        activeView={view}
        onGoHome={navigateToHome}
        onGoWithdraw={navigateToWithdraw}
      />

      <section className="card">
        {view === 'withdraw' ? (
          <WithdrawResponsePage
            withdrawCodeInput={withdrawCodeInput}
            setWithdrawCodeInput={setWithdrawCodeInput}
            withdrawBusy={withdrawBusy}
            withdrawResult={withdrawResult}
            onSubmitWithdraw={handleWithdrawSubmit}
            onReturnToSurvey={navigateToHome}
          />
        ) : (
          <>
            {step > 1 && step < 8 && (
              <div className="progress">
                <span>Questionnaire progress</span>
                <b>{pct}%</b>
                <div>
                  <i style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}

            {step === 0 && (
              <ParticipantInfoStep
                onStart={() => {
                  if (receipt?.withdrawal_code) {
                    clearSessionSubmissionReceipt();
                    setReceipt(null);
                    P(blank);
                    Q({});
                    A('');
                    U('');
                    C(false);
                  }
                  S(1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onGoWithdraw={navigateToWithdraw}
              />
            )}

            {step === 1 && (
              <ConsentStep
                age={age}
                setAge={A}
                used={used}
                setUsed={U}
                consent={consent}
                setConsent={C}
                onGoWithdraw={navigateToWithdraw}
                back={back}
                next={next}
              />
            )}

            {step === 2 && (
              <DemographicStep
                profile={p}
                setField={setField}
                back={back}
                next={next}
              />
            )}

            {step === 3 && (
              <AiExperienceStep
                profile={p}
                setField={setField}
                toggleField={toggleField}
                back={back}
                next={next}
              />
            )}

            {step === 4 && (
              <WarmthStep
                answers={a}
                onSelectAnswer={setAnswer}
                back={back}
                next={next}
              />
            )}

            {step === 5 && (
              <TrustStep
                answers={a}
                onSelectAnswer={setAnswer}
                back={back}
                next={next}
              />
            )}

            {step === 6 && (
              <DisclosureStep
                answers={a}
                onSelectAnswer={setAnswer}
                back={back}
                next={next}
              />
            )}

            {step === 7 && (
              <ReviewStep
                profile={p}
                back={back}
                submit={submit}
                busy={busy}
              />
            )}

            {step === 8 && (
              <SubmissionSuccessStep
                receipt={receipt}
                copied={copied}
                onCopyCode={handleCopyCode}
                onDownloadReceipt={handleDownloadReceipt}
                onGoWithdraw={navigateToWithdraw}
              />
            )}

            {err && (
              <div className="error" role="alert">
                {err}
              </div>
            )}
          </>
        )}
      </section>

      <footer>
        <span>Department of Psychology · University of Dhaka</span>
        <span>
          <button type="button" className="text-link" onClick={navigateToHome}>
            Home
          </button>
          {' · '}
          <button type="button" className="text-link" onClick={navigateToWithdraw}>
            Withdraw My Response
          </button>
        </span>
      </footer>

      {!configured && (
        <div className="warning">
          Setup required: configure Supabase environment variables before publishing this survey.
        </div>
      )}
    </main>
  );
}