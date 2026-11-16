/**
 * Admin Authentication Service (Static Bootstrap Stage)
 * Isolated in a dedicated service module so upgrading to Supabase Auth or
 * server-side JWT/cookie authentication later only requires editing this file.
 */

const SESSION_KEY = 'research_admin_session_v1';

export function getAdminSession() {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.authenticated === true && parsed.username) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function loginAdmin(username, password) {
  const cleanUser = String(username || '').trim();
  const cleanPass = String(password || '');

  if (cleanUser === 'admin' && cleanPass === 'admin') {
    const session = {
      authenticated: true,
      username: 'admin',
      role: 'research_admin',
      authMode: 'static-dev',
      loggedInAt: new Date().toISOString(),
    };
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    return { ok: true, session };
  }

  return {
    ok: false,
    error: 'Invalid username or password. Please check your credentials and try again.',
  };
}

export function logoutAdmin() {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    window.sessionStorage.removeItem(SESSION_KEY);
  }
}
