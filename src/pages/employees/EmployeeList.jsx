import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MoreVertical, Eye, Power, PowerOff, Search } from "lucide-react";
import "./EmployeeList1.css";
import { BASE_URL } from "../../config/api";
import { getToken, clearAuthData } from "../../utils/auth";
import { useRoleBasePath } from "../../hooks/useRoleBasePath";

/* ===== INLINE NOTIFICATION ===== */
const Notification = ({ notifications, onClose }) => {
  if (!notifications.length) return null;
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 99999, display: "flex", flexDirection: "column", gap: 10, maxWidth: 380 }}>
      {notifications.map((n) => (
        <div key={n.id} style={{
          display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 16px",
          borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", fontSize: 13,
          background: n.type === "success" ? "#f0fdf4" : n.type === "error" ? "#fef2f2" : "#eff6ff",
          border: `1px solid ${n.type === "success" ? "#86efac" : n.type === "error" ? "#fca5a5" : "#93c5fd"}`,
          color: n.type === "success" ? "#166534" : n.type === "error" ? "#991b1b" : "#1e40af",
        }}>
          <span style={{ flexShrink: 0 }}>{n.type === "success" ? "✓" : n.type === "error" ? "✕" : "ℹ"}</span>
          <span style={{ flex: 1, lineHeight: 1.4 }}>{n.message}</span>
          <button onClick={() => onClose(n.id)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "inherit", opacity: 0.6, padding: 0 }}>×</button>
        </div>
      ))}
    </div>
  );
};

const DOC_TYPES = [
  { key: "PROFILE_PHOTO", label: "Profile Photo" },
  { key: "PAN_CARD",      label: "PAN Card" },
  { key: "AADHAAR_CARD",  label: "Aadhaar Card" },
  { key: "BANK_PASSBOOK", label: "Bank Passbook" },
];

const PAGE_SIZE = 10;

function mapServerEmployee(emp) {
  if (!emp || typeof emp !== "object") return null;
  return {
    userId: emp.userId,
    employeeCode: emp.employeeCode,
    fullName: emp.name ?? emp.fullName,
    userEmail: emp.email ?? emp.userEmail,
    userMobile: emp.mobile ?? emp.userMobile,
    status: emp.accountLocked ? "BLOCKED" : "ACTIVE",
    accountLocked: !!emp.accountLocked,
  };
}

const EmployeeList = () => {
  const navigate = useNavigate();
  const basePath = useRoleBasePath();
  const menuRef = useRef(null);

  const [employees, setEmployees]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [open, setOpen]                 = useState(null);
  const [page, setPage]                 = useState(0);
  const [searchQuery, setSearchQuery]   = useState("");
  const [windowWidth, setWindowWidth]   = useState(window.innerWidth);

  /* modal state */
  const [showModal, setShowModal]             = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loadingDetails, setLoadingDetails]   = useState(false);
  const [isEditing, setIsEditing]             = useState(false);
  const [editForm, setEditForm]               = useState({});

  /* document state */
  const [documents, setDocuments]       = useState([]);
  const [docsLoading, setDocsLoading]   = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [docPreviews, setDocPreviews]   = useState({}); // { [docType]: { base64, mimeType } }
  const [fullscreenDoc, setFullscreenDoc] = useState(null); // { label, base64, mimeType }

  /* notifications */
  const [notifs, setNotifs] = useState([]);
  const showNotif = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setNotifs(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifs(prev => prev.filter(n => n.id !== id)), 5000);
  };
  const closeNotif = (id) => setNotifs(prev => prev.filter(n => n.id !== id));

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const h = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  /* ===== FETCH EMPLOYEES (all pages merged; UI paginates client-side) ===== */
  const fetchEmployees = async () => {
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      if (!token) { navigate("/auth-login"); return; }

      const merged = [];
      const seenIds = new Set();
      let pageIdx = 0;
      let serverTotalPages = 1;
      const maxPages = 50;

      while (pageIdx < maxPages) {
        const params = new URLSearchParams();
        params.set("page", String(pageIdx));
        params.set("size", "200");
        const url = `${BASE_URL}/api/v1/employees/getUsers?${params.toString()}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (res.status === 401) { clearAuthData(); navigate("/auth-login"); return; }
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Failed to load employees");

        const data = json.data;
        if (data?.content != null) {
          let added = 0;
          for (const emp of data.content) {
            const id = emp?.userId;
            if (id != null && !seenIds.has(id)) {
              seenIds.add(id);
              merged.push(emp);
              added += 1;
            }
          }
          serverTotalPages = Number(data.totalPages) || 1;
          pageIdx += 1;
          if (pageIdx >= serverTotalPages || data.content.length === 0) break;
          if (added === 0) break;
        } else {
          const raw = Array.isArray(data) ? data : Array.isArray(json) ? json : [];
          for (const emp of raw) {
            const id = emp?.userId;
            if (id != null && !seenIds.has(id)) {
              seenIds.add(id);
              merged.push(emp);
            }
          }
          break;
        }
      }

      setEmployees(merged.map(mapServerEmployee).filter(Boolean));
      setPage(0);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(null); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const q = searchQuery.toLowerCase();
    return employees.filter(emp =>
      [emp.employeeCode, emp.fullName, emp.userEmail, emp.userMobile]
        .some(f => f?.toString().toLowerCase().includes(q))
    );
  }, [employees, searchQuery]);

  const computedTotalPages = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE));

  const paginatedEmployees = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredEmployees.slice(start, start + PAGE_SIZE);
  }, [filteredEmployees, page]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

  useEffect(() => {
    if (page > 0 && page >= computedTotalPages) {
      setPage(Math.max(0, computedTotalPages - 1));
    }
  }, [page, computedTotalPages]);

  /* ===== FETCH EMPLOYEE DETAILS ===== */
  const handleView = async (employee) => {
    setShowModal(true);
    setLoadingDetails(true);
    setIsEditing(false);
    setDocuments([]);
    setOpen(null);
    try {
      const token = getToken();
      const res = await fetch(`${BASE_URL}/api/v1/employees/user/${employee.userId}`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to fetch details");
      const data = json.data || json;
      setSelectedEmployee(data);
      setEditForm({
        userEmail: data.userEmail || "", userMobile: data.userMobile || "",
        companyName: data.companyName || "", address: data.address || "",
        permanentAddress: data.permanentAddress || "", city: data.city || "",
        district: data.district || "", state: data.state || "",
        accountNumber: data.accountNumber || "", ifscCode: data.ifscCode || "",
        pfNumber: data.pfNumber || "", insuranceNumber: data.insuranceNumber || "",
        panNumber: data.panNumber || "", vehicleNumber: data.vehicleNumber || "",
        description: data.description || "",
      });
      // fetch documents for this user
      fetchDocuments(employee.userId, token);
    } catch (err) {
      setSelectedEmployee(employee);
      showNotif("Could not load full details: " + err.message, "error");
    } finally {
      setLoadingDetails(false);
    }
  };

  /* ===== FETCH ALL DOCUMENTS FOR A SPECIFIC USER ===== */
  const fetchDocuments = async (userId, token) => {
    setDocsLoading(true);
    setDocPreviews({});
    try {
      const res = await fetch(`${BASE_URL}/api/v1/documents/user/${userId}/all`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to load documents");
      const json = await res.json();
      const docs = json.data || json;
      const docList = Array.isArray(docs) ? docs : [];
      setDocuments(docList);
      // Auto-fetch previews for all uploaded docs in parallel
      docList.forEach(doc => {
        if (doc.documentId) fetchDocPreview(doc.documentId, doc.documentType, token);
      });
    } catch (err) {
      showNotif("Could not load documents: " + err.message, "error");
      setDocuments([]);
    } finally {
      setDocsLoading(false);
    }
  };

  /* ===== FETCH PREVIEW FOR A SINGLE DOCUMENT ===== */
  const fetchDocPreview = async (documentId, docType, token) => {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/documents/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      const doc = json.data || json;
      if (doc.fileData) {
        setDocPreviews(prev => ({
          ...prev,
          [docType]: { base64: doc.fileData, mimeType: doc.mimeType || "image/jpeg" },
        }));
      }
    } catch { /* silently skip */ }
  };

  /* ===== UPLOAD / REPLACE DOCUMENT ===== */
  const handleDocUpload = async (docType, file) => {
    if (!file || !selectedEmployee) return;
    const token = getToken();
    setUploadingDoc(docType);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("documentType", docType);
      fd.append("UserId", String(selectedEmployee.userId));
      fd.append("description", docType);

      // Use replace endpoint so it updates if already exists
      const res = await fetch(`${BASE_URL}/api/v1/documents/uploadByUser`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Upload failed");
      showNotif(`${docType.replace(/_/g, " ")} uploaded successfully`, "success");
      fetchDocuments(selectedEmployee.userId, getToken());
    } catch (err) {
      showNotif("Upload failed: " + err.message, "error");
    } finally {
      setUploadingDoc(null);
    }
  };

  /* ===== SAVE EMPLOYEE EDITS ===== */
  const handleSaveEmployee = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${BASE_URL}/api/v1/employees/user/${selectedEmployee.userId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update");
      showNotif(json.message || "Employee updated successfully", "success");
      fetchEmployees();
      setIsEditing(false);
      setSelectedEmployee(prev => ({ ...prev, ...editForm }));
    } catch (err) {
      showNotif("Error: " + err.message, "error");
    }
  };

  /* ===== DEACTIVATE / ACTIVATE ===== */
  const handleDeactivate = async (employee) => {
    const isLocked = employee.accountLocked || employee.status === "BLOCKED";
    if (!window.confirm(`Are you sure you want to ${isLocked ? "activate" : "deactivate"} this employee?`)) return;
    try {
      const token = getToken();
      const res = await fetch(
        `${BASE_URL}/api/v1/employees/user/${employee.userId}/account-lock?accountLocked=${!isLocked}`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      const json = await res.json();
      if (res.ok) { showNotif(json.message || "Status updated", "success"); fetchEmployees(); setOpen(null); }
      else throw new Error(json.message || "Failed");
    } catch (err) { showNotif("Error: " + err.message, "error"); }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <>
      <Notification notifications={notifs} onClose={closeNotif} />

      <div className="page" style={{ padding: isMobile ? "10px" : "20px" }}>
        {/* ===== HEADER ===== */}
        <div className="top" style={{ flexDirection: isMobile ? "column" : "row", gap: 15 }}>
          <h3>Employee Management</h3>
          <div className="top-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate(`${basePath}/attendance`)}
            >
              Attendance Management
            </button>
            <Link to={`${basePath}/employees/add`} className="add-btn">+ Add Employee</Link>
          </div>
        </div>

        {/* ===== FILTERS ===== */}
        <div className="filters">
          <div className="search">
            <input placeholder="Search by name, email, ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <Search size={16} />
          </div>
          <button className="clear" onClick={() => { setSearchQuery(""); setPage(0); }}>Clear</button>
        </div>

        {error && <p style={{ color: "red", padding: "10px" }}>{error}</p>}

        {/* ===== TABLE ===== */}
        <div className="table-box">
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" /></th>
                <th>Emp ID</th><th>Name</th><th>Email</th><th>Mobile</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmployees.length ? paginatedEmployees.map((e, i) => (
                <tr key={e.userId}>
                  <td><input type="checkbox" /></td>
                  <td>{e.employeeCode || `U-${e.userId}`}</td>
                  <td>{e.fullName || e.userEmail?.split("@")[0] || "N/A"}</td>
                  <td>{e.userEmail || "N/A"}</td>
                  <td>{e.userMobile || "N/A"}</td>
                  <td><span className={e.accountLocked || e.status === "BLOCKED" ? "out" : "active"}>
                    {e.accountLocked ? "BLOCKED" : (e.status || "ACTIVE")}
                  </span></td>
                  <td className="action">
                    <div ref={open === i ? menuRef : null}>
                      <MoreVertical size={16} onClick={() => setOpen(open === i ? null : i)} style={{ cursor: "pointer" }} />
                      {open === i && (
                        <div className="menu" style={{ right: 0 }}>
                          <span onClick={() => handleView(e)}><Eye size={14} /> View</span>
                          {(e.accountLocked || e.status === "BLOCKED") ? (
                            <span onClick={() => handleDeactivate(e)} style={{ color: "#28a745" }}><Power size={14} /> Activate</span>
                          ) : (
                            <span className="del" onClick={() => handleDeactivate(e)}><PowerOff size={14} /> Deactivate</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7" className="empty">No employees found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ===== PAGINATION ===== */}
        <div className="pagination">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Prev</button>
          <button className="active">{page + 1}</button>
          <button onClick={() => setPage(p => p + 1)} disabled={page + 1 >= computedTotalPages}>Next</button>
        </div>
      </div>

      {/* ===== EMPLOYEE DETAIL MODAL ===== */}
      {showModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setDocPreviews({}); }}>
          <div className="modal-details" style={{ maxWidth: 750, width: "95%", maxHeight: "95vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="modal-header">
              <h4>EMPLOYEE DETAILS</h4>
              <span className="close-icon" onClick={() => { setShowModal(false); setDocPreviews({}); }}>×</span>
            </div>

            <div className="modal-body">
              {loadingDetails ? (
                <div style={{ textAlign: "center", padding: 30 }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
              ) : (
                <>
                  {/* Profile row */}
                  <div className="profile-section">
                    <div className="profile-image">
                      <div style={{ width: 80, height: 80, background: "#e5e7eb", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 600, color: "#6b7280" }}>
                        {(selectedEmployee.fullName || selectedEmployee.userEmail || "?").charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="profile-info">
                      <p className="emp-id">{selectedEmployee.fullName || selectedEmployee.userEmail}</p>
                      <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>ID: {selectedEmployee.employeeCode || selectedEmployee.userId}</p>
                      <div className="action-buttons">
                        {!isEditing ? (
                          <>
                            <button className="btn-edit" onClick={() => setIsEditing(true)}>Edit Details</button>
                            <button className="btn-block" onClick={() => handleDeactivate(selectedEmployee)}>
                              {selectedEmployee.accountLocked || selectedEmployee.status === "BLOCKED" ? "Activate" : "Deactivate"}
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="btn-edit" style={{ background: "#20b15a", color: "#fff", border: "none" }} onClick={handleSaveEmployee}>Save</button>
                            <button className="btn-block" style={{ background: "#6c757d", color: "#fff", border: "none" }} onClick={() => setIsEditing(false)}>Cancel</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="details-grid">
                    {[
                      { label: "Full Name",         key: "fullName",         readOnly: true },
                      { label: "Email ID",           key: "userEmail" },
                      { label: "Phone Number",       key: "userMobile" },
                      { label: "User Type",          key: "role",             readOnly: true },
                      { label: "Company Name",       key: "companyName" },
                      { label: "Address",            key: "address" },
                      { label: "City",               key: "city" },
                      { label: "Permanent Address",  key: "permanentAddress" },
                      { label: "District",           key: "district" },
                      { label: "State",              key: "state" },
                      { label: "PF Number",          key: "pfNumber" },
                      { label: "Insurance Number",   key: "insuranceNumber" },
                      { label: "Account Number",     key: "accountNumber" },
                      { label: "IFSC Code",          key: "ifscCode" },
                      { label: "PAN Number",         key: "panNumber" },
                      { label: "Vehicle Number",     key: "vehicleNumber" },
                    ].map(f => (
                      <div className="detail-item" key={f.key}>
                        <label>{f.label}</label>
                        {isEditing && !f.readOnly ? (
                          <input
                            value={editForm[f.key] || ""}
                            onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                            style={{ padding: "5px 8px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13 }}
                          />
                        ) : (
                          <p>{selectedEmployee[f.key] || "—"}</p>
                        )}
                      </div>
                    ))}
                    <div className="detail-item" style={{ gridColumn: "span 3" }}>
                      <label>Description</label>
                      {isEditing ? (
                        <input value={editForm.description || ""} onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                          style={{ padding: "5px 8px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13, width: "100%" }} />
                      ) : (
                        <p>{selectedEmployee.description || "—"}</p>
                      )}
                    </div>
                  </div>

                  {/* ===== DOCUMENTS SECTION ===== */}
                  <div style={{ marginTop: 24, borderTop: "1px solid #e5e7eb", paddingTop: 20 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: "#1f2937" }}>Documents</p>
                    {docsLoading ? (
                      <p style={{ fontSize: 13, color: "#6b7280" }}>Loading documents...</p>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12 }}>
                        {DOC_TYPES.map(({ key, label }) => {
                          const existing = documents.find(d => d.documentType === key);
                          const preview = docPreviews[key];
                          const isPdf = preview?.mimeType === "application/pdf";
                          return (
                            <div key={key} style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", background: existing ? "#f0fdf4" : "#fafafa" }}>
                              {/* Preview area */}
                              <div style={{ width: "100%", height: 110, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                {preview ? (
                                  isPdf ? (
                                    <iframe
                                      src={`data:application/pdf;base64,${preview.base64}`}
                                      title={label}
                                      style={{ width: "100%", height: 110, border: "none", pointerEvents: "none" }}
                                    />
                                  ) : (
                                    <img
                                      src={`data:${preview.mimeType};base64,${preview.base64}`}
                                      alt={label}
                                      style={{ width: "100%", height: 110, objectFit: "cover" }}
                                    />
                                  )
                                ) : (
                                  <span style={{ fontSize: 11, color: "#9ca3af" }}>{existing ? "Loading..." : "No file"}</span>
                                )}
                              </div>
                              {/* Info + actions */}
                              <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
                                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#374151" }}>{label}</p>
                                <p style={{ margin: 0, fontSize: 10, color: existing ? "#16a34a" : "#9ca3af" }}>
                                  {existing ? "✓ Uploaded" : "Not uploaded"}
                                </p>
                                {/* View button — only if preview loaded */}
                                {preview && (
                                  <button
                                    onClick={() => setFullscreenDoc({ label, ...preview })}
                                    style={{ padding: "4px 8px", fontSize: 11, background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: 4, cursor: "pointer", color: "#1d4ed8" }}>
                                    View Full
                                  </button>
                                )}
                                {/* Upload/Replace only visible in edit mode */}
                                {isEditing && (
                                  <label style={{ padding: "4px 8px", fontSize: 11, background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer", textAlign: "center", color: "#374151" }}>
                                    {uploadingDoc === key ? "Uploading..." : existing ? "Replace" : "Upload"}
                                    <input type="file" hidden accept="image/*,application/pdf"
                                      onChange={e => { if (e.target.files[0]) handleDocUpload(key, e.target.files[0]); e.target.value = ""; }}
                                      disabled={uploadingDoc === key}
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== FULLSCREEN DOCUMENT VIEWER ===== */}
      {fullscreenDoc && (
        <div
          onClick={() => setFullscreenDoc(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 99999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {/* Header */}
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 900, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", color: "#fff" }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{fullscreenDoc.label}</span>
            <button
              onClick={() => setFullscreenDoc(null)}
              style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 22, width: 36, height: 36, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ×
            </button>
          </div>
          {/* Content */}
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 900, maxHeight: "85vh", overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {fullscreenDoc.mimeType?.startsWith("image") ? (
              <img
                src={`data:${fullscreenDoc.mimeType};base64,${fullscreenDoc.base64}`}
                alt={fullscreenDoc.label}
                style={{ maxWidth: "100%", maxHeight: "85vh", objectFit: "contain", borderRadius: 4 }}
              />
            ) : (
              <iframe
                src={`data:application/pdf;base64,${fullscreenDoc.base64}`}
                title={fullscreenDoc.label}
                style={{ width: "min(900px, 95vw)", height: "80vh", border: "none", borderRadius: 4 }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default EmployeeList;
