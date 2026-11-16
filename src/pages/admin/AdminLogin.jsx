import React, { useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, LogIn } from 'lucide-react';

export default function AdminLogin({ isAuthenticated, onSignIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = e => {
    e.preventDefault();
    setError('');
    const res = onSignIn(username, password);
    if (resultOk(res)) {
      navigate('/admin/dashboard', { replace: true });
    } else {
      setError(res.error || 'Authentication failed.');
    }
  };

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div className="admin-brand-mark">
            <Lock size={17} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>
              Researcher Admin Login
            </h1>
            <div style={{ fontSize: 12.5, color: '#64748b' }}>
              Statistical Analysis & Reporting Portal
            </div>
          </div>
        </div>

        <p style={{ margin: '12px 0 0', fontSize: 13, color: '#475569', lineHeight: 1.55 }}>
          Sign in to access live Supabase survey data screening, SPSS-grade statistical reporting, and thesis Chapter 4 exports.
        </p>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label htmlFor="admin-username">Username</label>
            <input
              id="admin-username"
              type="text"
              className="admin-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter admin username"
              autoComplete="username"
              required
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              className="admin-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="admin-banner admin-banner-error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="admin-btn admin-btn-primary" style={{ height: 42 }}>
            <LogIn size={15} /> Sign In to Dashboard
          </button>
        </form>

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
          <Link to="/" style={{ fontSize: 13, color: '#1d4ed8', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <ArrowLeft size={14} /> Return to Participant Questionnaire
          </Link>
        </div>
      </div>
    </div>
  );
}

function resultOk(res) {
  return Boolean(res && res.ok);
}
