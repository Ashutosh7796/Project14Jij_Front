import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, MoreVertical, Eye, Trash2 } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { useCachedFetch } from "../../hooks/useCachedFetch";
import { invalidateTags } from "../../cache/requestCache";
import {
  CACHE_TAGS,
  SWR_FRESH_MS,
  SWR_STALE_MS,
  cacheKeyEmployeeFarmerSurveysPage,
} from "../../cache/cacheKeys";
import { BASE_URL } from "../../config/api";
import { authenticatedFetch, getToken, clearAuthData } from "../../utils/auth";
import "./Farmers.css";

/**
 * Path segment for GET/DELETE /employeeFarmerSurveys/{id} and /admin/farmers/:id.
 * Backend SurveyIdResolver accepts numeric surveyId, formNumber (e.g. 2026040016), or sur_* public id.
 * When surveyId is null, formNumber is used (DTO shape from admin list API).
 */
function resolveApiSurveyKey(survey) {
  if (!survey) return null;
  const sid = survey.surveyId ?? survey.id ?? survey.surveyID ?? survey.survey_id;
  if (sid != null && String(sid).trim() !== "") return String(sid).trim();
  const fn = survey.formNumber;
  if (fn != null && String(fn).trim() !== "") return String(fn).trim();
  const pub = survey.surveyPublicId ?? survey.survey_public_id;
  if (pub != null && String(pub).trim() !== "") return String(pub).trim();
  return null;
}

function rowDisplayIndex(page, size, rowIdx) {
  return page * size + rowIdx + 1;
}

function formatStatus(survey) {
  const raw = survey?.formStatus ?? survey?.status ?? "ACTIVE";
  const s = String(raw).replace(/_/g, " ").toLowerCase();
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : "Active";
}

const FarmerList = () => {
  const { showToast, ToastComponent } = useToast();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);

  // pagination (backend)
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const menuRef = useRef(null);

  /* ================= RESPONSIVE LOGIC ================= */
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  const fetchSurveysPage = useCallback(async () => {
    const token = getToken();
    if (!token) {
      showToast("Session expired. Please log in again.", "error");
      clearAuthData();
      navigate("/auth-login");
      throw new Error("Not authenticated");
    }

    const res = await authenticatedFetch(
      `${BASE_URL}/api/v1/employeeFarmerSurveys?page=${page}&size=${size}`
    );

    if (res.status === 401) {
      showToast("Your session has expired. Please log in again.", "error");
      clearAuthData();
      navigate("/auth-login");
      throw new Error("Unauthorized");
    }

    if (res.status === 403) {
      showToast("You don't have permission to view this page.", "error");
      return { content: [], totalPages: 1 };
    }

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "Failed to fetch surveys");
    }

    return {
      content: json.data?.content || [],
      totalPages: json.data?.totalPages || 1,
    };
  }, [page, size, navigate, showToast]);

  const listCacheOpts = useMemo(
    () => ({
      swr: true,
      freshMs: SWR_FRESH_MS,
      staleMs: SWR_STALE_MS,
      tags: [CACHE_TAGS.ADMIN_FARMER_SURVEYS],
    }),
    []
  );

  const { data: listPayload, loading } = useCachedFetch(
    cacheKeyEmployeeFarmerSurveysPage(page, size),
    fetchSurveysPage,
    listCacheOpts
  );

  useEffect(() => {
    setSurveys(listPayload?.content ?? []);
    if (listPayload?.totalPages != null) {
      setTotalPages(listPayload.totalPages);
    }
  }, [listPayload]);

  const filteredSurveys = useMemo(
    () =>
      surveys.filter((item) =>
        `${item.farmerName || ""} ${item.village || ""} ${item.farmerMobile || ""}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ),
    [surveys, searchTerm]
  );

  const openedSurvey = useMemo(() => {
    if (openMenuId == null) return null;
    return filteredSurveys.find((s) => resolveApiSurveyKey(s) === openMenuId) ?? null;
  }, [openMenuId, filteredSurveys]);

  const toggleActionMenu = useCallback((survey, anchorEl) => {
    const sid = resolveApiSurveyKey(survey);
    if (!sid) return;
    if (openMenuId === sid) {
      setOpenMenuId(null);
      setMenuPosition(null);
      return;
    }
    const r = anchorEl.getBoundingClientRect();
    const menuWidth = 168;
    const left = Math.min(
      Math.max(8, r.right - menuWidth),
      window.innerWidth - menuWidth - 8
    );
    setMenuPosition({ top: r.bottom + 4, left });
    setOpenMenuId(sid);
  }, [openMenuId]);

  /* ================= CLOSE MENU ON OUTSIDE CLICK / SCROLL ================= */
  useEffect(() => {
    if (openMenuId == null) return;

    const handlePointerDown = (e) => {
      if (menuRef.current?.contains(e.target)) return;
      if (e.target.closest?.(".fl-dots-trigger")) return;
      setOpenMenuId(null);
      setMenuPosition(null);
    };

    const handleScrollOrResize = () => {
      setOpenMenuId(null);
      setMenuPosition(null);
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [openMenuId]);

  useEffect(() => {
    if (openMenuId != null && !openedSurvey) {
      setOpenMenuId(null);
      setMenuPosition(null);
    }
  }, [openMenuId, openedSurvey]);

  useEffect(() => {
    setOpenMenuId(null);
    setMenuPosition(null);
  }, [searchTerm]);

  /* ================= DELETE HANDLER ================= */
  const handleDelete = async (apiKey) => {
    if (!window.confirm("Are you sure you want to delete this farmer?")) {
      return;
    }

    try {
      const enc = encodeURIComponent(apiKey);
      const res = await authenticatedFetch(`${BASE_URL}/api/v1/employeeFarmerSurveys/${enc}`, {
        method: "DELETE",
      });

      if (res.status === 401) {
        showToast("Session expired. Please log in again.", "error");
        clearAuthData();
        navigate("/auth-login");
        return;
      }

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || "Failed to delete farmer");
      }

      showToast("Farmer deleted successfully", "success");
      invalidateTags([CACHE_TAGS.ADMIN_FARMER_SURVEYS, CACHE_TAGS.ADMIN_RECENT_FARMERS]);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  /* ================= CLEAR SEARCH ================= */
  const handleClearSearch = () => {
    setSearchTerm("");
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* HEADER SECTION */}
      <div className="header-top">
        <h3 className="title">Farmer Registration List</h3>
        <div className="top-actions">
          {/* <Link to="/admin/farmers/add" className="add-btn">
            + Add Farmer
          </Link> */}
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="filters-bar" style={{ marginBottom: '40px' }}>
        <div className="search-box-wrapper">
          <input
            type="text"
            placeholder="Search by name, village or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={18} className="search-icon" />
        </div>
        {searchTerm && (
          <button
            onClick={handleClearSearch}
            style={{
              padding: "8px 16px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              background: "#fff",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* TABLE WITH SHADOW EFFECT */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Farmer Name</th>
              <th>Village</th>
              <th>Phone</th>
              <th>Status</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredSurveys.length > 0 ? (
              filteredSurveys.map((survey, idx) => {
                const apiKey = resolveApiSurveyKey(survey);
                const rowKey =
                  apiKey ??
                  `uid-${survey?.userId ?? "x"}-mob-${String(survey?.farmerMobile ?? "").slice(-4)}-${idx}`;
                const serial = rowDisplayIndex(page, size, idx);
                return (
                  <tr key={rowKey}>
                    <td className="fl-serial-cell">{serial}</td>
                    <td>{survey.farmerName || "N/A"}</td>
                    <td>{survey.village || "N/A"}</td>
                    <td>{survey.farmerMobile || "N/A"}</td>
                    <td>
                      <span className="status-active">{formatStatus(survey)}</span>
                    </td>

                    <td className="action-cell">
                      {apiKey ? (
                        <button
                          type="button"
                          className="fl-dots-trigger dots-trigger"
                          aria-expanded={openMenuId === apiKey}
                          aria-haspopup="true"
                          aria-label="Row actions"
                          onClick={(e) => toggleActionMenu(survey, e.currentTarget)}
                        >
                          <MoreVertical size={isMobile ? 18 : 20} />
                        </button>
                      ) : (
                        <span className="fl-action-placeholder" title="Missing survey id and form number">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="6"
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "#999",
                    fontSize: "14px",
                  }}
                >
                  {searchTerm
                    ? "No farmers found matching your search"
                    : "No farmers registered yet"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION WITH BOTTOM BORDER */}
      <div className="pagination-wrapper">
        <div className="pagination">
          <button
            className="page-btn"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            {isMobile ? "‹" : "Prev"}
          </button>

          <button className="page-btn active">
            Page {page + 1} of {totalPages}
          </button>

          <button
            className="page-btn"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {isMobile ? "›" : "Next"}
          </button>
        </div>
      </div>

      {/* INFO FOOTER */}
      <div
        style={{
          textAlign: isMobile ? "center" : "right",
          padding: "15px 0",
          fontSize: "13px",
          color: "#666",
        }}
      >
        Showing {filteredSurveys.length} of {surveys.length} farmers
      </div>

      {openedSurvey && menuPosition && (
        <div
          ref={menuRef}
          className="floating-menu fl-floating-menu"
          role="menu"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          <Link
            to={`/admin/farmers/${encodeURIComponent(resolveApiSurveyKey(openedSurvey) ?? "")}`}
            className="menu-item"
            role="menuitem"
            onClick={() => {
              setOpenMenuId(null);
              setMenuPosition(null);
            }}
          >
            <Eye size={16} className="purple-icon" /> View
          </Link>
          <button
            type="button"
            className="menu-item delete fl-menu-delete-btn"
            role="menuitem"
            onClick={() => {
              const id = resolveApiSurveyKey(openedSurvey);
              setOpenMenuId(null);
              setMenuPosition(null);
              if (id) handleDelete(id);
            }}
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      )}
      
      {/* Toast Notifications */}
      <ToastComponent />
    </div>
  );
};

export default FarmerList;