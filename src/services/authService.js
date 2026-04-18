import { authApi } from '../api/authApi';
import { clearAllRequestCache } from '../cache/requestCache';
import {
  setToken, setRole, setUserData, setUserEmail, setUserId,
  getToken, getUserData, isAuthenticated, clearAuthData,
  normalizeAccessToken,
} from '../utils/auth';

export const authService = {
  login: async (credentials, type = 'user') => {
    // CRITICAL: Clear ALL old auth data BEFORE setting new data.
    // This prevents stale admin tokens from persisting when an employee logs in.
    clearAuthData();
    clearAllRequestCache();

    const response = await authApi.login(credentials, type);

    if (response.accessToken) {
      // Determine role from response or fallback to type
      const roles = response.roles || [];
      let role = type.toUpperCase();

      if (roles.length > 0) {
        const matchedRole = roles.find(r => r === `ROLE_${type.toUpperCase()}` || r === type.toUpperCase());
        if (matchedRole) {
          role = matchedRole.replace('ROLE_', '');
        } else {
          role = roles[0].replace('ROLE_', '');
        }
      }

      const userData = {
        userId: response.userId,
        email: credentials.email,
        role: role,
        ...response
      };

      // Single source of truth — all auth localStorage writes happen here.
      setToken(response.accessToken);
      setRole(role);
      if (response.userId) setUserId(response.userId);
      if (credentials.email) setUserEmail(credentials.email);
      setUserData(userData);

      // CRITICAL: Verify token was actually stored (compare normalized forms —
      // API may return "Bearer eyJ…" or quoted strings; setToken normalizes.)
      const storedToken = getToken();
      const raw = response.accessToken;
      if (!storedToken || storedToken !== normalizeAccessToken(raw)) {
        throw new Error('Failed to store authentication token');
      }
    }

    return response;
  },

  register: async (userData) => {
    const response = await authApi.register(userData);
    return response;
  },

  adminLogin: async (credentials) => {
    return authService.login(credentials, 'admin');
  },

  employeeLogin: async (credentials) => {
    return authService.login(credentials, 'employee');
  },

  labLogin: async (credentials) => {
    return authService.login(credentials, 'lab');
  },

  forgotPassword: async (email) => {
    return authApi.forgotPassword(email);
  },

  resetPassword: async (resetData) => {
    return authApi.resetPassword(resetData);
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
    } finally {
      // authApi.logout() already calls clearAuthData(),
      // but we call it again in finally for safety.
      clearAuthData();
      clearAllRequestCache();
    }
  },

  getToken,
  getUser: getUserData,
  isAuthenticated
};