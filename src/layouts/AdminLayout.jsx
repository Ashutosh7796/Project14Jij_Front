import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/Jioji_logo.png';
import '../styles/AdminLayout.css';
import { useIsMobileDashboard } from '../hooks/useMediaQuery';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  MessageSquare,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Calendar,
  ClipboardList,
  Inbox,
  Menu,
} from 'lucide-react';

const ADMIN_MENU = [
  { path: '/admin/dashboard',                label: 'Dashboard',                 icon: <LayoutDashboard size={20} /> },
  { path: '/admin/employees',                label: 'Employee management',      icon: <Users size={20} /> },
  { path: '/admin/products',                 label: 'Product & category',       icon: <Package size={20} /> },
  { path: '/admin/orders',                   label: 'Order tracking',           icon: <ShoppingCart size={20} /> },
  { path: '/admin/farmers',                  label: 'Farmer Registration',      icon: <MessageSquare size={20} /> },
  { path: '/admin/farmer-registration-list', label: 'Farmer Reg. List',         icon: <ClipboardList size={20} /> },
  { path: '/admin/lab-reports',              label: 'Lab Test Report',          icon: <FileText size={20} /> },
];

const MANAGER_MENU = [
  { path: '/manager/dashboard',       label: 'Dashboard',            icon: <LayoutDashboard size={20} /> },
  { path: '/manager/employees',       label: 'Employee management',  icon: <Users size={20} /> },
  { path: '/manager/farmer-registration-list', label: 'Farmer Reg. List', icon: <ClipboardList size={20} /> },
  { path: '/manager/attendance',      label: 'Attendance',           icon: <Calendar size={20} /> },
  { path: '/manager/leave-management', label: 'Leave requests',      icon: <Inbox size={20} /> },
];

function resolvePageTitle(pathname) {
  if (pathname.includes('/leave-management')) return 'Leave requests';
  if (pathname.includes('/attendance/employee')) return 'Employee attendance';
  if (pathname.includes('/attendance')) return 'Attendance management';
  if (pathname.includes('/employees')) return 'Employee management';
  if (pathname.includes('/dashboard')) return 'Dashboard';
  if (pathname.includes('/products')) return 'Product & category';
  if (pathname.includes('/orders')) return 'Order tracking';
  if (pathname.includes('/farmers')) return 'Farmer Registration';
  if (pathname.includes('/farmer-registration-list')) return 'Farmer Reg. List';
  if (pathname.includes('/lab-reports')) return 'Lab Test Report';
  return 'Dashboard';
}

const AdminLayout = () => {
  const isMobile = useIsMobileDashboard(768);
  const [isExpanded, setIsExpanded] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    if (!isMobile) setMobileDrawerOpen(false);
  }, [isMobile]);

  const closeMobileDrawer = () => setMobileDrawerOpen(false);

  const isManagerPortal = location.pathname.startsWith('/manager');
  const menuItems = isManagerPortal ? MANAGER_MENU : ADMIN_MENU;

  const handleLogout = async () => {
    closeMobileDrawer();
    await logout();
    navigate('/', { replace: true });
  };

  const toggleSidebarDesktop = () => setIsExpanded((p) => !p);

  const navIsActive = (itemPath) => {
    if (location.pathname === itemPath) return true;
    if (itemPath.endsWith('/employees') && location.pathname.startsWith(itemPath)) return true;
    if (itemPath.endsWith('/attendance') && location.pathname.startsWith(itemPath)) return true;
    if (itemPath.endsWith('/farmers') && location.pathname.startsWith(itemPath)) return true;
    if (itemPath.endsWith('/products') && location.pathname.startsWith(itemPath)) return true;
    if (itemPath.endsWith('/orders') && location.pathname.startsWith(itemPath)) return true;
    if (itemPath.endsWith('/lab-reports') && location.pathname.startsWith(itemPath)) return true;
    if (itemPath.includes('farmer-registration') && location.pathname.startsWith(itemPath)) return true;
    return false;
  };

  const currentPage = resolvePageTitle(location.pathname);

  const sidebarClass = [
    'sidebar',
    !isMobile && (isExpanded ? 'expanded' : 'collapsed'),
    isMobile && 'sidebar-mobile',
    isMobile && mobileDrawerOpen && 'admin-mobile-open',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="admin-container">
      {isMobile && mobileDrawerOpen && (
        <div className="admin-sidebar-backdrop" onClick={closeMobileDrawer} aria-hidden="true" />
      )}

      {/* SIDEBAR */}
      <aside className={sidebarClass}>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => (isMobile ? setMobileDrawerOpen((o) => !o) : toggleSidebarDesktop())}
          aria-label="Toggle sidebar"
        >
          {isMobile ? (
            mobileDrawerOpen ? (
              <ChevronLeft size={14} />
            ) : (
              <ChevronRight size={14} />
            )
          ) : isExpanded ? (
            <ChevronLeft size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
        </button>

        <div className="sidebar-header">
          {/* <h1 className="logo-placeholder-text">{isExpanded ? 'Logo' : 'L'}</h1> */}
          
          <div className="brand-section">
            <div className="logo-circle">
              <img src={logo} alt="Jioji Green India Logo" />
            </div>
            {(isExpanded || isMobile) && (
              <div className="brand-names">
                <span className="brand-title-main">JIOJI GREEN INDIA</span>
                {isManagerPortal && (
                  <span className="brand-title-sub">Manager portal</span>
                )}
              </div>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const isActive = navIsActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => isMobile && closeMobileDrawer()}
              >
                <span className="nav-icon">{item.icon}</span>
                {(isExpanded || isMobile) && <span className="nav-label">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <button type="button" className="logout-button" onClick={handleLogout}>
          <span className="nav-icon"><LogOut size={20} /></span>
          {(isExpanded || isMobile) && <span className="nav-label">Logout</span>}
        </button>
      </aside>

      {/* MAIN VIEWPORT WITH HEADER */}
      <main className="main-viewport">
        <header className="top-header">
          <div className="top-header-title-row">
            <button
              type="button"
              className={`admin-mobile-menu-btn ${isMobile ? 'admin-mobile-menu-btn--visible' : ''}`}
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
            <h2 className="header-page-title">{currentPage}</h2>
          </div>
          
          <div className="header-actions">
            <div className="date-filter-dropdown">
              <Calendar size={18} className="calendar-icon" />
              <select>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="yesterday">Yesterday</option>
              </select>
            </div>
            
            <button className="notification-bell">
              <Bell size={20} />
              <span className="notification-dot"></span>
            </button>
          </div>
        </header>

        <div className="content-padding">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;