import React from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  Download,
  AlertTriangle,
  KeyRound,
} from 'lucide-react';
import { Row } from './FormControls';
import { formatServerTimestamp } from '../lib/withdrawal';

export default function SubmissionSuccessStep({
  receipt,
  copied,
  onCopyCode,
  onDownloadReceipt,
  onGoWithdraw,
}) {
  return (
    <div className="withdrawal-receipt">
      <div className="success-icon">
        <CheckCircle2 size={36} />
      </div>
      <div className="kicker center-kicker">RESPONSE SUBMITTED · SAVE YOUR CODE</div>
      <h2>Your response has been submitted successfully.</h2>

      <div className="code-display-card" role="region" aria-label="Withdrawal Code">
        <span className="code-label">Your Withdrawal Code:</span>
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
                <Check size={15} /> Copied!
              </>
            ) : (
              <>
                <Copy size={15} /> Copy Code
              </>
            )}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={onDownloadReceipt}
            disabled={!receipt?.withdrawal_code}
          >
            <Download size={15} /> Download / Save Code (.txt)
          </button>
        </div>
      </div>

      <div className="receipt-message">
        <p>
          <strong>Please save this code securely.</strong> You will need it if you wish to request
          deletion of your submitted response.
        </p>
        <p>
          You may request deletion within 7 calendar days from the date and time of submission.
          After this period, your response will be locked for research analysis and individual
          deletion using the withdrawal code will no longer be available.
        </p>
      </div>

      {receipt?.submitted_at && receipt?.withdrawal_deadline && (
        <div className="review deadline-box">
          <Row
            label="Submitted at (Server Time)"
            value={formatServerTimestamp(receipt.submitted_at)}
          />
          <Row
            label="7-Day Withdrawal Deadline"
            value={formatServerTimestamp(receipt.withdrawal_deadline)}
          />
        </div>
      )}

      <aside>
        <AlertTriangle size={18} /> Because we do not store your code in plain text or collect
        contact details, this code cannot be recovered if lost.
      </aside>

      <div className="receipt-footer-links">
        <button type="button" className="secondary" onClick={onGoWithdraw}>
          <KeyRound size={15} /> Go to &ldquo;Withdraw My Response&rdquo;
        </button>
      </div>
    </div>
  );
}
