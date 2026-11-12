import React from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { Row } from './FormControls';

export default function ReviewStep({ profile, back, submit, busy }) {
  return (
    <>
      <div className="kicker">FINAL STEP · REVIEW</div>
      <h2>Review and submit</h2>
      <p className="muted">
        Please confirm that you have completed the questionnaire. Upon submission, you will receive
        a one-time Withdrawal Code valid for 3 calendar days.
      </p>

      <div className="review">
        <Row label="Age group" value={profile.age_group} />
        <Row label="AI tools" value={profile.ai_tools.join(', ')} />
        <Row label="AI frequency" value={profile.ai_frequency} />
        <Row label="Conversational warmth" value="8 of 8 answered" />
        <Row label="Perceived trust" value="9 of 9 answered" />
        <Row label="Willingness to self-disclose" value="9 of 9 answered" />
      </div>

      <aside>
        <ShieldCheck size={18} /> By submitting, you confirm that your answers reflect your own
        experience and contain no sensitive personal information. Make sure to save your Withdrawal
        Code on the next screen if you may wish to withdraw within 3 days.
      </aside>

      <div className="nav">
        <button type="button" className="secondary" onClick={back}>
          <ArrowLeft size={16} /> Back
        </button>
        <button type="button" className="primary" disabled={busy} onClick={submit}>
          {busy ? 'Submitting…' : 'Submit response'} <ArrowRight size={17} />
        </button>
      </div>
    </>
  );
}
