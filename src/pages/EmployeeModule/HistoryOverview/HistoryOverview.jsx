import React, { useState, useEffect } from "react";
import "./HistoryOverview.css";
import { useToast } from "../../../hooks/useToast";
import { BASE_URL } from "../../../config/api";
import { authenticatedFetch } from "../../../utils/auth";

const SurveyDetailView = ({ surveyId, onBack }) => {
  const { showToast, ToastComponent } = useToast();
  const [surveyData, setSurveyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [signature, setSignature] = useState(null);

  useEffect(() => {
    if (surveyId) {
      fetchSurveyDetails();
      fetchSelfie();
      fetchSignature();
    }
  }, [surveyId]);

  const fetchSurveyDetails = async () => {
    setLoading(true);
    setError(null);

    try {

      const response = await authenticatedFetch(
        `${BASE_URL}/api/v1/employeeFarmerSurveys/${surveyId}`,
        {
          method: "GET",
        },
        showToast
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch survey details: ${response.status}`);
      }

      const apiResponse = await response.json();

      // Extract data from the response
      const data = apiResponse.data;

      if (!data) {
        throw new Error("No survey data found");
      }

      setSurveyData(data);
    } catch (err) {
      setError(err.message || "Failed to load survey details");
    } finally {
      setLoading(false);
    }
  };

  const fetchSelfie = async () => {
    try {
      const res = await authenticatedFetch(
        `${BASE_URL}/api/v1/farmer_selfie_Survey/survey/${surveyId}/photo-type/SELFIE`
      );
      if (res.ok) {
        const json = await res.json();
        setSelfie(json.data);
      }
    } catch {
    }
  };

  const fetchSignature = async () => {
    try {
      const res = await authenticatedFetch(
        `${BASE_URL}/api/v1/farmer_selfie_Survey/survey/${surveyId}/photo-type/SIGNATURE`
      );
      if (res.ok) {
        const json = await res.json();
        setSignature(json.data);
      }
    } catch {
    
    }
  };

  const handleBackToHistory = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  const handleBackToList = () => {
    if (onBack) {
      onBack();
    } else {
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="survey-detail-page">
        <h1 className="page-title">Previous History of Farmers Form</h1>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
            fontSize: "18px",
            color: "#666",
          }}
        >
          Loading survey details...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="survey-detail-page">
        <h1 className="page-title">Previous History of Farmers Form</h1>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
            gap: "20px",
          }}
        >
          <div style={{ fontSize: "18px", color: "#c33" }}>⚠️ {error}</div>
          <button
            onClick={fetchSurveyDetails}
            style={{
              padding: "10px 20px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px",
              marginRight: "10px",
            }}
          >
            Try Again
          </button>
          <button
            onClick={handleBackToHistory}
            style={{
              padding: "10px 20px",
              backgroundColor: "#666",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!surveyData) {
    return (
      <div className="survey-detail-page">
        <h1 className="page-title">Previous History of Farmers Form</h1>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
            fontSize: "18px",
            color: "#666",
          }}
        >
          No survey data available
        </div>
      </div>
    );
  }

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Format datetime helper

  const formatDateTime = (utcString) => {
    if (!utcString) return "N/A";

    // Parse as UTC explicitly
    const date = new Date(utcString);

    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  // Format array to comma-separated string
  const formatArray = (arr) => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return "N/A";
    return arr.join(", ");
  };

  return (
    <div className="survey-detail-page">
      <h1 className="page-title">Previous History of Farmers Form</h1>

      <div className="survey-header">
        <button className="btn-back" onClick={handleBackToHistory}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to History
        </button>

        <div className="survey-title-section">
          <div className="survey-title-row">
            <h2>
              Survey #{surveyData.formNumber || surveyData.surveyId || surveyId}
            </h2>
            <span
              className={`status-badge ${(
                surveyData.formStatus || "active"
              ).toLowerCase()}`}
            >
              {surveyData.formStatus || "Active"}
            </span>
          </div>
          <p className="view-type">Read-Only View</p>
        </div>
      </div>

      <div className="detail-sections">
        {/* Farmer Information */}
        <div className="detail-card">
          <h3 className="section-title">Farmer Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Farmer Name</span>
              <span className="detail-value">
                {surveyData.farmerName || "N/A"}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Mobile Number</span>
              <span className="detail-value">
                {surveyData.farmerMobile || "N/A"}
              </span>
            </div>
            {/* <div className="detail-item">
              <span className="detail-label">User ID</span>
              <span className="detail-value">{surveyData.userId || 'N/A'}</span>
            </div> */}
            <div className="detail-item">
              <span className="detail-label">Address</span>
              <span className="detail-value">
                {surveyData.address || "N/A"}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Taluka</span>
              <span className="detail-value">{surveyData.taluka || "N/A"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">District</span>
              <span className="detail-value">
                {surveyData.district || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Farm & Land Details */}
        <div className="detail-card">
          <h3 className="section-title">Farm & Land Details</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Land Area</span>
              <span className="detail-value">
                {surveyData.landArea ? `${surveyData.landArea} acres` : "N/A"}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Farm Information</span>
              <span className="detail-value">
                {surveyData.farmInformation
                  ? surveyData.farmInformation.charAt(0).toUpperCase() +
                    surveyData.farmInformation.slice(1)
                  : "N/A"}
              </span>
            </div>
            <div className="detail-item full-width">
              <span className="detail-label">Crop Details</span>
              <span className="detail-value">
                {formatArray(surveyData.cropDetails)}
              </span>
            </div>
            <div className="detail-item full-width">
              <span className="detail-label">Livestock Details</span>
              <span className="detail-value">
                {formatArray(surveyData.livestockDetails)}
              </span>
            </div>
            <div className="detail-item full-width">
              <span className="detail-label">Production Equipment</span>
              <span className="detail-value">
                {formatArray(surveyData.productionEquipment)}
              </span>
            </div>
          </div>
        </div>

        {/* Sample Collection */}
        <div className="detail-card">
          <h3 className="section-title">Sample Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Sample Collected</span>
              <span className="detail-value">
                {surveyData.sampleCollected ? "✅ Yes" : "❌ No"}
              </span>
            </div>
          </div>
        </div>

        {/* Farmer Selfie */}
        {/* {surveyData.farmerSelfie && surveyData.farmerSelfie.imageUrl && (
          <div className="detail-card">
            <h3 className="section-title">Farmer Selfie</h3>
            <div className="selfie-container" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '15px',
              padding: '0px'
            }}>
              <img 
                src={`data:image/jpeg;base64,${surveyData.farmerSelfie.imageUrl}`}
                alt="Farmer Selfie"
                style={{
                  maxWidth: '300px',
                  maxHeight: '300px',
                  borderRadius: '10px',
                  border: '2px solid #ddd',
                  objectFit: 'cover'
                }}
              />
              {surveyData.farmerSelfie.takenAt && (
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Taken at: {formatDateTime(surveyData.farmerSelfie.takenAt)}
                </div>
              )}
              {surveyData.farmerSelfie.message && (
                <div style={{ fontSize: '14px', color: '#4CAF50' }}>
                  {surveyData.farmerSelfie.message}
                </div>
              )}
            </div>
          </div>
        )} */}
        {selfie && selfie.imageUrl && (
          <div className="detail-card">
            <h3 className="section-title">Farmer Selfie</h3>

            <div
              className="selfie-container"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "15px",
              }}
            >
              <img
                src={`data:image/jpeg;base64,${selfie.imageUrl}`}
                alt="Farmer Selfie"
                style={{
                  maxWidth: "300px",
                  maxHeight: "300px",
                  borderRadius: "10px",
                  border: "2px solid #ddd",
                  objectFit: "cover",
                }}
              />

              {selfie.takenAt && (
                <div style={{ fontSize: "14px", color: "#666" }}>
                  Taken at: {formatDateTime(selfie.takenAt)}
                </div>
              )}

              <div style={{ fontSize: "14px", color: "#4CAF50" }}>
                Selfie found
              </div>
            </div>
          </div>
        )}

        {signature && signature.imageUrl && (
          <div className="detail-card">
            <h3 className="section-title">Employee Signature</h3>

            <div
              className="selfie-container"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "15px",
              }}
            >
              <img
                src={`data:image/jpeg;base64,${signature.imageUrl}`}
                alt="Employee Signature"
                style={{
                  maxWidth: "300px",
                  maxHeight: "300px",
                  borderRadius: "10px",
                  border: "2px solid #ddd",
                  objectFit: "contain",
                }}
              />

              {signature.takenAt && (
                <div style={{ fontSize: "14px", color: "#666" }}>
                  Uploaded at: {formatDateTime(signature.takenAt)}
                </div>
              )}

              <div style={{ fontSize: "14px", color: "#4CAF50" }}>
                Signature found
              </div>
            </div>
          </div>
        )}

        {/* Form Information */}
        <div className="detail-card">
          <h3 className="section-title">Form Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Form Number</span>
              <span className="detail-value">
                {surveyData.formNumber || "N/A"}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Survey ID</span>
              <span className="detail-value">
                {surveyData.surveyId || "N/A"}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Form Status</span>
              <span className="detail-value">
                {surveyData.formStatus || "Active"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-actions">
        <button className="btn-back-to-list" onClick={handleBackToList}>
          Back to List
        </button>
      </div>
      
      {/* Toast Notifications */}
      <ToastComponent />
    </div>
  );
};

export default SurveyDetailView;
