import { checkRateLimit } from "./rateLimiter";

/**
 * ============================================================
 *  CENTRALIZED AUTH UTILITY — Single Source of Truth
 * ============================================================
 *
 *  ALL token read / write / clear operations MUST go through
 *  this module.  No file should ever call localStorage directly
 *  for auth data.
 *
 *  Canonical key: "token"  (used everywhere)
 * ============================================================
 */

// ─── Token Key Constants ────────────────────────────────────
const TOKEN_KEY = "token";
const ROLE_KEY = "role";
const USER_ID_KEY = "userId";
const USER_EMAIL_KEY = "userEmail";
const USER_ROLE_KEY = "userRole"; // secondary role key used in some pages
const USER_DATA_KEY = "user"; // JSON stringified user object
const EMPLOYEE_CODE_KEY = "employeeCode";
const EMPLOYEE_NAME_KEY = "employeeName";

// Legacy key that was causing the mismatch bug — included so
// clearAuthData() removes it even if some old code wrote to it.
const LEGACY_AUTH_TOKEN_KEY = "authToken";

/** Max JWT string length (header+payload+sig). Proxies often allow 8–16KB Authorization headers. */
const MAX_JWT_LENGTH = 16384;

// ─── All auth-related keys (for full cleanup) ───────────────
const ALL_AUTH_KEYS = [
  TOKEN_KEY,
  ROLE_KEY,
  USER_ID_KEY,
  USER_EMAIL_KEY,
  USER_ROLE_KEY,
  USER_DATA_KEY,
  EMPLOYEE_CODE_KEY,
  EMPLOYEE_NAME_KEY,
  LEGACY_AUTH_TOKEN_KEY,
];

// ─── Token ──────────────────────────────────────────────────

/**
 * Normalize a raw access token from the API or localStorage.
 * Fixes: accidental "Bearer " stored inside the token, wrapping quotes,
 * newlines (break headers), and stray whitespace — all of which can
 * yield "Malformed JWT" on the server while other users still work.
 */
export function normalizeAccessToken(raw) {
  if (raw == null || raw === "") return "";
  let t = String(raw).trim();
  // Strip wrapping quotes if the API double-encoded the string
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim();
  }
  // Some APIs return "Bearer eyJ..." as the accessToken field — strip every prefix
  while (/^Bearer\s+/i.test(t)) {
    t = t.replace(/^Bearer\s+/i, "").trim();
  }
  // Header-breaking characters
  t = t.replace(/[\r\n\t]+/g, "");
  return t;
}

/**
 * Decode JWT payload (middle segment) as UTF-8 JSON — required for claims with non-ASCII text.
 * Returns null if the token is not a valid JWT or payload is not valid JSON.
 */
export function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const pad = "=".repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(base64 + pad);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function assertJwtUsable(normalized) {
  if (!normalized) return "empty";
  if (normalized.length > MAX_JWT_LENGTH) return "too_long";
  const parts = normalized.split(".");
  if (parts.length !== 3) return "bad_shape";
  const payload = decodeJwtPayload(normalized);
  if (!payload || typeof payload !== "object") return "bad_payload_json";
  return null;
}

/** Save the JWT access token */
export function setToken(token) {
  if (token) {
    const normalized = normalizeAccessToken(token);
    const err = assertJwtUsable(normalized);
    if (err) {
      if (import.meta.env.DEV) {
        console.error("❌ ATTEMPTING TO STORE INVALID TOKEN!", err);
        console.error("   Length:", normalized?.length, "Preview:", String(token).substring(0, 120));
      }
      throw new Error(
        err === "too_long"
          ? "JWT token too large"
          : "Invalid JWT token format — please login again"
      );
    }

    console.log(
      "✅ Storing valid token:",
      normalized.substring(0, 50) + "...",
      "Length:",
      normalized.length
    );
    localStorage.setItem(TOKEN_KEY, normalized);
  }
}

/** Read the current JWT access token (may be null) */
export function getToken() {
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;

  const normalized = normalizeAccessToken(raw);
  const err = assertJwtUsable(normalized);

  if (err) {
    if (import.meta.env.DEV) {
      console.error("❌ INVALID OR CORRUPTED TOKEN IN LOCALSTORAGE!", err);
      console.error("   Preview:", raw.substring(0, 120));
    }
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }

  // Self-heal: persist normalized form if storage had Bearer prefix / quotes / newlines
  if (normalized !== raw) {
    localStorage.setItem(TOKEN_KEY, normalized);
  }

  return normalized;
}

/** Check whether a token exists in storage */
export function isAuthenticated() {
  return !!getToken();
}

// ─── Role ───────────────────────────────────────────────────

export function setRole(role) {
  if (role) {
    localStorage.setItem(ROLE_KEY, role);
  }
}

export function getRole() {
  return localStorage.getItem(ROLE_KEY);
}

// ─── User ID ────────────────────────────────────────────────

export function setUserId(id) {
  if (id != null) {
    localStorage.setItem(USER_ID_KEY, String(id));
  }
}

export function getUserId() {
  return localStorage.getItem(USER_ID_KEY);
}

// ─── User Email ─────────────────────────────────────────────

export function setUserEmail(email) {
  if (email) {
    localStorage.setItem(USER_EMAIL_KEY, email);
  }
}

export function getUserEmail() {
  return localStorage.getItem(USER_EMAIL_KEY);
}

// ─── Employee metadata ──────────────────────────────────────

export function setEmployeeMeta(code, name) {
  if (code) localStorage.setItem(EMPLOYEE_CODE_KEY, code);
  if (name) localStorage.setItem(EMPLOYEE_NAME_KEY, name);
}

// ─── User Data (full JSON object) ───────────────────────────

export function setUserData(userData) {
  if (userData) {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  }
}

export function getUserData() {
  try {
    const raw = localStorage.getItem(USER_DATA_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─── Full Session Cleanup ───────────────────────────────────

/**
 * Wipe every auth-related key from localStorage.
 *
 * MUST be called:
 *  • on logout
 *  • BEFORE every fresh login (clears stale admin / employee tokens)
 *  • on 401 interception
 */
export function clearAuthData() {
  ALL_AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
}

// ─── Auth Headers ───────────────────────────────────────────

/**
 * Build Bearer headers using the CURRENT token.
 * @param {boolean} isFormData — if true, omits Content-Type so the
 *   browser can set the multipart boundary automatically.
 */
export function getAuthHeaders(isFormData = false) {
  const token = getToken();
  const headers = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

// ─── Authenticated Fetch (central token injector) ───────────

/**
 * Wrapper around `fetch` that:
 *  1. Injects the Bearer token from localStorage.
 *  2. Returns the raw Response — callers handle status codes.
 *
 * IMPORTANT: This wrapper does NOT clear auth data or dispatch
 * events on 401.  A 401 from an API endpoint can mean "insufficient
 * permissions for this resource" — not necessarily "session expired".
 * Destroying the session on every 401 is what caused the dashboard
 * to break after login.
 *
 * Session expiry is detected at the AuthContext level (bootstrap
 * check on mount, token-expiry validation).
 *
 * @param {object} [fetchMeta] — optional: { skipRateLimit?: boolean, rateLimitType?: string }
 */
export async function authenticatedFetch(url, options = {}, fetchMeta = {}) {
  const { skipRateLimit = false, rateLimitType = "api" } = fetchMeta;
  if (!skipRateLimit) {
    const rateCheck = checkRateLimit(url, rateLimitType);
    if (!rateCheck.allowed) {
      const err = new Error(rateCheck.message);
      err.userMessage = rateCheck.message;
      throw err;
    }
  }

  const method = (options.method || 'GET').toUpperCase();
  const isGET = method === 'GET';
  const { _isFormData, ...restOptions } = options;

  // CRITICAL: Get fresh token for EVERY request
  const token = getToken();
  if (!token) {
    const error = new Error('No authentication token found');
    error.status = 401;
    throw error;
  }

  if (isGET) {
    let res;
    // Smart Retry: Handle backend DB lock race conditions (e.g. immediately after login)
    // Allows up to 2 retries (3 attempts total).
    for (let i = 0; i <= 2; i++) {
      const headers = {
        ...getAuthHeaders(_isFormData),
        ...options.headers,
      };

      res = await fetch(url, { ...restOptions, headers });
      
      // Success or explicit empty fallback — no retry needed
      if (res.ok || res.status === 404) return res;
      
      // Temporary authentication rejection (race condition) or server error -> retry
      if ((res.status === 401 || res.status === 403 || res.status >= 500) && i < 2) {
        // Linear backoff: wait 400ms, then 800ms
        await new Promise(r => setTimeout(r, 400 * (i + 1)));
        continue;
      }
      
      break; 
    }
    return res;
  }

  // Non-GET requests (mutations like POST/PUT/DELETE) are sent EXACTLY once
  // to avoid unintended duplicate transactions on the backend.
  const headers = {
    ...getAuthHeaders(_isFormData),
    ...options.headers,
  };
  return fetch(url, { ...restOptions, headers });
}

