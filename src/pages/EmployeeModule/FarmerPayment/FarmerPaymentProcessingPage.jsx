import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BASE_URL } from "../../../config/api";

const POLL_INTERVAL_MS = 2500;
const MAX_WAIT_MS = 120000;

function mapResultToPath(resultStatus, orderId) {
  const suffix = orderId ? `?order=${encodeURIComponent(orderId)}` : "";
  const normalized = String(resultStatus || "").toUpperCase();
  if (normalized === "SUCCESS") return `/farmer-payment/success${suffix}`;
  if (normalized === "CANCELLED") return `/farmer-payment/cancelled${suffix}`;
  return `/farmer-payment/failed${suffix}`;
}

export default function FarmerPaymentProcessingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queueId = searchParams.get("queueId");
  const [statusText, setStatusText] = useState("Waiting for payment confirmation...");
  const [error, setError] = useState("");

  const queueStatusUrl = useMemo(() => {
    if (!queueId) return null;
    return `${BASE_URL}/api/payment/queue/${encodeURIComponent(queueId)}`;
  }, [queueId]);

  useEffect(() => {
    if (!queueStatusUrl) {
      setError("Missing queue ID. Unable to track payment status.");
      return;
    }

    let active = true;
    let timerId = null;
    const startedAt = Date.now();

    const poll = async () => {
      try {
        const res = await fetch(queueStatusUrl, { method: "GET" });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            throw new Error(
              "Payment status API is blocked (403/401). Backend security/proxy must allow /api/payment/queue/**."
            );
          }
          if (res.status === 404) {
            throw new Error("Queue status not found yet. Please retry in a moment.");
          }
          throw new Error("Payment status service unavailable");
        }
        const json = await res.json().catch(() => ({}));
        const queueStatus = String(json?.status || "").toUpperCase();

        if (!active) return;

        if (queueStatus === "DONE") {
          navigate(mapResultToPath(json?.resultStatus, json?.orderId), { replace: true });
          return;
        }

        if (queueStatus === "DEAD") {
          navigate("/farmer-payment/failed?reason=processing_error", { replace: true });
          return;
        }

        const attempts = Number(json?.attemptCount || 0);
        setStatusText(
          `Processing payment callback... attempt ${Math.max(attempts, 1)}. Please do not refresh.`
        );

        if (Date.now() - startedAt > MAX_WAIT_MS) {
          setError("Processing is taking longer than expected. Please check payment status in history.");
          return;
        }
      } catch (e) {
        if (!active) return;
        setError(e.message || "Unable to track payment status.");
        const msg = String(e.message || "");
        if (msg.includes("blocked (403/401)")) {
          return;
        }
      }

      if (active) {
        timerId = window.setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();
    return () => {
      active = false;
      if (timerId) window.clearTimeout(timerId);
    };
  }, [navigate, queueStatusUrl]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f8fafc",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 24,
          background: "#fff",
          boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
        }}
      >
        <h1 style={{ margin: 0, color: "#1d4ed8" }}>Payment Processing</h1>
        <p style={{ marginTop: 10, color: "#334155", fontWeight: 600 }}>
          {statusText}
        </p>
        <p style={{ marginTop: 8, color: "#64748b" }}>
          Do not refresh, close, or navigate back until processing completes.
        </p>
        {queueId ? (
          <p style={{ marginTop: 10, color: "#0f172a" }}>
            Queue ID: <strong>{queueId}</strong>
          </p>
        ) : null}
        {error ? (
          <div
            style={{
              marginTop: 14,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#b91c1c",
              borderRadius: 10,
              padding: "10px 12px",
            }}
          >
            {error}
          </div>
        ) : null}

        <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link to="/employee/farmer-history" className="btn btn-secondary">
            Farmer History
          </Link>
          <Link to="/employee/dashboard" className="btn btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

