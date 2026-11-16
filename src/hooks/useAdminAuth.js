import { useState, useCallback } from 'react';
import {
  getAdminSession,
  loginAdmin,
  logoutAdmin,
} from '../services/supabase/adminAuthService';

/**
 * Custom hook to manage admin authentication state across /admin routes.
 */
export function useAdminAuth() {
  const [session, setSession] = useState(() => getAdminSession());

  const signIn = useCallback((username, password) => {
    const result = loginAdmin(username, password);
    if (result.ok) {
      setSession(result.session);
    }
    return result;
  }, []);

  const signOut = useCallback(() => {
    logoutAdmin();
    setSession(null);
  }, []);

  return {
    session,
    isAuthenticated: Boolean(session?.authenticated),
    signIn,
    signOut,
  };
}
