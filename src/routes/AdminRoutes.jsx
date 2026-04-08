import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminLayout from '../layouts/AdminLayout';
import Dashboard from '../pages/dashboard/Dashboard';
import EmployeeList from '../pages/employees/EmployeeList';
import AddEditEmployee from '../pages/employees/AddEditEmployee';
import FarmerList from '../pages/farmers/FarmerList';
import FarmerDetail from '../pages/farmers/FarmerDetail';
import AddEditFarmer from '../pages/farmers/AddEditFarmer';
import SurveyHistory from '../pages/farmers/SurveyHistory';
import OrderList from '../pages/orders/OrderList';
import OrderDetail from '../pages/orders/OrderDetail';
import ProductList from '../pages/products/ProductList';
import AddEditProduct from '../pages/products/AddEditProduct';
import LabReports from '../pages/lab-reports/LabReports';
import AttendanceManagement from '../pages/employees/AttendanceManagement';
import EmployeeLocationHistory from '../pages/employees/EmployeeLocationHistory';
import LeaveManagement from '../pages/employees/LeaveManagement';
import FarmerRegistrationList from '../pages/employees/FarmerRegistrationList';

const AdminRoutes = () => (
  <ProtectedRoute role="ADMIN">
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="attendance" element={<AttendanceManagement />} />
        <Route path="attendance/employee/:employeeId" element={<EmployeeLocationHistory />} />
        <Route path="leave-management" element={<LeaveManagement />} />
        <Route path="employees" element={<EmployeeList />} />
        <Route path="employees/add" element={<AddEditEmployee />} />
        <Route path="employees/edit/:id" element={<AddEditEmployee />} />
        <Route path="farmers" element={<FarmerList />} />
        <Route path="farmers/add" element={<AddEditFarmer />} />
        <Route path="farmers/edit/:id" element={<AddEditFarmer />} />
        <Route path="farmers/:id" element={<FarmerDetail />} />
        <Route path="history" element={<SurveyHistory />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/add" element={<AddEditProduct />} />
        <Route path="products/edit/:id" element={<AddEditProduct />} />
        <Route path="lab-reports"                  element={<LabReports />} />
        <Route path="farmer-registration-list"      element={<FarmerRegistrationList />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
    </Routes>
  </ProtectedRoute>
);

export default AdminRoutes;