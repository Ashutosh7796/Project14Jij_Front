import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EmployeeLayout from '../layouts/EmployeeLayout';
import EmployeeDashboard from '../pages/dashboard/EmployeeDashboard';
import FarmerRegistration from '../pages/EmployeeModule/FarmerRegistration/FarmerRegistration';
import HistoryOverview from '../pages/EmployeeModule/HistoryOverview/HistoryOverview';
import PreviousHistory from '../pages/EmployeeModule/PreviousHistoryFarmers/PreviousHistory';
import UpdateFarmer from '../pages/EmployeeModule/UpdateFarmer/UpdateFarmer';
import MyLeaves from '../pages/employees/MyLeaves';

const ALLOWED_ROLES = ['EMPLOYEE', 'SURVEYOR', 'ROLE_EMPLOYEE', 'ROLE_SURVEYOR'];

const EmployeeRoutes = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Role guard — only EMPLOYEE / SURVEYOR may access this module
  const role = (user?.role || localStorage.getItem('role') || '').toUpperCase();
  if (!ALLOWED_ROLES.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      <Route element={<EmployeeLayout />}>
        <Route path="dashboard"           element={<EmployeeDashboard />} />
        <Route path="my-leaves"           element={<MyLeaves />} />
        <Route path="farmer-registration" element={<FarmerRegistration />} />
        <Route path="fill-farmer-survey"  element={<FarmerRegistration />} />
        <Route path="update-farmer"       element={<UpdateFarmer />} />
        <Route path="history-overview"    element={<HistoryOverview />} />
        <Route path="previous-history"    element={<PreviousHistory />} />
        <Route path="farmer-history"      element={<PreviousHistory />} />
        <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default EmployeeRoutes;
