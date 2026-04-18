import React, { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { farmerPaymentApi } from "../../../api/farmerPaymentApi";
import "./FarmerPaymentPage.css";

function openCcAvenueForm(paymentFormHtml) {
  if (!paymentFormHtml || /<script[\s>]/i.test(paymentFormHtml)) {
    throw new Error("Invalid payment form received from server");
  }

  const container = document.createElement("div");
  container.style.display = "none";
  container.innerHTML = paymentFormHtml;
  document.body.appendChild(container);

  const form = container.querySelector("form");
  if (!form) {
    document.body.removeChild(container);
    throw new Error("Invalid payment form received from server");
  }

  const action = form.getAttribute("action") || "";
  const isCcAvenue = /^https:\/\/(?:test\.)?ccavenue\.com\//i.test(action);
  const hasEncRequest = !!form.querySelector('input[name="encRequest"]');
  const hasAccessCode = !!form.querySelector('input[name="access_code"]');
  if (!isCcAvenue || !hasEncRequest || !hasAccessCode) {
    document.body.removeChild(container);
    throw new Error("Payment form security validation failed.");
  }

  form.submit();
}

export default function FarmerPaymentPage() {
  const navigate = useNavigate();
  const { surveyId } = useParams();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const farmerName = searchParams.get("farmerName") || "Farmer";
  const fee = useMemo(() => "350", []);
  const normalizedSurveyId = String(surveyId ?? "").trim();

  const handleProceedPayment = async () => {
    if (!normalizedSurveyId) {
      setError("Invalid survey selected for payment.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const payment = await farmerPaymentApi.initiatePayment(normalizedSurveyId);
      if (!payment?.paymentFormHtml) {
        throw new Error("Payment form not available. Please try again.");
      }
      openCcAvenueForm(payment.paymentFormHtml);
    } catch (err) {
      setError(err.message || "Payment initiation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="farmer-payment-page">
      <div className="farmer-payment-card">
        <div className="farmer-payment-head">
          <h1>Farmer Survey Payment</h1>
          <p>
            Survey <strong>#{surveyId}</strong> submitted for <strong>{farmerName}</strong>.
          </p>
        </div>

        <section className="payment-section payment-fee">
          <h2>🎓 Membership Fee</h2>
          <div className="payment-fee-box">
            <span className="fee-label">Membership Fee:</span>
            <span className="fee-value">₹{fee}/-</span>
          </div>
          <p className="fee-words">(In words: Rupees Three Hundred Fifty Only)</p>
        </section>

        <section className="payment-section">
          <h2>🎁 Benefits of Registration</h2>
          <ul>
            <li>Workshops by trained agricultural experts.</li>
            <li>Guidance on modern farming techniques.</li>
            <li>Practical field-based demonstrations.</li>
            <li>Special organic gift and seeds collection for registered farmers.</li>
          </ul>
        </section>

        <section className="payment-section">
          <h2>📄 Terms &amp; Conditions</h2>
          <ul>
            <li>Jioji company reserves the right to make changes to its policies.</li>
            <li>
              In case of any legal dispute, jurisdiction shall be limited to Chhatrapati
              Sambhajinagar (Aurangabad) Court only.
            </li>
          </ul>
        </section>

        {loading ? (
          <div className="payment-processing">
            Processing payment... Please do not refresh or press back.
          </div>
        ) : null}

        {error ? <div className="payment-error">{error}</div> : null}

        <div className="payment-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)} disabled={loading}>
            Back
          </button>
          <button type="button" className="btn-primary" onClick={handleProceedPayment} disabled={loading}>
            {loading ? "Redirecting to gateway..." : "Proceed to Pay with CCAvenue"}
          </button>
        </div>
      </div>
    </div>
  );
}
