/**
 * Client-side Rate Limiter
 * Prevents API abuse and excessive requests
 */

class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.limits = {
      default: { maxRequests: 60, windowMs: 60000 }, // 60 requests per minute
      login: { maxRequests: 5, windowMs: 300000 }, // 5 attempts per 5 minutes
      api: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
    };
  }

  /**
   * Check if request is allowed
   * @param {string} key - Unique key for the request (e.g., endpoint + userId)
   * @param {string} type - Type of limit to apply
   * @returns {object} { allowed: boolean, retryAfter: number }
   */
  checkLimit(key, type = 'default') {
    const limit = this.limits[type] || this.limits.default;
    const now = Date.now();
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const requests = this.requests.get(key);
    
    // Remove old requests outside the time window
    const validRequests = requests.filter(
      timestamp => now - timestamp < limit.windowMs
    );
    
    this.requests.set(key, validRequests);
    
    // Check if limit exceeded
    if (validRequests.length >= limit.maxRequests) {
      const oldestRequest = validRequests[0];
      const retryAfter = Math.ceil((oldestRequest + limit.windowMs - now) / 1000);
      
      return {
        allowed: false,
        retryAfter,
        message: `Too many requests. Please try again in ${retryAfter} seconds.`
      };
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return { allowed: true };
  }

  /**
   * Reset limits for a specific key
   * @param {string} key - Key to reset
   */
  reset(key) {
    this.requests.delete(key);
  }

  /**
   * Clear all limits
   */
  clearAll() {
    this.requests.clear();
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, delay = 1000) => {
  let timeoutId;
  let lastExecTime = 0;
  
  return function (...args) {
    const currentTime = Date.now();
    const timeSinceLastExec = currentTime - lastExecTime;
    
    if (timeSinceLastExec >= delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - timeSinceLastExec);
    }
  };
};

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay = 300) => {
  let timeoutId;
  
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

/**
 * Check if API request is allowed
 * @param {string} endpoint - API endpoint
 * @param {string} type - Type of limit
 * @returns {object} Rate limit check result
 */
export const checkRateLimit = (endpoint, type = 'api') => {
  const userId = localStorage.getItem('userId') || 'anonymous';
  const key = `${endpoint}_${userId}`;
  
  return rateLimiter.checkLimit(key, type);
};

/**
 * Reset rate limit for endpoint
 * @param {string} endpoint - API endpoint
 */
export const resetRateLimit = (endpoint) => {
  const userId = localStorage.getItem('userId') || 'anonymous';
  const key = `${endpoint}_${userId}`;
  
  rateLimiter.reset(key);
};

export default rateLimiter;
