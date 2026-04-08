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
    const payload = {
      firstName:    registerData.name?.split(" ")[0] || "",
      lastName:     registerData.name?.split(" ").slice(1).join(" ") || "",
      email:        registerData.email,
      password:     registerData.password,
      mobileNumber: Number(registerData.phone),
      role:         "USER",
    };

    const response = await enhancedFetch(
      `${BASE_URL}/api/v1/auth/register`,
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
