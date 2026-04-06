import { BASE_URL, getAuthHeaders } from "../config/api"

export const orderApi = {

  /* -------- Create Order -------- */
  createOrder: async (orderData) => {
    const response = await fetch(
      `${BASE_URL}/orders`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData)
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Failed to create order");
    }

    return response.json();
  },

  /* -------- Orders by User -------- */
  getMyOrders: async (userId) => {
    const response = await fetch(
      `${BASE_URL}/orders/user/${userId}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) throw new Error("Failed to fetch orders");

    const result = await response.json();
    return result.data;
  },

  /* -------- Order by ID -------- */
  getOrderById: async (id) => {
    const response = await fetch(
      `${BASE_URL}/orders/${id}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) throw new Error("Failed to fetch order");

    const result = await response.json();
    return result.data;
  }
};
