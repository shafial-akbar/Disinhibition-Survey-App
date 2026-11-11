import React from 'react';
import { Home, KeyRound, ShieldCheck, Sparkles } from 'lucide-react';

export default function Navbar({ activeView, onGoHome, onGoWithdraw }) {
  return (
    <header className="topbar">
      <button
        type="button"
        className="brand-btn"
        onClick={onGoHome}
        aria-label="Go to Home"
      >
        <div className="brand">
          <Sparkles size={18} />
        </div>
        <div className="brand-text">
          <b>Research Survey</b>
          <small>Department of Psychology · University of Dhaka</small>
        </div>
      </button>

      <nav className="topnav-menu" aria-label="Main navigation">
        <button
          type="button"
          className={`nav-link ${activeView === 'survey' ? 'active' : ''}`}
          onClick={onGoHome}
        >
          <Home size={14} />
          <span>Home</span>
        </button>
        <button
          type="button"
          className={`nav-link ${activeView === 'withdraw' ? 'active' : ''}`}
          onClick={onGoWithdraw}
        >
          <KeyRound size={14} />
          <span>Withdraw My Response</span>
        </button>
      </nav>
    </header>
  );
}
