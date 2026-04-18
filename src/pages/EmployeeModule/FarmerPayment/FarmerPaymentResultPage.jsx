import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BASE_URL } from "../../../config/api";
import { authenticatedFetch } from "../../../utils/auth";
import { downloadFarmerInvoicePdf } from "../../../utils/farmerInvoicePdf";

const STATUS_META = {
  success: {
    title: "Payment Successful",
    subtitle: "Farmer registration payment was completed successfully.",
    color: "#166534",
    bg: "#dcfce7",
  },
  failed: {
    title: "Payment Failed",
    subtitle: "Payment could not be completed. Please try again.",
    color: "#991b1b",
    bg: "#fee2e2",
  },
  cancelled: {
    title: "Payment Cancelled",
    subtitle: "Payment was cancelled by user.",
    color: "#92400e",
    bg: "#fef3c7",
  },
};

export default function FarmerPaymentResultPage({ status = "failed" }) {
  const { search } = useLocation();
  const order = new URLSearchParams(search).get("order");
  const meta = STATUS_META[status] || STATUS_META.failed;
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const loadPayment = async () => {
      if (!order) return;
      setLoading(true);
      setError("");
      try {
        const res = await authenticatedFetch(
          `${BASE_URL}/api/v1/farmer-payment/order/${encodeURIComponent(order)}`,
          { method: "GET" }
        );
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            throw new Error("Invoice requires login. Please sign in again.");
          }
          throw new Error("Could not load invoice details");
        }
        const json = await res.json().catch(() => ({}));
        if (!ignore) setPayment(json);
      } catch (err) {
        if (!ignore) setError(err.message || "Could not load invoice details");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    loadPayment();
    return () => {
      ignore = true;
    };
  }, [order]);

  const invoiceData = useMemo(() => {
    if (!payment) return null;
    return {
      invoiceNo: `INV-${payment.paymentId || "NA"}`,
      orderId: payment.ccavenueOrderId || order || "NA",
      paymentId: payment.paymentId || "NA",
      farmerName: payment.farmerName || "NA",
      surveyId: payment.surveyId || "NA",
      amount: payment.amount ?? "NA",
      paymentStatus: payment.paymentStatus || status.toUpperCase(),
      trackingId: payment.trackingId || "NA",
      bankRefNo: payment.bankRefNo || "NA",
      paymentMode: payment.ccavenuePaymentMode || "NA",
      paidAt: payment.updatedAt || payment.createdAt || "",
    };
  }, [payment, order, status]);

  const handleDownloadInvoice = () => {
    if (!invoiceData) return;
    void downloadFarmerInvoicePdf({
      paymentId: invoiceData.paymentId,
      ccavenueOrderId: invoiceData.orderId,
      farmerName: invoiceData.farmerName,
      surveyId: invoiceData.surveyId,
      amount: invoiceData.amount,
      paymentStatus: invoiceData.paymentStatus,
      trackingId: invoiceData.trackingId,
      bankRefNo: invoiceData.bankRefNo,
      ccavenuePaymentMode: invoiceData.paymentMode,
      updatedAt: invoiceData.paidAt,
    }).catch(() => {});
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 700,
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          padding: 24,
          boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
        }}
      >
        <h1 style={{ margin: 0, color: meta.color }}>{meta.title}</h1>
        <p style={{ color: "#475569", marginTop: 8 }}>{meta.subtitle}</p>
        {order ? (
          <div
            style={{
              marginTop: 12,
              background: meta.bg,
              color: meta.color,
              borderRadius: 10,
              padding: "10px 12px",
              fontWeight: 600,
            }}
          >
            Order ID: {order}
          </div>
        ) : null}

        {loading ? <p style={{ marginTop: 10, color: "#475569" }}>Loading invoice details...</p> : null}
        {error ? <p style={{ marginTop: 10, color: "#b91c1c" }}>{error}</p> : null}
        {status === "success" && invoiceData ? (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginTop: 12 }}
            onClick={handleDownloadInvoice}
          >
            Download Invoice
          </button>
        ) : null}

        <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link to="/employee/farmer-registration" className="btn btn-primary">
            Back to Farmer Registration
          </Link>
          <Link to="/employee/dashboard" className="btn btn-secondary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
