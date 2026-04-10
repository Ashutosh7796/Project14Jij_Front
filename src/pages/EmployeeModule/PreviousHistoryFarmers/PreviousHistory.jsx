import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./PreviousHistory.css";
import SurveyDetailView from "../HistoryOverview/HistoryOverview";
import FarmerRegistration from "../FarmerRegistration/FarmerRegistration";
import { useToast } from "../../../hooks/useToast";
import { BASE_URL } from "../../../config/api";
import { authenticatedFetch, getToken } from "../../../utils/auth";
import { downloadFarmerInvoicePdf } from "../../../utils/farmerInvoicePdf";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

const PreviousHistory = () => {
  const isMobile = useIsMobile();

  const extractSurveyId = (item) => {
    const candidates = [item?.surveyId, item?.id, item?.surveyID, item?.survey_id, item?.formNumber];
    for (const candidate of candidates) {
      if (candidate === null || candidate === undefined) continue;
      const text = String(candidate).trim();
      if (text) return text;
    }
    return "";
  };

  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [selectedSurveyData, setSelectedSurveyData] = useState(null);
 
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  const [historyData, setHistoryData] = useState([]);
 
  const [page, setPage] = useState(0); // backend is 0-based
  const [pageSize] = useState(10); // fixed 10 records
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const paymentStateCacheRef = useRef(new Map());
  // ✅ show only 3 page numbers (Pre 1 2 3 Next)
  const getVisiblePages = () => {
    const maxButtons = 3;
 
    let start = Math.max(page - 1, 0);
    let end = Math.min(start + maxButtons, totalPages);
 
    // adjust start if near end
    if (end - start < maxButtons) {
      start = Math.max(end - maxButtons, 0);
    }
 
    return Array.from({ length: end - start }, (_, i) => start + i);
  };
 
  // Check authentication on mount
  useEffect(() => {
    const token = getToken();
 
    if (!token) {
      showToast("You are not logged in. Please login first.", "error");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
      return;
    }
 
    fetchHistoryData();
  }, [page]);
 
  const fetchHistoryData = async () => {
    setLoading(true);
    setError(null);
 
    try {
      const response = await authenticatedFetch(
        `${BASE_URL}/api/v1/employeeFarmerSurveys/my?page=${page}&size=${pageSize}`,
        { method: "GET" },
        showToast
      );
 
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch history data: ${response.status} - ${errorText}`
        );
      }
 
      const apiResponse = await response.json();
      const responseData = apiResponse.data;
 
      let data = [];
 
      if (responseData && Array.isArray(responseData.content)) {
        // ✅ Paginated response
        data = responseData.content;
 
        setTotalPages(responseData.totalPages ?? 0);
        setTotalElements(responseData.totalElements ?? 0);
      } else if (Array.isArray(responseData)) {
        // ✅ Non-paginated fallback
        data = responseData;
 
        setTotalPages(1);
        setTotalElements(responseData.length);
      } else {
        data = [];
      }
 
      // Transform API data to match your existing structure
      const transformedData = data.map((item) => {
        const normalizedSurveyId = extractSurveyId(item);
        const status =
          item.formStatus === "ACTIVE"
            ? "Active"
            : item.formStatus === "PENDING"
            ? "Pending"
            : "Inactive";
 
        return {
          id: normalizedSurveyId,
          farmerName: item.farmerName || "N/A",
          village: item.village || "N/A",
          surveyType: item.surveyType || "Annual",
          mobileNumber: item.farmerMobile || "N/A",
          formNumber: item.formNumber || "N/A",
          date: item.createdAt
            ? new Date(item.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "-",
          status,
          hasSuccessfulPayment: false,
        };
      });
 
      setHistoryData(transformedData);
      enrichPaymentState(transformedData);
    } catch (err) {
      setError(err.message || "Failed to load history data");
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaidSurveyIds = async (surveyIds) => {
    const uniqueSurveyIds = [...new Set((surveyIds || []).filter(Boolean).map(String))];
    if (!uniqueSurveyIds.length) return new Map();

    const cache = paymentStateCacheRef.current;
    const missingSurveyIds = uniqueSurveyIds.filter((id) => !cache.has(id));
    if (!missingSurveyIds.length) {
      return new Map(uniqueSurveyIds.map((id) => [id, cache.get(id)]));
    }
    try {
      const res = await authenticatedFetch(
        `${BASE_URL}/api/v1/farmer-payment/survey/bulk-status`,
        {
          method: "POST",
          body: JSON.stringify({ surveyIds: missingSurveyIds }),
        }
      );

      if (!res.ok) {
        missingSurveyIds.forEach((surveyId) => cache.set(surveyId, null));
        return new Map(uniqueSurveyIds.map((id) => [id, cache.get(id) || null]));
      }

      const json = await res.json().catch(() => ({}));
      const successfulPaymentsBySurveyId = json?.successfulPaymentsBySurveyId
        || json?.data?.successfulPaymentsBySurveyId
        || {};

      missingSurveyIds.forEach((surveyId) => {
        const payment = successfulPaymentsBySurveyId?.[surveyId];
        if (payment && typeof payment === "object") {
          cache.set(surveyId, payment);
        } else {
          cache.set(surveyId, null);
        }
      });
    } catch (e) {
      missingSurveyIds.forEach((surveyId) => cache.set(surveyId, null));
    }

    return new Map(uniqueSurveyIds.map((id) => [id, cache.get(id) || null]));
  };

  const enrichPaymentState = async (rows) => {
    const activeSurveyIds = rows
      .filter((item) => item.status === "Active" && item.id)
      .map((item) => item.id);
    const paidSurveyIds = await fetchPaidSurveyIds(activeSurveyIds);

    setHistoryData((prev) =>
      prev.map((item) => {
        const key = String(item.id || "");
        const successfulPayment = key ? paidSurveyIds.get(key) || null : null;
        return {
          ...item,
          hasSuccessfulPayment: !!successfulPayment,
          successfulPayment,
        };
      })
    );
  };
 
  const filteredData = historyData.filter((item) => {
    const matchesSearch =
      item.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.mobileNumber && item.mobileNumber.includes(searchTerm));
    const matchesVillage =
      selectedVillage === "" || item.village === selectedVillage;
    const matchesStatus =
      selectedStatus === "" || item.status === selectedStatus;
    return matchesSearch && matchesVillage && matchesStatus;
  });
 
  // Get unique villages from history data for dropdown
  const uniqueVillages = [
    ...new Set(historyData.map((item) => item.village)),
  ].sort();
 
  // 🔹 View survey details
  const handleView = (id) => {
    setSelectedSurvey(id);
    setIsEditing(false);
  };
 
  // 🔹 Edit survey
  const handleResume = async (id) => {
    try {
      const res = await authenticatedFetch(
        `${BASE_URL}/api/v1/employeeFarmerSurveys/${id}`,
        { method: "GET" },
        showToast
      );
 
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
 
      setSelectedSurvey(id);
      setSelectedSurveyData(json.data); // ✅ FULL survey
      setIsEditing(true);
    } catch (err) {
      showToast("Failed to load survey details", "error");
    }
  };
 
  // 🔹 Back to history list
  const handleBackToList = () => {
    setSelectedSurvey(null);
    setIsEditing(false);
    // Refresh data after editing
    fetchHistoryData();
  };

  const handleProceedToPayment = (item) => {
    const surveyId = String(item?.id || "").trim();
    if (!surveyId) {
      showToast("Survey ID missing for payment.", "error");
      return;
    }

    navigate(
      `/employee/farmer-payment/${surveyId}?farmerName=${encodeURIComponent(
        item.farmerName || ""
      )}`
    );
  };

  const handleDownloadInvoice = (item) => {
    if (!item?.successfulPayment) {
      showToast("Invoice details not available yet.", "error");
      return;
    }
    downloadFarmerInvoicePdf({
      ...item.successfulPayment,
      farmerName: item.successfulPayment.farmerName || item.farmerName,
      surveyId: item.successfulPayment.surveyId || item.id,
    });
  };
 
  // 🔹 Edit Mode → FarmerRegistration
  if (selectedSurvey !== null && isEditing) {
    const surveyData = historyData.find((item) => item.id === selectedSurvey);
    return (
      <FarmerRegistration
        isEdit={true}
        initialData={selectedSurveyData}
        scrollToSelfie={true}
        autoAcceptTerms={true}
        onSuccess={() => {
          // Update history status if needed
          setHistoryData((prev) =>
            prev.map((item) =>
              item.id === selectedSurvey ? { ...item, status: "Active" } : item
            )
          );
          paymentStateCacheRef.current.delete(String(selectedSurvey));
          handleBackToList();
        }}
      />
    );
  }
 
  // 🔹 View Mode → SurveyDetailView
  if (selectedSurvey !== null && !isEditing) {
    return (
      <SurveyDetailView surveyId={selectedSurvey} onBack={handleBackToList} />
    );
  }
 
  // Show loading state
  if (loading) {
    return (
      <div className="previous-history-page">
        <h1 className="page-title">History of My Farmers</h1>
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
          Loading farmer histories...
        </div>
      </div>
    );
  }
 
  // Show error state
  if (error && historyData.length === 0) {
    return (
      <div className="previous-history-page">
        <h1 className="page-title">History of My Farmers</h1>
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
            onClick={fetchHistoryData}
            style={{
              padding: "10px 20px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
 
  return (
    <div className="previous-history-page">
      <h1 className="page-title">History of My Farmers</h1>
 
      <div className="filters-card">
        <h2 className="filters-title">Search & Filters</h2>
 
        <div className="search-section">
          <label>Search by Farmer Name or Mobile</label>
          <input
            type="text"
            className="search-input"
            placeholder="Enter farmer name or mobile number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
 
        <div className="filter-row">
          <div className="filter-group">
            <label>Village</label>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
            >
              <option value="">All Villages</option>
              {uniqueVillages.map((village) => (
                <option key={village} value={village}>
                  {village}
                </option>
              ))}
            </select>
          </div>
 
          <div className="filter-group">
            <label>Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>
 
      <div className="results-info">
        Showing {filteredData.length} farmer histories.
      </div>
 
      {isMobile ? (
        <div className="mobile-card-list">
          {filteredData.map((item, idx) => (
            <div className="farmer-card" key={item.id || `${item.formNumber || "survey"}-${idx}`}>
              <div className="farmer-card-row">
                <span className="farmer-card-label">Farmer Name</span>
                <span className="farmer-card-value">{item.farmerName}</span>
              </div>
              <div className="farmer-card-row">
                <span className="farmer-card-label">Village</span>
                <span className="farmer-card-value">{item.village}</span>
              </div>
              <div className="farmer-card-row">
                <span className="farmer-card-label">Survey Type</span>
                <span className="farmer-card-value">{item.surveyType}</span>
              </div>
              <div className="farmer-card-row">
                <span className="farmer-card-label">Date</span>
                <span className="farmer-card-value">{item.date}</span>
              </div>
              <div className="farmer-card-row">
                <span className="farmer-card-label">Status</span>
                <span className={`status-badge ${item.status.toLowerCase()}`}>{item.status}</span>
              </div>
              <div className="farmer-card-actions">
                {item.status === "Active" ? (
                  <>
                    <button className="btn-view" onClick={() => handleView(item.id)} disabled={!item.id}>View</button>
                    {!item.id ? (
                      <span className="btn-paid">ID Missing</span>
                    ) : item.hasSuccessfulPayment ? (
                      <>
                        <span className="btn-paid">Paid</span>
                        <button className="btn-invoice" onClick={() => handleDownloadInvoice(item)}>Download Invoice</button>
                      </>
                    ) : (
                      <button className="btn-payment" onClick={() => handleProceedToPayment(item)}>Proceed To Payment</button>
                    )}
                  </>
                ) : (
                  <button className="btn-upload" onClick={() => handleResume(item.id)}>Upload</button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Farmer Name</th>
                <th>Village</th>
                <th>Survey Type</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, idx) => (
                <tr key={item.id || `${item.formNumber || "survey"}-${idx}`}>
                  <td>{item.farmerName}</td>
                  <td>{item.village}</td>
                  <td>{item.surveyType}</td>
                  <td>{item.date}</td>
                  <td>
                    <span className={`status-badge ${item.status.toLowerCase()}`}>{item.status}</span>
                  </td>
                  <td>
                    <div className="action-btn-wrapper">
                      {item.status === "Active" ? (
                        <>
                          <button className="btn-view" onClick={() => handleView(item.id)} disabled={!item.id}>View</button>
                          {!item.id ? (
                            <span className="btn-paid">ID Missing</span>
                          ) : item.hasSuccessfulPayment ? (
                            <>
                              <span className="btn-paid">Paid</span>
                              <button className="btn-invoice" onClick={() => handleDownloadInvoice(item)}>Download Invoice</button>
                            </>
                          ) : (
                            <button className="btn-payment" onClick={() => handleProceedToPayment(item)}>Proceed To Payment</button>
                          )}
                        </>
                      ) : (
                        <button className="btn-upload" onClick={() => handleResume(item.id)}>Upload</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredData.length === 0 && (
        <div className="no-results">
          <p>No farmer histories found matching your filters.</p>
        </div>
      )}
      {totalPages > 1 && (
        <div className="pagination-wrapper">
          <button className="page-btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Pre</button>
          {getVisiblePages().map((p) => (
            <button key={p} className={`page-btn ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>{p + 1}</button>
          ))}
          <button className="page-btn" disabled={page === totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
      
      {/* Toast Notifications */}
      <ToastComponent />
    </div>
  );
};
 
export default PreviousHistory;
 
 