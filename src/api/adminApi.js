import { BASE_URL } from "../config/api";
import { extractResponseData } from "../utils/apiResponseHandler";
import { authenticatedFetch } from "../utils/auth";

export const adminApi = {

  /* ================= DASHBOARD ================= */
  getDashboardStats: async () => {
    const res = await authenticatedFetch(
      `${BASE_URL}/api/v1/admin/users/dashboard/stats`,
      {},
      { skipGetRetry: true }
    );
    // 404 means the endpoint isn't implemented yet — return empty gracefully
    if (res.status === 404 || res.status === 401 || res.status === 403) return null;
    if (!res.ok) return null;
    const data = await res.json();
    return extractResponseData(data);
  },

  /* ================= EMPLOYEES ================= */
  getAllEmployees: async (page = 0, size = 10) => {
    const res = await authenticatedFetch(`${BASE_URL}/api/v1/admin/users/employees?page=${page}&size=${size}`);

    if (!res.ok) throw new Error("Failed to fetch employees");
    const data = await res.json();
    return extractResponseData(data);
  },

  getEmployeeById: async (id) => {
    const res = await authenticatedFetch(`${BASE_URL}/api/v1/admin/users/employees/${id}`);

    if (!res.ok) throw new Error("Failed to fetch employee");
    const data = await res.json();
    return extractResponseData(data);
  },

  createEmployee: async (data) => {
    const res = await authenticatedFetch(`${BASE_URL}/api/v1/admin/users/create-employee`, {
      method: "POST",
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error("Failed to create employee");
    const responseData = await res.json();
    return extractResponseData(responseData);
  },

  updateEmployee: async (id, data) => {
    const res = await authenticatedFetch(`${BASE_URL}/api/v1/admin/users/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error("Failed to update employee");
    const responseData = await res.json();
    return extractResponseData(responseData);
  },

  deleteEmployee: async (id) => {
    const res = await authenticatedFetch(`${BASE_URL}/api/v1/admin/users/employees/${id}`, {
      method: "DELETE"
    });

    if (!res.ok) throw new Error("Failed to delete employee");
    return true;
  },

  /* ================= PRODUCTS ================= */
  addProduct: async (data) => {
    const res = await authenticatedFetch(`${BASE_URL}/api/v1/admin/products/add`, {
      method: "POST",
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error("Failed to add product");
    const responseData = await res.json();
    return extractResponseData(responseData);
  },

  updateProduct: async (id, data) => {
    const res = await authenticatedFetch(`${BASE_URL}/api/v1/admin/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error("Failed to update product");
    const responseData = await res.json();
    return extractResponseData(responseData);
  },

  deleteProduct: async (id) => {
    const res = await authenticatedFetch(`${BASE_URL}/api/v1/admin/products/${id}`, {
      method: "DELETE"
    });

    if (!res.ok) throw new Error("Failed to delete product");
    return true;
  },

  /* ================= FARMERS ================= */
  getAllFarmers: async (page = 0, size = 10) => {
    const res = await authenticatedFetch(
      `${BASE_URL}/api/v1/employeeFarmerSurveys?page=${page}&size=${size}`,
      {},
      { skipGetRetry: true }
    );
    if (res.status === 401 || res.status === 403 || res.status === 404) return null;
    if (!res.ok) return null;
    const data = await res.json();
    return extractResponseData(data);
  },

  /* ================= ATTENDANCE ================= */
  
  // Get all employees' attendance for a specific month/year
  getAllEmployeesAttendance: async (month, year) => {
    const res = await authenticatedFetch(`${BASE_URL}/api/v1/attendance/admin/all-employees?month=${month}&year=${year}`);

    if (res.status === 404) {
      return [];
    }

    if (!res.ok) throw new Error("Failed to fetch all employees attendance");
    const response = await res.json();
    return extractResponseData(response);
  },

  // Get specific employee's attendance for a specific month/year
  getEmployeeAttendanceHistory: async (employeeId, month, year) => {
    const res = await authenticatedFetch(`${BASE_URL}/api/v1/admin/attendance/employee/${employeeId}?month=${month}&year=${year}`);

    if (res.status === 404) {
      return { records: [] };
    }

    if (!res.ok) throw new Error("Failed to fetch attendance history");
    const response = await res.json();
    
    return extractResponseData(response);
  },

  // Get employee attendance by date range
  getEmployeeAttendanceByDateRange: async (employeeId, startDate, endDate) => {
    const res = await authenticatedFetch(`${BASE_URL}/api/v1/attendance/admin/attendance/employee/${employeeId}/range?startDate=${startDate}&endDate=${endDate}`);

    if (res.status === 404) {
      return { records: [] };
    }

    if (!res.ok) throw new Error("Failed to fetch attendance by date range");
    const response = await res.json();
    return extractResponseData(response);
  },

  // Get employee attendance for specific date
  getEmployeeAttendanceByDate: async (employeeId, date) => {
    const res = await authenticatedFetch(`${BASE_URL}/api/v1/attendance/admin/attendance/employee/${employeeId}/date/${date}`);

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) throw new Error("Failed to fetch attendance for date");
    const response = await res.json();
    return extractResponseData(response);
  }
};
