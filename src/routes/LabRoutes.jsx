import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import LabLayout from '../layouts/LabLayout';
import LabDashboard from '../pages/dashboard/LabDashboard';
import LabReports from '../pages/lab-reports/LabReports';

const LabRoutes = () => (
  <ProtectedRoute role="LAB">
    <Routes>
      <Route element={<LabLayout />}>
        <Route path="dashboard" element={<LabDashboard />} />
        <Route path="report" element={<LabReports />} />
        <Route path="*" element={<Navigate to="/lab/dashboard" replace />} />
      </Route>
    </Routes>
  </ProtectedRoute>
);

export default LabRoutes;
