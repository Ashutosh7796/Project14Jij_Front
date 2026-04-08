import { getErrorMessage } from '../utils/errorHandler';
import { checkRateLimit } from '../utils/rateLimiter';
import { getAuthHeaders } from '../utils/auth';

function resolveBaseUrl() {
  const env = import.meta.env.VITE_API_BASE_URL?.trim();
  if (import.meta.env.PROD) {
    if (!env) {
      throw new Error(
        'Missing VITE_API_BASE_URL. Set it in .env before production build.'
      );
    }
    return env.replace(/\/$/, '');
  }
  return env || 'http://localhost:8080';
}

export const BASE_URL = resolveBaseUrl();

// Re-export so existing callers of `import { getAuthHeaders } from '../config/api'` keep working
export { getAuthHeaders };

/**
 * Enhanced fetch with rate limiting and error handling.
 * Auth headers are injected from the single source of truth (utils/auth).
 */
export const enhancedFetch = async (url, options = {}, config = {}) => {
  const {
    skipRateLimit = false,
    rateLimitType = 'api',
    skipAuth      = false,
  } = config;

  if (!skipRateLimit) {
    const rateCheck = checkRateLimit(url, rateLimitType);
    if (!rateCheck.allowed) throw new Error(rateCheck.message);
  }

  const headers = skipAuth
    ? options.headers
    : { ...getAuthHeaders(options.isFormData), ...options.headers };

  try {
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || 'Unauthorized');
      error.status = 401;
      error.data   = errorData;
      throw error;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `HTTP ${response.status}`);
      error.status = response.status;
      error.data   = errorData;
      throw error;
    }

    return response;
  } catch (error) {
    error.userMessage = getErrorMessage(error);
    throw error;
  }
};
