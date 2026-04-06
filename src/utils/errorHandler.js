/**
 * Enhanced Error Handler
 * Provides user-friendly error messages and handles edge cases
 */
import { clearAuthData } from './auth';

const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  ACCOUNT_LOCKED: 'Your account has been locked. Please contact support.',
  SESSION_EXPIRED: 'Your session has expired. Redirecting to login...',
  LOGGED_IN_ELSEWHERE: 'You have been logged in on another device. Please log in again.',
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
  TIMEOUT: 'Request timed out. Please try again.',
  SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  INVALID_INPUT: 'Invalid input provided. Please correct and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  NOT_FOUND: 'The requested resource was not found.',
};

export const getErrorMessage = (error) => {
  if (!navigator.onLine) return ERROR_MESSAGES.NETWORK_ERROR;

  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch')) return ERROR_MESSAGES.NETWORK_ERROR;
    if (error.message.includes('timeout')) return ERROR_MESSAGES.TIMEOUT;
    return error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  if (error.status || error.statusCode) {
    const status = error.status || error.statusCode;
    switch (status) {
      case 401: return ERROR_MESSAGES.UNAUTHORIZED;
      case 403: return ERROR_MESSAGES.FORBIDDEN;
      case 404: return ERROR_MESSAGES.NOT_FOUND;
      case 408: return ERROR_MESSAGES.TIMEOUT;
      case 422: return ERROR_MESSAGES.VALIDATION_ERROR;
      case 500:
      case 502:
      case 503:
      case 504: return ERROR_MESSAGES.SERVER_ERROR;
      default: return error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
    }
  }

  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return ERROR_MESSAGES.UNKNOWN_ERROR;
};

/**
 * Handle authentication errors with automatic logout.
 * Uses clearAuthData() — the single source of truth — so ALL auth keys
 * are wiped, not just a partial subset.
 */
export const handleAuthError = (error, navigate) => {
  const status = error.status || error.statusCode;

  if (status === 401) {
    // ✅ Use centralised clearAuthData so no key is missed
    clearAuthData();

    const message = error.message?.toLowerCase().includes('another device')
      ? ERROR_MESSAGES.LOGGED_IN_ELSEWHERE
      : ERROR_MESSAGES.SESSION_EXPIRED;

    setTimeout(() => {
      if (navigate) {
        navigate('/', { state: { message, from: window.location.pathname } });
      } else {
        window.location.href = '/';
      }
    }, 1500);

    return true;
  }

  return false;
};

export const createSafeError = (error) => ({
  message: error.message || 'Unknown error',
  status: error.status || error.statusCode,
  timestamp: new Date().toISOString(),
});

export const setupGlobalErrorHandler = () => {
  window.addEventListener('unhandledrejection', (event) => {
    // Suppress all unhandled promise rejections from the console in production
    // to avoid leaking API URLs, tokens, or internal error details.
    event.preventDefault();
    if (import.meta.env.DEV) {
      // In dev, still log so developers can debug
      console.warn('[Unhandled rejection]', event.reason?.message ?? event.reason);
    }
    const message = getErrorMessage(event.reason);
    window.dispatchEvent(new CustomEvent('app-error', { detail: { message } }));
  });
};

export const retryWithBackoff = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (error.status === 401 || error.status === 403 || error.status === 422) throw error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
};
