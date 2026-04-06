import { clearAuthData } from './auth';

/**
 * Standardized API Response Handler
 * Handles different response formats from backend consistently
 */

/**
 * Extract data from API response
 * Handles multiple response formats:
 * - { data: {...} }
 * - { success: true, data: {...} }
 * - Direct data object
 * 
 * @param {Object} response - API response object
 * @returns {*} Extracted data
 */
export const extractResponseData = (response) => {
  if (!response) return null;
  
  if (response.data !== undefined) {
    return response.data;
  }
  
  if (response.success && response.data !== undefined) {
    return response.data;
  }
  
  return response;
};

/**
 * Handle API errors consistently
 * @param {Error} error - Error object
 * @param {string} defaultMessage - Default error message
 * @returns {string} User-friendly error message
 */
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  if (error.response) {
    const message = error.response.data?.message || error.response.data?.error;
    return message || `Error: ${error.response.status}`;
  } else if (error.request) {
    return 'Network error. Please check your connection.';
  } else {
    return error.message || defaultMessage;
  }
};

/**
 * Check if response indicates authentication failure
 * @param {Response} response - Fetch response object
 * @returns {boolean}
 */
export const isAuthError = (response) => {
  return response.status === 401 || response.status === 403;
};

/**
 * Check if response indicates not found
 * @param {Response} response - Fetch response object
 * @returns {boolean}
 */
export const isNotFoundError = (response) => {
  return response.status === 404;
};

/**
 * Standardized fetch wrapper with error handling
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
export const apiFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    
    // Handle authentication errors — use centralised clearAuthData
    // so ALL auth keys are wiped, not just a partial subset.
    if (isAuthError(response)) {
      clearAuthData();
      window.location.href = '/';
      throw new Error('Authentication failed. Please login again.');
    }
    
    if (isNotFoundError(response)) {
      return null;
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return extractResponseData(data);
    
  } catch (error) {
    throw error;
  }
};
