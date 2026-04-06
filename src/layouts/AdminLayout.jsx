import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/Jioji_logo.png';
import '../styles/AdminLayout.css'; 
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
  Calendar
} from 'lucide-react';

const AdminLayout = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/admin/employees', label: 'Employee management', icon: <Users size={20} /> },
    { path: '/admin/products', label: 'Product & category', icon: <Package size={20} /> },
    { path: '/admin/orders', label: 'Order tracking', icon: <ShoppingCart size={20} /> },
    { path: '/admin/farmers', label: 'Farmer Registration', icon: <MessageSquare size={20} /> },
    { path: '/admin/lab-reports', label: 'Lab Test Report', icon: <FileText size={20} /> },
  ];

  const currentPage = menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard';

  return (
    <div className="admin-container">
      {/* SIDEBAR */}
      <aside className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <button className="sidebar-toggle" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        <div className="sidebar-header">
          {/* <h1 className="logo-placeholder-text">{isExpanded ? 'Logo' : 'L'}</h1> */}
          
          <div className="brand-section">
            <div className="logo-circle">
              <img src={logo} alt="Jioji Green India Logo" />
            </div>
            {isExpanded && (
              <div className="brand-names">
                <span className="brand-title-main">JIOJI GREEN INDIA</span>
              </div>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {isExpanded && <span className="nav-label">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <button className="logout-button" onClick={handleLogout}>
          <span className="nav-icon"><LogOut size={20} /></span>
          {isExpanded && <span className="nav-label">Logout</span>}
        </button>
      </aside>

      {/* MAIN VIEWPORT WITH HEADER */}
      <main className="main-viewport">
        <header className="top-header">
          <h2 className="header-page-title">{currentPage}</h2>
          
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