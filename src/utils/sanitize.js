/**
 * Input Sanitization Utilities
 * Prevents XSS and injection attacks
 */

/**
 * Sanitize string input by removing potentially dangerous characters
 * @param {string} input - User input string
 * @returns {string} Sanitized string
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Sanitize email input
 * @param {string} email - Email input
 * @returns {string} Sanitized email
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  
  // Remove all characters except valid email characters
  return email
    .toLowerCase()
    .replace(/[^a-z0-9@._-]/g, '')
    .trim();
};

/**
 * Sanitize phone number
 * @param {string} phone - Phone number input
 * @returns {string} Sanitized phone number
 */
export const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') return '';
  
  // Remove all non-numeric characters except + at start
  return phone.replace(/[^\d+]/g, '').trim();
};

/**
 * Sanitize numeric input
 * @param {string|number} input - Numeric input
 * @returns {number|null} Sanitized number or null
 */
export const sanitizeNumber = (input) => {
  const num = parseFloat(input);
  return isNaN(num) ? null : num;
};

/**
 * Sanitize object by sanitizing all string values
 * @param {object} obj - Object to sanitize
 * @returns {object} Sanitized object
 */
export const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Validate and sanitize form data
 * @param {object} formData - Form data object
 * @param {object} rules - Validation rules
 * @returns {object} { isValid, sanitizedData, errors }
 */
export const validateAndSanitize = (formData, rules) => {
  const sanitizedData = {};
  const errors = {};
  let isValid = true;
  
  for (const [field, value] of Object.entries(formData)) {
    const rule = rules[field];
    
    if (!rule) {
      sanitizedData[field] = value;
      continue;
    }
    
    // Required check
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors[field] = `${rule.label || field} is required`;
      isValid = false;
      continue;
    }
    
    // Type-specific sanitization
    let sanitized = value;
    
    switch (rule.type) {
      case 'email':
        sanitized = sanitizeEmail(value);
        if (sanitized && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) {
          errors[field] = `${rule.label || field} must be a valid email`;
          isValid = false;
        }
        break;
        
      case 'phone':
        sanitized = sanitizePhone(value);
        if (sanitized && rule.minLength && sanitized.length < rule.minLength) {
          errors[field] = `${rule.label || field} must be at least ${rule.minLength} digits`;
          isValid = false;
        }
        break;
        
      case 'number':
        sanitized = sanitizeNumber(value);
        if (sanitized === null && value !== '') {
          errors[field] = `${rule.label || field} must be a valid number`;
          isValid = false;
        }
        break;
        
      case 'string':
      default:
        sanitized = sanitizeString(value);
        if (rule.minLength && sanitized.length < rule.minLength) {
          errors[field] = `${rule.label || field} must be at least ${rule.minLength} characters`;
          isValid = false;
        }
        if (rule.maxLength && sanitized.length > rule.maxLength) {
          errors[field] = `${rule.label || field} must not exceed ${rule.maxLength} characters`;
          isValid = false;
        }
        break;
    }
    
    sanitizedData[field] = sanitized;
  }
  
  return { isValid, sanitizedData, errors };
};
