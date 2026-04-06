import { BASE_URL, getAuthHeaders } from "../config/api";

export const farmerApi = {

  /* ================= FARMERS ================= */

  getAllFarmers: async () => {
    const response = await fetch(
      `${BASE_URL}/api/v1/admin/users/farmers`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch farmers");
    }

    return response.json();
  },

  getFarmerById: async (id) => {
    const response = await fetch(
      `${BASE_URL}/api/v1/admin/users/${id}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch farmer");
    }

    return response.json();
  },

  /* ================= FARMER REGISTRATION ================= */

  createFarmer: async (farmerData) => {
    const response = await fetch(
      `${BASE_URL}/api/v1/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...farmerData,
          role: "USER"
        })
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Failed to create farmer");
    }

    return response.json();
  },

  /* ================= UPDATE / DELETE ================= */

  updateFarmer: async (id, farmerData) => {
    const response = await fetch(
      `${BASE_URL}/api/v1/admin/users/${id}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(farmerData)
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update farmer");
    }

    return response.json();
  },

  deleteFarmer: async (id) => {
    const response = await fetch(
      `${BASE_URL}/api/v1/admin/users/${id}`,
      {
        method: "DELETE",
        headers: getAuthHeaders()
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete farmer");
    }

    return true;
  },

  /* ================= SURVEY HISTORY ================= */

  getSurveyHistory: async (farmerId) => {
    const response = await fetch(
      `${BASE_URL}/api/v1/survey?farmerId=${farmerId}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch survey history");
    }

    return response.json();
  }
};
