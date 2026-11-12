import React from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { formatServerTimestamp } from '../lib/withdrawal';

export default function WithdrawResponsePage({
  withdrawCodeInput,
  setWithdrawCodeInput,
  withdrawBusy,
  withdrawResult,
  onSubmitWithdraw,
  onReturnToSurvey,
}) {
  return (
    <div className="withdraw-page">
      <div className="kicker">
        <Trash2 size={14} /> DATA DELETION &amp; WITHDRAWAL
      </div>
      <h2>Withdraw My Response</h2>
      <p className="muted">
        Enter the unique Withdrawal Code generated when you submitted your questionnaire. Requests
        submitted within <strong>3 calendar days</strong> of the server submission timestamp will
        permanently delete your questionnaire response.
      </p>

      <form onSubmit={onSubmitWithdraw} className="withdraw-form" noValidate>
        <div className="field">
          <label htmlFor="withdrawal-code-input">
            Withdrawal Code <b>*</b>
          </label>
          <input
            id="withdrawal-code-input"
            type="text"
            className="code-input"
            placeholder="e.g. WDR-XXXX-XXXX-XXXX"
            value={withdrawCodeInput}
            onChange={e => setWithdrawCodeInput(e.target.value)}
            autoComplete="off"
            spellCheck="false"
            disabled={withdrawBusy}
          />
          <small className="field-hint">
            Enter the code exactly as shown on your submission receipt.
          </small>
        </div>

        <div className="withdraw-actions">
          <button
            type="button"
            className="secondary"
            onClick={onReturnToSurvey}
            disabled={withdrawBusy}
          >
            <ArrowLeft size={16} /> Return to Home
          </button>
          <button
            type="submit"
            className="primary danger-btn"
            disabled={withdrawBusy}
          >
            <Trash2 size={16} />{' '}
            {withdrawBusy ? 'Processing request…' : 'Request Data Deletion'}
          </button>
        </div>
      </form>

      {withdrawResult && withdrawResult.status === 'deleted' && (
        <div className="status-box status-success" role="status">
          <CheckCircle2 size={20} />
          <div>
            <strong>Data Deletion Confirmed</strong>
            <p>{withdrawResult.message}</p>
            {withdrawResult.deleted_at && (
              <small>
                Deleted at (Server Timestamp): {formatServerTimestamp(withdrawResult.deleted_at)}
              </small>
            )}
          </div>
        </div>
      )}

      {withdrawResult && withdrawResult.status === 'expired' && (
        <div className="status-box status-expired" role="alert">
          <Clock size={20} />
          <div>
            <strong>Withdrawal Period Expired</strong>
            <p>
              The 3-day withdrawal period has expired. Your response is no longer eligible for
              deletion through the withdrawal code because it has been locked for research analysis.
            </p>
          </div>
        </div>
      )}

      {withdrawResult &&
        (withdrawResult.status === 'invalid_code' ||
          withdrawResult.status === 'rate_limited' ||
          withdrawResult.status === 'error') && (
          <div className="error" role="alert">
            {withdrawResult.message}
          </div>
        )}

      <aside>
        <ShieldCheck size={18} /> For participant privacy, withdrawal codes are stored only as
        cryptographic hashes. Once a response is deleted or after 3 calendar days have elapsed, the
        code can no longer be used.
      </aside>
    </div>
  );
}
