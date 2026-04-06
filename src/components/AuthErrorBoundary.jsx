import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuthData, getToken } from '../utils/auth';
import './AuthErrorBoundary.css';

/**
 * AuthErrorBoundary
 *
 * Listens for the global 'auth-error' event and shows a session-expired modal.
 *
 * RACE CONDITION GUARDS:
 *  1. At event time — if a valid token already exists in localStorage,
 *     the 401 is stale (new login completed). Suppress the modal.
 *  2. While the modal is showing — poll getToken() every 300ms.
 *     If a new token appears (same-tab login), dismiss immediately.
 *     NOTE: the `storage` event only fires cross-tab, so we MUST poll
 *     for same-tab token writes.
 */
const AuthErrorBoundary = ({ children }) => {
  const [error,     setError]     = useState(null);
  const [countdown, setCountdown] = useState(3);
  const navigate = useNavigate();

  // ── Listen for auth-error events ──
  useEffect(() => {
    const handle = (event) => {
      const { message, status } = event.detail ?? {};
      if (status !== 401) return;

      // Guard: if a fresh token already exists, this 401 is stale.
      if (getToken()) return;

      setCountdown(3);
      setError({ message: message || 'Your session has expired', type: 'session-expired' });
    };

    window.addEventListener('auth-error', handle);
    return () => window.removeEventListener('auth-error', handle);
  }, []);

  // ── Countdown → redirect ──
  useEffect(() => {
    if (!error) return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
    clearAuthData();
    navigate('/', { replace: true, state: { message: error.message, from: window.location.pathname } });
    setError(null);
  }, [error, countdown, navigate]);

  // ── Same-tab token detection: poll every 300ms ──
  // The `storage` event only fires from OTHER tabs, so we poll
  // localStorage directly to detect same-tab token writes
  // (e.g. employee logging in while the modal is visible).
  useEffect(() => {
    if (!error) return;

    const interval = setInterval(() => {
      if (getToken()) {
        // A new login just succeeded — dismiss the modal.
        setError(null);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [error]);

  if (error) {
    return (
      <div className="auth-error-overlay">
        <div className="auth-error-modal">
          <div className="auth-error-icon">🔒</div>
          <h2 className="auth-error-title">Session Expired</h2>
          <p className="auth-error-message">{error.message}</p>
          <p className="auth-error-countdown">Redirecting to login in {countdown}s…</p>
          <button
            className="auth-error-button"
            onClick={() => { clearAuthData(); setError(null); navigate('/'); }}
          >
            Go to Login Now
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default AuthErrorBoundary;

