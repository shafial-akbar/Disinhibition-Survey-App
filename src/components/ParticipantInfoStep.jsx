import React from 'react';
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
  Mail,
  GraduationCap,
} from 'lucide-react';

export default function ParticipantInfoStep({ onStart, onGoWithdraw }) {
  return (
    <div className="info-sheet">
      <div className="kicker">
        <ClipboardList size={15} /> PARTICIPANT INFORMATION SHEET
      </div>

      <div className="study-banner">
        <span className="study-badge">STUDY TITLE</span>
        <h1>
          Perceived Conversational Warmth, Trust, and Willingness to Self-Disclose to
          Conversational AI: A Questionnaire-Based Study among Adults in Bangladesh.
        </h1>
      </div>

      <div className="info-section">
        <div className="info-section-title">
          <BookOpen size={16} />
          <h3>Purpose of the Study</h3>
        </div>
        <p>
          You are invited to participate in an academic research study conducted as part of the{' '}
          <strong>Professional MS in Psychology</strong> programme at the{' '}
          <strong>University of Dhaka</strong>. This study aims to understand adults&apos;
          perceptions of conversational warmth, trust, and willingness to share everyday,
          non-sensitive information with conversational AI.
        </p>
      </div>

      <div className="info-grid">
        <div className="info-card">
          <div className="info-card-header">
            <FileText size={16} />
            <h4>Nature of Participation</h4>
          </div>
          <p>
            This study involves completing an online questionnaire. It does not involve live
            interaction with any AI system, clinical assessment, psychological treatment, or
            counselling.
          </p>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <UserCheck size={16} />
            <h4>Voluntary Participation</h4>
          </div>
          <p>
            Your participation is entirely voluntary. You may choose not to participate or stop
            completing the questionnaire before submitting your responses without any penalty or
            negative consequences.
          </p>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <Clock size={16} />
            <h4>Time Required</h4>
          </div>
          <p>
            Completing the questionnaire is expected to take approximately{' '}
            <strong>8–12 minutes</strong>.
          </p>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <Lock size={16} />
            <h4>Confidentiality and Data Access</h4>
          </div>
          <p>
            Your responses will be handled confidentially. Direct personal identifiers such as your
            name, phone number, and email address will not be requested. The research data will be
            accessible only to the principal investigator and the authorised research supervisor for
            academic research purposes.
          </p>
        </div>
      </div>

      <div className="info-section">
        <div className="info-section-title">
          <ShieldCheck size={16} />
          <h3>Information Collected</h3>
        </div>
        <p>
          The questionnaire will collect demographic information, previous experience with
          conversational AI, and responses concerning perceived conversational warmth, trust, and
          willingness to self-disclose.
        </p>
        <p className="info-highlight">
          You will not be asked to provide passwords, financial information, medical information, or
          other sensitive personal details.
        </p>
      </div>

      <div className="info-section withdrawal-highlight-box">
        <div className="info-section-title">
          <KeyRound size={16} />
          <h3>Withdrawal and Data Deletion</h3>
        </div>
        <p>
          After submitting the questionnaire, you will receive a unique withdrawal code. You may
          request deletion of your submitted response within <strong>seven calendar days</strong> by
          entering this code on the designated{' '}
          <button type="button" className="text-link" onClick={onGoWithdraw}>
            Withdraw My Response
          </button>{' '}
          page.
        </p>
        <p>
          After the seven-day withdrawal period, individual responses will be locked for research
          analysis and cannot be deleted through the withdrawal-code mechanism.
        </p>
      </div>

      <div className="contact-section">
        <div className="info-section-title">
          <GraduationCap size={16} />
          <h3>Contact Information</h3>
        </div>
        <div className="contact-grid">
          <div className="contact-card">
            <small>PRINCIPAL INVESTIGATOR</small>
            <b>Md. Shafial Akbar</b>
            <span>Professional MS in Psychology</span>
            <span>Department of Psychology</span>
            <span>University of Dhaka</span>
            <a href="mailto:shafialakbar52@gmail.com" className="contact-email">
              <Mail size={13} /> shafialakbar52@gmail.com
            </a>
          </div>

          <div className="contact-card">
            <small>RESEARCH SUPERVISOR</small>
            <b>Sanchary Prativa</b>
            <span>Assistant Professor</span>
            <span>Department of Psychology</span>
            <span>University of Dhaka</span>
          </div>
        </div>
      </div>

      <button type="button" className="primary wide" onClick={onStart}>
        Proceed to Consent &amp; Eligibility <ArrowRight size={17} />
      </button>
      <p className="tiny center">Participation is voluntary · Adults aged 18+</p>
    </div>
  );
}
