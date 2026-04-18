import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import ManagerDashboard from "../pages/dashboard/ManagerDashboard";
import EmployeeList from "../pages/employees/EmployeeList";
import AddEditEmployee from "../pages/employees/AddEditEmployee";
import AttendanceManagement from "../pages/employees/AttendanceManagement";
import EmployeeLocationHistory from "../pages/employees/EmployeeLocationHistory";
import LeaveManagement from "../pages/employees/LeaveManagement";
import FarmerRegistrationList from "../pages/employees/FarmerRegistrationList";

/**
 * Manager portal: same shell as admin, employee-focused routes only.
 * Backend must authorize MANAGER on the corresponding APIs.
 */
const ManagerRoutes = () => (
  <ProtectedRoute role="MANAGER">
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="dashboard" element={<ManagerDashboard />} />
        <Route path="employees" element={<EmployeeList />} />
        <Route path="employees/add" element={<AddEditEmployee />} />
        <Route path="employees/edit/:id" element={<AddEditEmployee />} />
        <Route path="attendance" element={<AttendanceManagement />} />
        <Route path="attendance/employee/:employeeId" element={<EmployeeLocationHistory />} />
        <Route path="leave-management" element={<LeaveManagement />} />
        <Route path="farmer-registration-list" element={<FarmerRegistrationList />} />
        <Route path="*" element={<Navigate to="/manager/dashboard" replace />} />
      </Route>
    </Routes>
  </ProtectedRoute>
);

export default ManagerRoutes;
