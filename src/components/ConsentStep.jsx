import React from 'react';
import { Field, Choices, Nav } from './FormControls';

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
  return (
    <>
      <div className="kicker">STEP 1 OF 7</div>
      <h2>Consent and eligibility</h2>
      <p className="muted">
        Read the summary below and confirm your eligibility to participate.
      </p>

      <div className="consent">
        <b>Informed Consent</b>
        <p>
          <strong>Study Title:</strong> Perceived Conversational Warmth, Trust, and Willingness to
          Self-Disclose to Conversational AI: A Questionnaire-Based Study among Adults in
          Bangladesh.
        </p>
        <p>
          You are invited to participate in an academic research study conducted as part of the
          Professional MS in Psychology programme at the Department of Psychology, University of
          Dhaka.
        </p>
        <ul>
          <li>Participation is voluntary and you may stop before submitting without any penalty.</li>
          <li>You must be at least 18 years old and have previously used conversational AI.</li>
          <li>The questionnaire will take approximately 8–12 minutes.</li>
          <li>No clinical assessment, treatment, or live AI chat interaction will take place.</li>
          <li>You will not be asked to provide sensitive personal information.</li>
          <li>
            Your responses will be handled confidentially and accessed only by the principal
            investigator and authorised research supervisor.
          </li>
        </ul>
        <div className="consent-policy">
          <strong>Withdrawal &amp; 7-Day Data Deletion Policy:</strong>
          <p>
            After submitting your response, you will receive a unique{' '}
            <strong>Withdrawal Code</strong>. You must save this code securely because it is not
            stored in plain text and cannot be retrieved later. You may request deletion of your
            submitted response within <strong>7 calendar days</strong> on the{' '}
            <button type="button" className="text-link" onClick={onGoWithdraw}>
              Withdraw My Response
            </button>{' '}
            page. After 7 calendar days, your response will be locked for research analysis.
          </p>
        </div>
      </div>

      <Field label="Are you 18 years of age or older?" required>
        <Choices value={age} set={setAge} options={['yes', 'no']} />
      </Field>

      <Field label="Have you previously used a conversational AI tool?" required>
        <Choices value={used} set={setUsed} options={['yes', 'no']} />
      </Field>

      <label className="consentcheck">
        <input
          type="checkbox"
          checked={consent}
          onChange={e => setConsent(e.target.checked)}
        />
        <span>
          I have read and understood the participant information. I voluntarily agree to
          participate in this research study. <b>*</b>
        </span>
      </label>

      <Nav back={back} next={next} />
    </>
  );
}
