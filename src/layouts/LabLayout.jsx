import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  History,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { FaFlask } from "react-icons/fa";
import logo from "../assets/Jioji_logo.png";
import "../styles/LabLayout.css";

const LabLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const userEmail = localStorage.getItem("userEmail") || "Lab User";
  const userName = userEmail.split("@")[0];

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    navigate("/");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  // Close sidebar when clicking on a link (mobile only)
  const handleNavClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const menuItems = [
    {
      path: "/lab/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      path: "/lab/report",
      icon: FaFlask,
      label: "Lab Reports",
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="lab-layout-wrapper">
      {/* ================= SIDEBAR ================= */}
      <aside
        className={`lab-sidebar ${
          sidebarOpen ? "lab-sidebar-open" : "lab-sidebar-closed"
        }`}
      >
        <div className="lab-sidebar-header">
          <div className="lab-logo-container">
            <img src={logo} alt="Logo" className="lab-logo" />
            {sidebarOpen && (
              <span className="lab-logo-text">Lab Panel</span>
            )}
          </div>

          <button className="lab-toggle-btn" onClick={toggleSidebar}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="lab-sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`lab-nav-item ${
                  isActive(item.path) ? "lab-nav-active" : ""
                }`}
                onClick={handleNavClick}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="lab-sidebar-footer">
          <button className="lab-logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {isMobile && sidebarOpen && (
        <div 
          className="lab-sidebar-backdrop" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ================= MAIN CONTENT ================= */}
      <div
        className={`lab-main-content ${
          sidebarOpen ? "lab-content-open" : "lab-content-closed"
        }`}
      >
        <header className="lab-top-header">
          <div className="lab-header-left">
            {isMobile && (
              <button className="lab-mobile-menu-btn" onClick={toggleSidebar}>
                <Menu size={24} />
              </button>
            )}
            <h1>Lab Portal</h1>
          </div>

          <div className="lab-header-right">
            <div className="lab-user-menu">
              <button className="lab-user-btn" onClick={toggleDropdown}>
                <User size={20} />
                <span>{userName}</span>
              </button>

              {dropdownOpen && (
                <>
                  <div className="lab-dropdown-menu">
                    <div className="lab-dropdown-email">
                      {userEmail}
                    </div>

                    <button
                      className="lab-dropdown-logout"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                  {/* Click outside to close dropdown */}
                  <div 
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 999
                    }} 
                    onClick={() => setDropdownOpen(false)}
                  />
                </>
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