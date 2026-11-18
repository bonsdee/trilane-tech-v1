import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';
import { refreshSession, setAccessToken, setSessionEndedHandler } from '../api/client';

export const AuthContext = createContext(null);

/**
 * Holds the signed-in team member. On load it tries the refresh cookie, so a
 * page reload keeps you signed in without storing the token in the browser.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    refreshSession()
      .then((session) => {
        if (!cancelled) {
          setUser(session.user);
          setStatus('authenticated');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('anonymous');
      });
    setSessionEndedHandler(() => {
      setUser(null);
      setStatus('anonymous');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const session = await authApi.login(email, password);
    setAccessToken(session.accessToken);
    setUser(session.user);
    setStatus('authenticated');
    return session.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  const value = useMemo(() => ({ user, status, login, logout }), [user, status, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
