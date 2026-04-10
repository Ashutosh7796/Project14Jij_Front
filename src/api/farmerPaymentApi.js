import { BASE_URL } from "../config/api";
import { getToken } from "../utils/auth";

function buildIdempotencyKey(surveyId) {
  return `farmer-${surveyId}-${Date.now()}`;
}

const inFlightInitiateBySurvey = new Map();

export const farmerPaymentApi = {
  async initiatePayment(surveyId) {
    const normalizedSurveyId = String(surveyId ?? "").trim();
    if (!normalizedSurveyId) {
      throw new Error("Invalid survey selected for payment.");
    }

    if (inFlightInitiateBySurvey.has(normalizedSurveyId)) {
      return inFlightInitiateBySurvey.get(normalizedSurveyId);
    }

    const token = getToken();
    if (!token) {
      throw new Error("Authentication required. Please login again.");
    }

    const requestPromise = (async () => {
      const response = await fetch(`${BASE_URL}/api/v1/farmer-payment/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Idempotency-Key": buildIdempotencyKey(normalizedSurveyId),
        },
        body: JSON.stringify({ surveyId: normalizedSurveyId }),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json.message || "Unable to initiate farmer payment");
      }

      return json;
    })();

    inFlightInitiateBySurvey.set(normalizedSurveyId, requestPromise);
    try {
      return await requestPromise;
    } finally {
      inFlightInitiateBySurvey.delete(normalizedSurveyId);
    }
  },
};
