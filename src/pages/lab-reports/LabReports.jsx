import React, { useEffect, useRef, useState } from "react";
import { Search, MoreVertical, Eye, Download, Upload } from "lucide-react";
import { BASE_URL } from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import "./Lab.css";
import { useToast } from "../../hooks/useToast";

const LabReportsContent = () => {
  const { showToast, ToastComponent } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const menuRef = useRef(null);

  /* ================= RESPONSIVE LOGIC ================= */
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth <= 1024;

  /* ================= LOOKUP API ================= */
  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    const surveyId = parseInt(searchTerm.trim().replace(/\D/g, ''), 10);
    if (isNaN(surveyId)) {
      showToast("Please enter a valid numeric Survey ID", "error");
      return;
    }

    setLoading(true);
    setReports([]);
    try {
      const token = localStorage.getItem("token");
      if (!token) { setLoading(false); return; }

      const res = await fetch(`${BASE_URL}/api/v1/lab_report/view/${surveyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        if (res.status === 404) {
          // If 404, we stub it to allow upload
          setReports([{ surveyId: surveyId, formNumber: `FORM-${surveyId}`, status: "Pending Upload" }]);
          showToast("No report found. You can upload one.", "info");
        } else {
          showToast("Failed to fetch report from server", "error");
        }
      } else {
        const json = await res.json();
        const data = json.data ?? json;
        setReports([{ 
          ...data,
          surveyId: surveyId,
          formNumber: `FORM-${surveyId}`,
          status: "Complete",
          reportId: data.reportId || data.labReportId
        }]);
      }
    } catch (err) {
      showToast("Network error looking up report", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= CLOSE ACTION MENU ================= */
  useEffect(() => {
    const closeMenu = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  /* ================= CHECK IF REPORT EXISTS ================= */
  const hasReport = (report) => {
    return !!(
      report.reportId ||
      report.labReportId ||
      report.report_id ||
      report.lab_report_id
    );
  };

  /* ================= ACTION HANDLERS ================= */
  const handleView = async (surveyId) => {
    setOpenMenuId(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${BASE_URL}/api/v1/lab_report/download/${surveyId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) { showToast("Report not available or access denied", "error"); return; }

      const blob = await res.blob();
      window.open(window.URL.createObjectURL(blob), "_blank");
    } catch {
      showToast("Unable to view report", "error");
    }
  };

  const handleDownload = async (surveyId) => {
    setOpenMenuId(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${BASE_URL}/api/v1/lab_report/download/${surveyId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) { showToast("Report not available", "error"); return; }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Lab_Report_${surveyId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast("Unable to download report", "error");
    }
  };

  const handleUpload = async (surveyId) => {
    setOpenMenuId(null);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      try {
        // Try upload first; if already exists, fall back to update
        let res = await fetch(
          `${BASE_URL}/api/v1/lab_report/upload/${surveyId}`,
          { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData }
        );

        if (res.status === 409 || (await res.clone().json().catch(() => ({}))).message?.includes("already")) {
          res = await fetch(
            `${BASE_URL}/api/v1/lab_report/update/${surveyId}`,
            { method: "PATCH", headers: { Authorization: `Bearer ${token}` }, body: formData }
          );
        }

        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || "Upload failed");

        showToast("Report uploaded successfully!", "success");
        showToast("Report uploaded successfully!", "success");
        handleSearchSubmit();
      } catch (err) {
        showToast(err.message, "error");
      }
    };

    input.click();
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setReports([]);
  };

  if (loading) {
    return (
      <div className="labreports-loading">
        <div className="labreports-spinner"></div>
      </div>
    );
  }

  return (
    <div className="labreports-container">
      {/* HEADER */}
      <div className="labreports-header">
        <h2 className="labreports-title">Soil Test Reports</h2>
        <p className="labreports-subtitle">Admins can view and manage lab reports.</p>
      </div>

      {/* FILTER BAR */}
      <form className="labreports-filters" onSubmit={handleSearchSubmit}>
        <div className="labreports-search-wrapper">
          <input
            type="text"
            className="labreports-search-input"
            placeholder="Enter Numeric Survey ID (Form Number)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" style={{ display: 'none' }}>Search</button>
          <Search size={isMobile ? 16 : 18} className="labreports-search-icon" />
        </div>
        <button type="submit" className="labreports-clear-btn" style={{ background: '#6F1D8F', color: '#fff', border: 'none', marginLeft: '10px' }}>
          Fetch Record
        </button>
        {reports.length > 0 && (
          <button type="button" className="labreports-clear-btn" onClick={handleClearSearch} style={{ marginLeft: '10px' }}>
            Clear
          </button>
        )}
      </form>

      {/* TABLE */}
      <div className="labreports-table-container">
        <table className="labreports-table">
          <thead className="labreports-table-head">
            <tr>
              <th>Form Number</th>
              <th>Farmer Name</th>
              <th>Mobile</th>
              <th>Land Area</th>
              <th>Address</th>
              <th>Form Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody className="labreports-table-body">
            {reports.length > 0 ? (
              reports.map((r) => (
                <tr key={r.surveyId}>
                  <td>{r.formNumber || `FORM-${r.surveyId}`}</td>
                  <td>{r.farmerName || "N/A"}</td>
                  <td>{r.farmerMobile || "N/A"}</td>
                  <td>{r.landArea ?? "N/A"}</td>
                  <td>{r.address || r.village || "N/A"}</td>
                  <td>
                    <span className={`labreports-status ${r.status?.toLowerCase() || 'complete'}`}>
                      {r.status || "Complete"}
                    </span>
                  </td>
                  <td className="labreports-action-cell">
                    <div
                      className="labreports-dots-trigger"
                      onClick={() =>
                        setOpenMenuId(
                          openMenuId === r.surveyId ? null : r.surveyId
                        )
                      }
                    >
                      <MoreVertical size={isMobile ? 18 : 20} />
                    </div>

                    {openMenuId === r.surveyId && (
                      <div className="labreports-action-menu" ref={menuRef}>
                        <div
                          className="labreports-menu-item"
                          onClick={() => handleUpload(r.surveyId)}
                        >
                          <Upload size={16} className="labreports-menu-icon" /> Upload
                        </div>

                        <div
                          className="labreports-menu-item"
                          onClick={() => handleView(r.surveyId)}
                        >
                          <Eye size={16} className="labreports-menu-icon" /> View
                        </div>

                        <div
                          className="labreports-menu-item"
                          onClick={() => handleDownload(r.surveyId)}
                        >
                          <Download size={16} className="labreports-menu-icon" /> Download
                        </div>

                        {!hasReport(r) && (
                          <div className="labreports-menu-divider">
                            Report not uploaded yet
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    whiteSpace: "normal"
                  }}
                >
                  {reports.length > 0
                    ? "No details available."
                    : "Please enter a Survey ID and click Fetch Record to find or upload a lab report."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>



      {/* INFO FOOTER */}
      <div className="labreports-info-footer">
        {(isMobile || isTablet) && "Scroll horizontally to view all columns"}
      </div>
      
      {/* Toast Notifications */}
      <ToastComponent />
    </div>
  );
};

// Outer shell — waits for auth before mounting content
const LabReports = () => {
  const { loading: authLoading } = useAuth();
  if (authLoading) return <div className="loading"><div className="spinner"></div></div>;
  return <LabReportsContent />;
};

export default LabReports;