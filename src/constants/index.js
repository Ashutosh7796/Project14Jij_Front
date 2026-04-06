/**
 * Application Constants
 * Centralized location for all magic strings and numbers
 */

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// User Roles
export const ROLES = {
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  SURVEYOR: 'SURVEYOR',
  LAB: 'LAB',
  LAB_TECHNICIAN: 'LAB_TECHNICIAN',
  USER: 'USER',
};

// Role Prefixes (for backend compatibility)
export const ROLE_PREFIX = 'ROLE_';

// Attendance Status
export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LEAVE: 'LEAVE',
  HALF_DAY: 'HALF_DAY',
  WORK_FROM_HOME: 'WORK_FROM_HOME',
};

// Product Types
export const PRODUCT_TYPES = {
  SEED: 'SEED',
  FERTILIZER: 'FERTILIZER',
  PESTICIDE: 'PESTICIDE',
};

// Product Categories
export const PRODUCT_CATEGORIES = {
  RABI: 'RABI',
  KHARIF: 'KHARIF',
  ZAID: 'ZAID',
};

// File Upload Limits
export const FILE_LIMITS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_SIZE_MB: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
};

// LocalStorage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  ROLE: 'role',
  USER_ID: 'userId',
  USER_EMAIL: 'userEmail',
  LOGIN_LOCATION: 'loginLocation',
};

// API Endpoints (relative paths)
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/jwt/login',
  REGISTER: '/api/v1/auth/register',
  LOGOUT: '/api/v1/auth/logout',
  
  // Admin
  DASHBOARD_STATS: '/api/v1/admin/users/dashboard/stats',
  EMPLOYEES: '/api/v1/admin/users/employees',
  CREATE_EMPLOYEE: '/api/v1/admin/users/create-employee',
  
  // Attendance
  ATTENDANCE_CHECK_IN: '/api/v1/attendance/check-in',
  ATTENDANCE_CHECK_OUT: '/api/v1/attendance/check-out',
  ATTENDANCE_HISTORY: '/api/v1/attendance/admin/attendance/employee',
  
  // Products
  PRODUCTS: '/api/v1/products',
  ADD_PRODUCT: '/api/v1/admin/products/add',
  
  // Farmers
  FARMERS: '/api/v1/farmer-form',
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  API: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
};

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE: 0,
  DEFAULT_SIZE: 10,
  SIZE_OPTIONS: [10, 20, 50, 100],
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_REQUIRED: 'Authentication required. Please login again.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INVALID_INPUT: 'Please check your input and try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  SAVE_SUCCESS: 'Saved successfully!',
  UPDATE_SUCCESS: 'Updated successfully!',
  DELETE_SUCCESS: 'Deleted successfully!',
  UPLOAD_SUCCESS: 'Upload successful!',
};

// Validation Rules
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 50,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  PHONE_LENGTH: 10,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[0-9]{10}$/,
};

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_ZOOM: 15,
  MARKER_COLOR: '#007bff',
};

// Time Configuration
export const TIME_CONFIG = {
  AUTO_LOGOUT_MINUTES: 60,
  TOKEN_REFRESH_MINUTES: 50,
  DEBOUNCE_DELAY_MS: 300,
};
