import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { clearAuthData } from "../utils/auth";
import { LayoutDashboard, User, LogOut, Menu, X } from "lucide-react";
import { FaFlask } from "react-icons/fa";
import logo from "../assets/Jioji_logo.png";
import "../styles/LabLayout.css";
import { useIsMobileDashboard } from "../hooks/useMediaQuery";

const LabLayout = () => {
  const isMobile = useIsMobileDashboard(768);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const userBtnRef = useRef(null);

  const userEmail = localStorage.getItem("userEmail") || "Lab User";
  const userName = userEmail.split("@")[0];

  useEffect(() => {
    if (!isMobile) setMobileDrawerOpen(false);
  }, [isMobile]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        userBtnRef.current &&
        !userBtnRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleLogout = () => {
    setMobileDrawerOpen(false);
    clearAuthData();
    navigate("/");
  };

  const toggleSidebar = () => {
    if (isMobile) setMobileDrawerOpen((p) => !p);
    else setSidebarOpen((p) => !p);
  };

  const closeMobileDrawer = () => setMobileDrawerOpen(false);
  const toggleDropdown = () => setDropdownOpen((p) => !p);

  const menuItems = [
    { path: "/lab/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/lab/report", icon: FaFlask, label: "Lab Reports" },
  ];

  const isActive = (path) => location.pathname === path;

  const sidebarClass = [
    "lab-sidebar",
    !isMobile && (sidebarOpen ? "lab-sidebar-open" : "lab-sidebar-closed"),
    isMobile && "lab-sidebar-mobile",
    isMobile && mobileDrawerOpen && "lab-mobile-open",
  ]
    .filter(Boolean)
    .join(" ");

  const mainClass = [
    "lab-main-content",
    !isMobile ? (sidebarOpen ? "lab-content-open" : "lab-content-closed") : "lab-main-content--mobile",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="lab-layout-wrapper">
      {isMobile && mobileDrawerOpen && (
        <div className="lab-sidebar-backdrop" onClick={closeMobileDrawer} aria-hidden="true" />
      )}

      <aside className={sidebarClass}>
        <div className="lab-sidebar-header">
          <div className="lab-logo-container">
            <img src={logo} alt="Logo" className="lab-logo" />
            {(sidebarOpen || isMobile) && <span className="lab-logo-text">Lab Panel</span>}
          </div>

          <button type="button" className="lab-toggle-btn" onClick={toggleSidebar} aria-label="Toggle menu">
            {(isMobile ? mobileDrawerOpen : sidebarOpen) ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="lab-sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`lab-nav-item ${isActive(item.path) ? "lab-nav-active" : ""}`}
                onClick={() => isMobile && closeMobileDrawer()}
              >
                <Icon size={20} />
                {(sidebarOpen || isMobile) && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="lab-sidebar-footer">
          <button
            type="button"
            className="lab-logout-btn"
            onClick={() => {
              closeMobileDrawer();
              handleLogout();
            }}
          >
            <LogOut size={20} />
            {(sidebarOpen || isMobile) && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className={mainClass}>
        <header className="lab-top-header">
          <div className="lab-header-left">
            <button
              type="button"
              className={`lab-mobile-menu-btn ${isMobile ? "lab-mobile-menu-btn--visible" : ""}`}
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            <h1>Lab Portal</h1>
          </div>

          <div className="lab-header-right">
            <div className="lab-user-menu">
              <button ref={userBtnRef} type="button" className="lab-user-btn" onClick={toggleDropdown}>
                <User size={20} />
                <span>{userName}</span>
              </button>

              {dropdownOpen && (
                <div ref={dropdownRef} className="lab-dropdown-menu">
                  <div className="lab-dropdown-email">{userEmail}</div>
                  <button type="button" className="lab-dropdown-logout" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="lab-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LabLayout;
