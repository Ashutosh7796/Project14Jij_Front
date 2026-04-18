import { BASE_URL, enhancedFetch } from "../config/api";
import { clearAuthData, getToken } from "../utils/auth";

export const authApi = {

  /* ===================== LOGIN ===================== */
  login: async (credentials) => {
    const response = await enhancedFetch(
      `${BASE_URL}/jwt/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: credentials.email,
          password: credentials.password,
        }),
      },
      { skipAuth: true, rateLimitType: "login" }
    );
    return response.json();
  },

  /* ===================== REGISTER ===================== */
  register: async (registerData) => {
    const digits = String(registerData.phone ?? "").replace(/\D/g, "");
    const mobile10 = digits.length >= 10 ? digits.slice(-10) : digits;

    const payload = {
      firstName: registerData.firstName?.trim() || "",
      lastName: registerData.lastName?.trim() || "",
      email: registerData.email?.trim(),
      password: registerData.password,
      confirmPassword: registerData.confirmPassword,
      mobileNumber: Number(mobile10),
      role: "USER",
      acceptTerms: Boolean(registerData.acceptTerms),
      acceptPrivacyPolicy: Boolean(registerData.acceptPrivacyPolicy),
    };

    const response = await enhancedFetch(
      `${BASE_URL}/api/auth/v1/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      { skipAuth: true, rateLimitType: "login" }
    );
    return response.json();
  },

  /* ===================== LOGOUT ===================== */
  logout: async () => {
    const token = getToken();

    // ── Clear local state FIRST, before any network call ──────────────────
    // This ensures that even if the backend logout call is slow or fires
    // multiple times, the new login's token is never affected.
    clearAuthData();

    // ── Fire-and-forget backend logout — do NOT await ──────────────────────
    // Awaiting this caused a race: the backend received the logout request
    // AFTER the new employee token was issued, blacklisting the new token.
    // We intentionally do not await — the token is already cleared locally.
    if (token) {
      fetch(`${BASE_URL}/api/v1/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  },
};
