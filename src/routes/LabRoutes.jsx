import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LabLayout from '../layouts/LabLayout';
import LabDashboard from '../pages/dashboard/LabDashboard';
import LabReports from '../pages/lab-reports/LabReports';

const ALLOWED_ROLES = ['LAB', 'LAB_TECHNICIAN', 'ROLE_LAB', 'ROLE_LAB_TECHNICIAN'];

const LabRoutes = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Role guard — only LAB / LAB_TECHNICIAN may access this module
  const role = (user?.role || localStorage.getItem('role') || '').toUpperCase();
  if (!ALLOWED_ROLES.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      <Route element={<LabLayout />}>
        <Route path="dashboard" element={<LabDashboard />} />
        <Route path="report"    element={<LabReports />} />
        <Route path="*" element={<Navigate to="/lab/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default LabRoutes;
