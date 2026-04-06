import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { clearAuthData } from '../utils/auth';

/**
 * Decodes a JWT and returns the payload, or null if invalid/expired.
 * No library needed — we only need the exp claim.
 */
function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = decodeToken(token);
  if (!payload?.exp) return true; // treat undecodable tokens as expired
  // exp is in seconds; add 10s buffer for clock skew
  return Date.now() / 1000 > payload.exp - 10;
}

const ROLE_MAP = {
  ADMIN:    ['ADMIN', 'ROLE_ADMIN'],
  EMPLOYEE: ['EMPLOYEE', 'SURVEYOR', 'ROLE_EMPLOYEE', 'ROLE_SURVEYOR'],
  LAB:      ['LAB', 'LAB_TECHNICIAN', 'ROLE_LAB', 'ROLE_LAB_TECHNICIAN'],
  USER:     ['USER', 'ROLE_USER'],
};

/**
 * ProtectedRoute
 *
 * Guards a route by:
 *  1. Checking a token exists in localStorage
 *  2. Validating the token is not expired (client-side exp check)
 *  3. Optionally checking the stored role matches the required role
 *
 * On failure it clears all auth data and redirects to login,
 * preserving the attempted path in location state for post-login redirect.
 */
const ProtectedRoute = ({ children, role }) => {
  const location = useLocation();
  const token    = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  // 1. No token at all
  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // 2. Token exists but is expired — clear stale data and redirect
  if (isTokenExpired(token)) {
    clearAuthData();
    return <Navigate to="/" state={{ from: location, sessionExpired: true }} replace />;
  }

  // 3. Role check (optional — only when a required role is specified)
  if (role) {
    const allowed = ROLE_MAP[role] ?? [role];
    if (!allowed.includes(userRole?.toUpperCase())) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
