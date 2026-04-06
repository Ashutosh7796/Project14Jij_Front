import { BASE_URL, getAuthHeaders } from "../config/api";

export const labReportApi = {

  /* -------- All Lab Reports -------- */
  getAllReports: async () => {
    const response = await fetch(
      `${BASE_URL}/lab-reports/all`,
      { headers: getAuthHeaders() }
    );
    if (!response.ok) throw new Error("Failed to fetch lab reports");

    const result = await response.json();
    return result.data;
  },

  /* -------- Reports by Farmer -------- */
  getReportsByFarmerId: async (farmerId) => {
    const response = await fetch(
      `${BASE_URL}/lab-reports/farmer/${farmerId}`,
      { headers: getAuthHeaders() }
    );
    if (!response.ok) throw new Error("Failed to fetch farmer reports");

    const result = await response.json();
    return result.data;
  },

  /* -------- Create Report -------- */
  createReport: async (reportData) => {
    const response = await fetch(
      `${BASE_URL}/lab-reports`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(reportData)
      }
    );
    if (!response.ok) throw new Error("Failed to create report");

    const result = await response.json();
    return result.data;
  },

  /* -------- Update Report Status -------- */
  updateReportStatus: async (id, status, details = "") => {
    const response = await fetch(
      `${BASE_URL}/lab-reports/${id}/status?status=${status}&details=${encodeURIComponent(details)}`,
      {
        method: "PUT",
        headers: getAuthHeaders()
      }
    );
    if (!response.ok) throw new Error("Failed to update report status");

    const result = await response.json();
    return result.data;
  }
};
