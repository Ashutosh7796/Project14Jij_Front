import React, { useState, useEffect, useCallback } from "react";
import { Search, Eye, ArrowLeft, Users, ChevronLeft, ChevronRight, RefreshCw, AlertCircle, ClipboardList } from "lucide-react";
import { BASE_URL } from "../../config/api";
import { authenticatedFetch } from "../../utils/auth";
import "./FarmerRegistrationList.css";

/* ─── Inline Toast ─────────────────────────────────────── */
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`frl-toast frl-toast--${type}`}>
      <span>{message}</span>
      <button onClick={onClose} className="frl-toast__close">×</button>
    </div>
  );
};

/* ─── Status Badge ─────────────────────────────────────── */
const StatusBadge = ({ locked }) => (
  <span className={`frl-badge ${locked ? "frl-badge--blocked" : "frl-badge--active"}`}>
    {locked ? "Blocked" : "Active"}
  </span>
);

/* ─── Survey Status Badge ──────────────────────────────── */
const SurveyBadge = ({ status }) => {
  const s = (status || "").toUpperCase();
  const cls = s === "ACTIVE" ? "frl-badge--active" : s === "PENDING" ? "frl-badge--pending" : "frl-badge--blocked";
  return <span className={`frl-badge ${cls}`}>{status || "—"}</span>;
};

/* ════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                          */
/* ════════════════════════════════════════════════════════ */
const FarmerRegistrationList = () => {
  /* ── View state: "employees" | "farmers" ── */
  const [view, setView] = useState("employees");
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  /* ── Employees state ── */
  const [employees, setEmployees] = useState([]);
  const [empLoading, setEmpLoading] = useState(true);
  const [empError, setEmpError] = useState("");
  const [empPage, setEmpPage] = useState(0);
  const [empTotalPages, setEmpTotalPages] = useState(1);
  const [empSearch, setEmpSearch] = useState("");
  const EMP_PAGE_SIZE = 10;

  /* ── Farmers state ── */
  const [farmers, setFarmers] = useState([]);
  const [farmerLoading, setFarmerLoading] = useState(false);
  const [farmerError, setFarmerError] = useState("");
  const [farmerPage, setFarmerPage] = useState(0);
  const [farmerTotalPages, setFarmerTotalPages] = useState(1);
  const [farmerTotalElements, setFarmerTotalElements] = useState(0);
  const [farmerSearch, setFarmerSearch] = useState("");
  const FARMER_PAGE_SIZE = 10;

  /* ── Toast ── */
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "error") => setToast({ message, type }), []);

  /* ════════ FETCH EMPLOYEES ════════ */
  const fetchEmployees = useCallback(async () => {
    setEmpLoading(true);
    setEmpError("");
    try {
      const res = await authenticatedFetch(
        `${BASE_URL}/api/v1/employees/getAll/surv?page=${empPage}&size=${EMP_PAGE_SIZE}`
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || `Error ${res.status}`);
      }
      const json = await res.json();
      const data = json.data ?? json;

      if (data?.content && Array.isArray(data.content)) {
        setEmployees(data.content);
        setEmpTotalPages(data.totalPages ?? 1);
      } else if (Array.isArray(data)) {
        setEmployees(data);
        setEmpTotalPages(1);
      } else {
        setEmployees([]);
        setEmpTotalPages(1);
      }
    } catch (err) {
      setEmpError(err.message);
      showToast(err.message);
    } finally {
      setEmpLoading(false);
    }
  }, [empPage, showToast]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  /* ════════ FETCH FARMERS FOR AN EMPLOYEE ════════ */
  const fetchFarmers = useCallback(async (userId, page = 0) => {
    setFarmerLoading(true);
    setFarmerError("");
    try {
      const res = await authenticatedFetch(
        `${BASE_URL}/api/v1/employeeFarmerSurveys/user/${userId}?page=${page}&size=${FARMER_PAGE_SIZE}`
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || `Error ${res.status}`);
      }
      const json = await res.json();
      const data = json.data ?? json;

      if (data?.content && Array.isArray(data.content)) {
        setFarmers(data.content);
        setFarmerTotalPages(data.totalPages ?? 1);
        setFarmerTotalElements(data.totalElements ?? data.content.length);
      } else if (Array.isArray(data)) {
        setFarmers(data);
        setFarmerTotalPages(1);
        setFarmerTotalElements(data.length);
      } else {
        setFarmers([]);
        setFarmerTotalPages(1);
        setFarmerTotalElements(0);
      }
    } catch (err) {
      setFarmerError(err.message);
      showToast(err.message);
    } finally {
      setFarmerLoading(false);
    }
  }, [showToast]);

  /* ── When farmerPage changes while viewing an employee ── */
  useEffect(() => {
    if (view === "farmers" && selectedEmployee) {
      fetchFarmers(selectedEmployee.userId ?? selectedEmployee.id, farmerPage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmerPage]);

  /* ════════ HANDLERS ════════ */
  const handleViewEmployee = (emp) => {
    setSelectedEmployee(emp);
    setFarmerPage(0);
    setFarmers([]);
    setFarmerError("");
    setFarmerSearch("");
    setView("farmers");
    fetchFarmers(emp.userId ?? emp.id, 0);
  };

  const handleBack = () => {
    setView("employees");
    setSelectedEmployee(null);
    setFarmers([]);
    setFarmerError("");
  };

  /* ── Client-side search filter ── */
  const filteredEmployees = employees.filter((emp) => {
    if (!empSearch.trim()) return true;
    const q = empSearch.toLowerCase();
    return [emp.employeeCode, emp.name, emp.email, emp.mobile]
      .some((f) => f?.toString().toLowerCase().includes(q));
  });

  const filteredFarmers = farmers.filter((f) => {
    if (!farmerSearch.trim()) return true;
    const q = farmerSearch.toLowerCase();
    return [f.farmerName, f.farmerMobile, f.village, f.district, f.formNumber]
      .some((v) => v?.toString().toLowerCase().includes(q));
  });

  /* ════════════════════════════════════════════════════════
     RENDER: FARMERS VIEW
  ════════════════════════════════════════════════════════ */
  if (view === "farmers") {
    const empName = selectedEmployee?.name || selectedEmployee?.email || "Employee";
    const empCode = selectedEmployee?.employeeCode || `ID-${selectedEmployee?.userId}`;

    return (
      <div className="frl-page">
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}

        {/* Header */}
        <div className="frl-header">
          <button className="frl-back-btn" onClick={handleBack}>
            <ArrowLeft size={18} />
            <span>Back to Employees</span>
          </button>
          <div className="frl-header-info">
            <h2 className="frl-title">
              <ClipboardList size={22} />
              Farmer Registrations
            </h2>
            <p className="frl-subtitle">
              {empName} &nbsp;·&nbsp; {empCode}
              {farmerTotalElements > 0 && (
                <span className="frl-count-chip">{farmerTotalElements} farmers</span>
              )}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="frl-toolbar">
          <div className="frl-search-box">
            <Search size={15} className="frl-search-icon" />
            <input
              placeholder="Search by farmer name, mobile, village…"
              value={farmerSearch}
              onChange={(e) => setFarmerSearch(e.target.value)}
              className="frl-search-input"
            />
          </div>
        </div>

        {/* Content */}
        {farmerLoading ? (
          <div className="frl-state-center">
            <div className="frl-spinner" />
            <p>Loading farmer records…</p>
          </div>
        ) : farmerError ? (
          <div className="frl-state-center frl-state--error">
            <AlertCircle size={40} />
            <p>{farmerError}</p>
            <button
              className="frl-retry-btn"
              onClick={() => fetchFarmers(selectedEmployee.userId ?? selectedEmployee.id, farmerPage)}
            >
              <RefreshCw size={15} /> Retry
            </button>
          </div>
        ) : filteredFarmers.length === 0 ? (
          <div className="frl-state-center">
            <Users size={48} style={{ color: "#d1d5db" }} />
            <p style={{ color: "#9ca3af" }}>
              {farmerSearch ? "No farmers match your search." : "This employee has no recorded farmer registrations."}
            </p>
          </div>
        ) : (
          <>
            <div className="frl-table-wrapper">
              <table className="frl-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Form No.</th>
                    <th>Farmer Name</th>
                    <th>Mobile</th>
                    <th>Village</th>
                    <th>Taluka</th>
                    <th>District</th>
                    <th>Farming Type</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFarmers.map((f, idx) => (
                    <tr key={f.surveyId ?? idx}>
                      <td>{farmerPage * FARMER_PAGE_SIZE + idx + 1}</td>
                      <td>{f.formNumber || `FORM-${f.surveyId}`}</td>
                      <td className="frl-name-cell">{f.farmerName || "—"}</td>
                      <td>{f.farmerMobile || "—"}</td>
                      <td>{f.village || "—"}</td>
                      <td>{f.taluka || "—"}</td>
                      <td>{f.district || "—"}</td>
                      <td>{f.farmInformation || f.farmingType || "—"}</td>
                      <td><SurveyBadge status={f.formStatus} /></td>
                      <td>
                        {f.createdAt
                          ? new Date(f.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit", month: "short", year: "numeric",
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {farmerTotalPages > 1 && (
              <div className="frl-pagination">
                <button
                  className="frl-page-btn"
                  disabled={farmerPage === 0}
                  onClick={() => setFarmerPage((p) => p - 1)}
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                {Array.from({ length: Math.min(farmerTotalPages, 5) }, (_, i) => {
                  const start = Math.max(0, farmerPage - 2);
                  const pg = start + i;
                  if (pg >= farmerTotalPages) return null;
                  return (
                    <button
                      key={pg}
                      className={`frl-page-btn ${farmerPage === pg ? "frl-page-btn--active" : ""}`}
                      onClick={() => setFarmerPage(pg)}
                    >
                      {pg + 1}
                    </button>
                  );
                })}
                <button
                  className="frl-page-btn"
                  disabled={farmerPage >= farmerTotalPages - 1}
                  onClick={() => setFarmerPage((p) => p + 1)}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════
     RENDER: EMPLOYEES VIEW (default)
  ════════════════════════════════════════════════════════ */
  return (
    <div className="frl-page">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Header */}
      <div className="frl-header">
        <div className="frl-header-info">
          <h2 className="frl-title">
            <Users size={22} />
            Farmer Registration List
          </h2>
          <p className="frl-subtitle">View farmers registered by each employee</p>
        </div>
        <button className="frl-refresh-btn" onClick={fetchEmployees} title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="frl-toolbar">
        <div className="frl-search-box">
          <Search size={15} className="frl-search-icon" />
          <input
            placeholder="Search by name, email, code, mobile…"
            value={empSearch}
            onChange={(e) => setEmpSearch(e.target.value)}
            className="frl-search-input"
          />
        </div>
      </div>

      {/* Content */}
      {empLoading ? (
        <div className="frl-state-center">
          <div className="frl-spinner" />
          <p>Loading employees…</p>
        </div>
      ) : empError ? (
        <div className="frl-state-center frl-state--error">
          <AlertCircle size={40} />
          <p>{empError}</p>
          <button className="frl-retry-btn" onClick={fetchEmployees}>
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="frl-state-center">
          <Users size={48} style={{ color: "#d1d5db" }} />
          <p style={{ color: "#9ca3af" }}>
            {empSearch ? "No employees match your search." : "No employees found."}
          </p>
        </div>
      ) : (
        <>
          <div className="frl-table-wrapper">
            <table className="frl-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Emp Code</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp, idx) => (
                  <tr key={emp.userId ?? idx}>
                    <td>{empPage * EMP_PAGE_SIZE + idx + 1}</td>
                    <td><span className="frl-code-chip">{emp.employeeCode || `U-${emp.userId}`}</span></td>
                    <td className="frl-name-cell">{emp.name || emp.fullName || emp.firstName ? `${emp.firstName || ""} ${emp.lastName || ""}`.trim() : "—"}</td>
                    <td>{emp.email || "—"}</td>
                    <td>{emp.mobile || emp.mobileNumber || "—"}</td>
                    <td><StatusBadge locked={emp.accountLocked} /></td>
                    <td>
                      <button
                        className="frl-view-btn"
                        onClick={() => handleViewEmployee(emp)}
                        title={`View farmers registered by ${emp.name || emp.email}`}
                      >
                        <Eye size={15} />
                        View Farmers
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {empTotalPages > 1 && (
            <div className="frl-pagination">
              <button
                className="frl-page-btn"
                disabled={empPage === 0}
                onClick={() => setEmpPage((p) => p - 1)}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              {Array.from({ length: Math.min(empTotalPages, 5) }, (_, i) => {
                const start = Math.max(0, empPage - 2);
                const pg = start + i;
                if (pg >= empTotalPages) return null;
                return (
                  <button
                    key={pg}
                    className={`frl-page-btn ${empPage === pg ? "frl-page-btn--active" : ""}`}
                    onClick={() => setEmpPage(pg)}
                  >
                    {pg + 1}
                  </button>
                );
              })}
              <button
                className="frl-page-btn"
                disabled={empPage >= empTotalPages - 1}
                onClick={() => setEmpPage((p) => p + 1)}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FarmerRegistrationList;
