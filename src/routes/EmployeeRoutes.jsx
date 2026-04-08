import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import EmployeeLayout from '../layouts/EmployeeLayout';
import EmployeeDashboard from '../pages/dashboard/EmployeeDashboard';
import FarmerRegistration from '../pages/EmployeeModule/FarmerRegistration/FarmerRegistration';
import HistoryOverview from '../pages/EmployeeModule/HistoryOverview/HistoryOverview';
import PreviousHistory from '../pages/EmployeeModule/PreviousHistoryFarmers/PreviousHistory';
import UpdateFarmer from '../pages/EmployeeModule/UpdateFarmer/UpdateFarmer';
import MyLeaves from '../pages/employees/MyLeaves';

const EmployeeRoutes = () => (
  <ProtectedRoute role="EMPLOYEE">
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
  </ProtectedRoute>
);

export default EmployeeRoutes;
