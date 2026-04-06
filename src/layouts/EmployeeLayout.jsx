import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { LayoutDashboard, History, User, LogOut, Menu, X } from "lucide-react";
import { FaWpforms } from "react-icons/fa";
import logo from "../assets/Jioji_logo.png";
import "../styles/EmployeeLayout.css";
import { useAuth } from "../context/AuthContext";

const EmployeeLayout = () => {
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const userBtnRef  = useRef(null);

  const { logout } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();

  const userEmail = localStorage.getItem("userEmail") || "Employee";
  const userName  = userEmail.split("@")[0];

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const toggleSidebar  = () => setSidebarOpen((p) => !p);
  const toggleDropdown = () => setDropdownOpen((p) => !p);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        userBtnRef.current  && !userBtnRef.current.contains(e.target)
      ) setDropdownOpen(false);
    };
    const onEsc = (e) => { if (e.key === "Escape") setDropdownOpen(false); };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const menuItems = [
    { path: "/employee/dashboard",           icon: LayoutDashboard, label: "Dashboard" },
    { path: "/employee/farmer-registration", icon: FaWpforms,       label: "Fill Farmer Survey Forms" },
    { path: "/employee/previous-history",    icon: History,         label: "History of My Farmers" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="emp-layout-wrapper">
      {/* ── SIDEBAR ── */}
      <aside className={`emp-sidebar ${sidebarOpen ? "emp-sidebar-open" : "emp-sidebar-closed"}`}>
        <div className="emp-sidebar-header">
          <div className="emp-logo-container">
            <img src={logo} alt="Jioji Green India" className="emp-logo" />
            {sidebarOpen && <span className="emp-logo-text">Employee Panel</span>}
          </div>
          <button className="emp-toggle-btn" onClick={toggleSidebar} aria-label="Toggle sidebar">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="emp-sidebar-nav">
          {menuItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`emp-nav-item ${isActive(path) ? "emp-nav-active" : ""}`}
            >
              <Icon size={20} />
              {sidebarOpen && <span>{label}</span>}
            </Link>
          ))}
        </nav>

        <div className="emp-sidebar-footer">
          <button className="emp-logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className={`emp-main-content ${sidebarOpen ? "emp-content-open" : "emp-content-closed"}`}>
        <header className="emp-top-header">
          <div className="emp-header-left">
            <button className="emp-mobile-menu-btn" onClick={toggleSidebar} aria-label="Open menu">
              <Menu size={24} />
            </button>
            <h1>Employee Portal</h1>
          </div>

          <div className="emp-header-right">
            <div className="emp-user-menu">
              <button ref={userBtnRef} className="emp-user-btn" onClick={toggleDropdown}>
                <User size={20} />
                <span>{userName}</span>
              </button>

              {dropdownOpen && (
                <div ref={dropdownRef} className="emp-dropdown-menu">
                  <div className="emp-dropdown-email">{userEmail}</div>
                  <button className="emp-dropdown-item emp-dropdown-logout" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="emp-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;
