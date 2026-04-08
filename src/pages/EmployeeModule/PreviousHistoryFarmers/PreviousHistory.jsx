import React, { useState, useEffect } from "react";
import "./PreviousHistory.css";
import SurveyDetailView from "../HistoryOverview/HistoryOverview";
import FarmerRegistration from "../FarmerRegistration/FarmerRegistration";
import { useToast } from "../../../hooks/useToast";
import { BASE_URL } from "../../../config/api";
import { authenticatedFetch, getToken } from "../../../utils/auth";
 
const PreviousHistory = () => {
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
    const userRole = localStorage.getItem("role");
 
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
        const hasSelfie = !!item.farmerSelfie?.imageUrl;
        const hasSignature = !!item.farmerSignature?.imageUrl;
 
        const status =
          item.formStatus === "ACTIVE"
            ? "Active"
            : item.formStatus === "PENDING"
            ? "Pending"
            : "Inactive";
 
        return {
          id: item.surveyId || item.id,
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
        };
      });
 
      setHistoryData(transformedData);
    } catch (err) {
      setError(err.message || "Failed to load history data");
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
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
            {filteredData.map((item) => (
              <tr key={item.id}>
                <td data-label="Farmer Name">{item.farmerName}</td>
                <td data-label="Village">{item.village}</td>
                <td data-label="Survey Type">{item.surveyType}</td>
                <td data-label="Date">{item.date}</td>
                <td data-label="Status">
                  <span className={`status-badge ${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </td>
                <td data-label="Action">
                  <div className="action-btn-wrapper">
                    {item.status === "Active" ? (
                      <button
                        className="btn-view"
                        onClick={() => handleView(item.id)}
                      >
                        View
                      </button>
                    ) : (
                      <button
                        className="btn-upload"
                        onClick={() => handleResume(item.id)}
                      >
                        ⬆ Upload
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
 
        {filteredData.length === 0 && (
          <div className="no-results">
            <p>No farmer histories found matching your filters.</p>
          </div>
        )}
        {totalPages > 1 && (
          <div className="pagination-wrapper">
            <button
              className="page-btn"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Pre
            </button>
 
            {getVisiblePages().map((p) => (
              <button
                key={p}
                className={`page-btn ${page === p ? "active" : ""}`}
                onClick={() => setPage(p)}
              >
                {p + 1}
              </button>
            ))}
 
            <button
              className="page-btn"
              disabled={page === totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
      
      {/* Toast Notifications */}
      <ToastComponent />
    </div>
  );
};
 
export default PreviousHistory;
 
 