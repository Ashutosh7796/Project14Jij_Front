import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { clearAuthData, getToken, decodeJwtPayload } from '../utils/auth';
import { useAuth } from '../context/AuthContext';

function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
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
 *  1. Waiting for AuthContext bootstrap
 *  2. Checking a token exists
 *  3. Validating the token is not expired (client-side exp check)
 *  4. Optionally checking the stored role matches the required role
 *
 * Server-side authorization must still enforce roles on every API call.
 */
const ProtectedRoute = ({ children, role }) => {
  const location = useLocation();
  const { loading } = useAuth();
  const token = getToken();
  const userRole = localStorage.getItem('role');

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (isTokenExpired(token)) {
    clearAuthData();
    return <Navigate to="/" state={{ from: location, sessionExpired: true }} replace />;
  }

  if (role) {
    const allowed = ROLE_MAP[role] ?? [role];
    if (!allowed.includes(userRole?.toUpperCase())) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
