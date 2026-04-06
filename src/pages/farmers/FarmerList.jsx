import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, MoreVertical, Eye, Pencil, Trash2 } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { BASE_URL } from "../../config/api";
import "./Farmers.css";

const getToken = () => localStorage.getItem("token");

const FarmerList = () => {
  const { showToast, ToastComponent } = useToast();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

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
  const isTablet = windowWidth <= 1024 && windowWidth > 768;

  /* ================= FETCH DATA ================= */
  const fetchEmployeeFarmerSurveys = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/api/v1/employeeFarmerSurveys?page=${page}&size=${size}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to fetch surveys");
      }

      setSurveys(json.data?.content || []);
      setTotalPages(json.data?.totalPages || 1);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeFarmerSurveys();
  }, [page]);

  /* ================= CLOSE MENU ON OUTSIDE CLICK ================= */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ================= SEARCH FILTER ================= */
  const filteredSurveys = surveys.filter((item) =>
    `${item.farmerName || ""} ${item.village || ""} ${item.farmerMobile || ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  /* ================= DELETE HANDLER ================= */
  const handleDelete = async (surveyId) => {
    if (!window.confirm("Are you sure you want to delete this farmer?")) {
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/v1/employeeFarmerSurveys/${surveyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete");
      }

      showToast("Farmer deleted successfully", "success");
      fetchEmployeeFarmerSurveys();
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
              <th>User ID</th>
              <th>Farmer Name</th>
              <th>Village</th>
              <th>Phone</th>
              <th>Status</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredSurveys.length > 0 ? (
              filteredSurveys.map((survey) => (
                <tr key={survey.surveyId}>
                  <td>FMR_{survey.surveyId}</td>
                  <td>{survey.farmerName || "N/A"}</td>
                  <td>{survey.village || "N/A"}</td>
                  <td>{survey.farmerMobile || "N/A"}</td>
                  <td>
                    <span className="status-active">
                      {survey.status || "Active"}
                    </span>
                  </td>

                  <td className="action-cell">
                    <div
                      className="dots-trigger"
                      onClick={() =>
                        setOpenMenuId(
                          openMenuId === survey.surveyId ? null : survey.surveyId
                        )
                      }
                    >
                      <MoreVertical size={isMobile ? 18 : 20} />
                    </div>

                    {openMenuId === survey.surveyId && (
                      <div className="floating-menu" ref={menuRef}>
                        <Link
                          to={`/admin/farmers/${survey.surveyId}`}
                          className="menu-item"
                          onClick={() => setOpenMenuId(null)}
                        >
                          <Eye size={16} className="purple-icon" /> View
                        </Link>

                        {/* <Link
                          to={`/admin/farmers/edit/${survey.surveyId}`}
                          className="menu-item"
                          onClick={() => setOpenMenuId(null)}
                        >
                          <Pencil size={16} className="purple-icon" /> Edit
                        </Link> */}

                        <div
                          className="menu-item delete"
                          onClick={() => {
                            setOpenMenuId(null);
                            handleDelete(survey.surveyId);
                          }}
                        >
                          <Trash2 size={16} /> Delete
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))
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
      
      {/* Toast Notifications */}
      <ToastComponent />
    </div>
  );
};

export default FarmerList;