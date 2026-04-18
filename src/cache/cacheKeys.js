/**
 * Canonical cache keys + tags. Use tags for selective invalidation after writes.
 */

export const CACHE_TAGS = {
  PRODUCTS: 'tag:products',
  PRODUCT: 'tag:product',
  ORDERS_USER: 'tag:orders:user',
  ADMIN_ORDERS: 'tag:admin:orders',
  ADMIN_DASHBOARD_METRICS: 'tag:admin:dashboard:metrics',
  ADMIN_RECENT_FARMERS: 'tag:admin:recent:farmers',
  ADMIN_FARMER_SURVEYS: 'tag:admin:farmer-surveys',
  FARMER_REG_EMPLOYEES: 'tag:farmer-reg:employees',
  FARMER_REG_FARMERS: 'tag:farmer-reg:farmers',
  MANAGER_DASHBOARD_METRICS: 'tag:manager:dashboard:metrics',
  FARMER_SURVEY_HISTORY: 'tag:farmer:survey:history',
  EMPLOYEE_SURVEYS: 'tag:employee:surveys',
  EMPLOYEE_ATTENDANCE: 'tag:employee:attendance',
  EMPLOYEE_DASHBOARD: 'tag:employee:dashboard',
};

/** Default “fresh” window when using SWR elsewhere */
export const DEFAULT_TTL_MS = 60_000;
export const SWR_FRESH_MS = 45_000;
export const SWR_STALE_MS = 5 * 60_000;

export function cacheKeyProductsList() {
  return 'GET:/api/v1/products';
}

export function cacheKeyProductById(id) {
  return `GET:/api/v1/products/${id}`;
}

export function cacheKeyProductPhotos(productId) {
  return `GET:/api/v1/product-photo/product/${productId}/all`;
}

export function cacheKeyOrdersForUser(userId) {
  return `GET:/orders/user/${userId}`;
}

export function cacheKeyAdminOrdersList(page = 0, size = 200) {
  return `GET:/orders:p=${page}:s=${size}`;
}

export function cacheKeyAdminOrderById(id) {
  return `GET:/orders/${id}`;
}

/** Role-scoped so admin and manager sessions do not share the same aggregate. */
export function cacheKeyDashboardMetrics(role = 'admin') {
  return `GET:aggregate:dashboard:metrics:${role}`;
}

export function cacheKeyEmployeeFarmerSurveysPage(page, size) {
  return `GET:/api/v1/employeeFarmerSurveys:p=${page}:s=${size}`;
}

/** Admin dashboard “recent” strip uses page 0, small size. */
export function cacheKeyAdminRecentFarmers(page = 0, size = 5) {
  return cacheKeyEmployeeFarmerSurveysPage(page, size);
}

export function cacheKeyFarmerSurveyHistory(farmerId) {
  return `GET:/api/v1/survey?farmerId=${farmerId}`;
}

export function cacheKeyEmployeeAttendanceMe() {
  return 'GET:/api/v1/attendance/me';
}

export function cacheKeyEmployeeSurveyStatusCountMe() {
  return 'GET:/api/v1/employeeFarmerSurveys/status-count/me';
}

export function cacheKeyEmployeeSurveyMeStatus(status) {
  return `GET:/api/v1/employeeFarmerSurveys/me/status/${status}`;
}

export function cacheKeyEmployeeRecentSurveys() {
  return 'GET:/api/v1/employeeFarmerSurveys/my:recent3';
}

export function cacheKeyEmployeeHistoryPage(page, size) {
  return `GET:/api/v1/employeeFarmerSurveys/my:p=${page}:s=${size}`;
}

/** Admin/manager “farmer registration list” — employees tab */
export function cacheKeyFarmerRegListEmployees(page, size) {
  return `GET:/api/v1/employees/getAll/surv:p=${page}:s=${size}`;
}

/** Surveys registered by one employee (drill-down) */
export function cacheKeyFarmerRegListFarmers(userId, page, size) {
  return `GET:/api/v1/employeeFarmerSurveys/user/${userId}:p=${page}:s=${size}`;
}
