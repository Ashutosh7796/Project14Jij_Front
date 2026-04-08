import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/authService';
import { clearAuthData, getToken, getUserData, decodeJwtPayload } from '../utils/auth';

const AuthContext = createContext(null);

/* ── helpers ─────────────────────────────────────────────── */

function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return Date.now() / 1000 > payload.exp - 10; // 10s clock-skew buffer
}

/* ── provider ────────────────────────────────────────────── */

export const AuthProvider = ({ children }) => {
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [authError, setAuthError] = useState(null);

  // Ref-based callback so login() can await the React state flush.
  const loginResolverRef = useRef(null);

  // True while a login() call is in progress.  The global 401
  // listener checks this ref and SKIPS the session-expired cascade
  // when a login is actively running — any 401 during this window
  // is a stale response from the previous session, not a failure
  // of the new one.
  const isLoggingInRef = useRef(false);

  /* ── flush detector: resolves login() after setUser renders ── */
  useEffect(() => {
    if (loginResolverRef.current && user) {
      loginResolverRef.current();
      loginResolverRef.current = null;
    }
  }, [user]);

  /* ── bootstrap: read persisted session on first load ── */
  useEffect(() => {
    const token = getToken();

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    if (isTokenExpired(token)) {
      clearAuthData();
      setUser(null);
      setLoading(false);
      return;
    }

    const stored = getUserData();
    const role   = localStorage.getItem('role');
    setUser(stored ?? { token, role });
    setLoading(false);
  }, []);

  /* ── global 401 listener ── */
  useEffect(() => {
    const handle401 = (event) => {
      const { status } = event.detail ?? {};
      if (status !== 401) return;

      // ─── Guard 1: login in progress ─────────────────────────
      if (isLoggingInRef.current) return;

      // ─── Guard 2: valid token exists ────────────────────────
      // A 401 from an API endpoint can mean "insufficient permissions"
      // NOT "session expired".  Only trigger session-expired when the
      // token is genuinely missing or expired.
      const token = getToken();
      if (token && !isTokenExpired(token)) return;

      performLogout();
      window.dispatchEvent(new CustomEvent('auth-error', { detail: event.detail }));
    };
    window.addEventListener('app-error', handle401);
    return () => window.removeEventListener('app-error', handle401);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── logout — awaited so storage is clear before state update ── */
  const performLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      clearAuthData();
    } finally {
      setUser(null);
      setAuthError(null);
    }
  }, []);

  /* ── login ── */
  const login = useCallback(async (credentials, type = 'user') => {
    setAuthError(null);
    isLoggingInRef.current = true;
    try {
      const response = await authService.login(credentials, type);
      const userData = authService.getUser();

      // CRITICAL: Wait a moment for backend ActiveSessionService to register the new token
      // This prevents race conditions where API calls fire before the session is registered
      await new Promise(resolve => setTimeout(resolve, 300));

      // If authService stored user data, wait for React to commit
      // the new state before returning so navigate() fires AFTER
      // isAuthenticated flips to true.
      if (userData) {
        await new Promise((resolve) => {
          loginResolverRef.current = resolve;
          setUser(userData);
        });
      } else {
        // Fallback: if getUserData was empty for some reason, set
        // a minimal user object so isAuthenticated becomes true.
        const fallback = {
          token: getToken(),
          role: localStorage.getItem('role'),
        };
        await new Promise((resolve) => {
          loginResolverRef.current = resolve;
          setUser(fallback);
        });
      }

      if (import.meta.env.DEV) {
        console.log('✅ Login complete, user state set, token ready');
      }
      return response;
    } catch (error) {
      setAuthError(error.userMessage || error.message);
      throw error;
    } finally {
      isLoggingInRef.current = false;
    }
  }, []);

  /* ── register ── */
  const register = useCallback(async (userData) => {
    setAuthError(null);
    try {
      return await authService.register(userData);
    } catch (error) {
      setAuthError(error.userMessage || error.message);
      throw error;
    }
  }, []);

  const value = {
    user,
    login,
    register,
    logout: performLogout,
    isAuthenticated: !!user,
    loading,
    authError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

