import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import AuthErrorBoundary from './components/AuthErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/auth/Login';          // Landing Page
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import AdminLogin from './pages/auth/AdminLogin';
import LabLogin from './pages/auth/LabLogin';
import EmployeeLogin from './pages/auth/EmployeeLogin';

import UserDashboard from './pages/dashboard/UserDashboard';
// import LabDashboard from './pages/dashboard/LabDashboard';

import './styles/main.css';

import AdminRoutes from './routes/AdminRoutes';
import EmployeeRoutes from './routes/EmployeeRoutes';

import LabRoutes from './routes/LabRoutes';
// Footer Pages
import Seeds from './pages/footer/Seeds';
import Fertilizers from './pages/footer/Fertilizers';
import AboutUs from './pages/footer/AboutUs';
import ContactUs from './pages/footer/ContactUs';
import FAQs from './pages/footer/FAQs';
import Blog from './pages/footer/Blog';

import AuthLogin from "./pages/auth/AuthLogin";
import FarmerPaymentResultPage from './pages/EmployeeModule/FarmerPayment/FarmerPaymentResultPage';
import FarmerPaymentProcessingPage from './pages/EmployeeModule/FarmerPayment/FarmerPaymentProcessingPage';

function App() {
  return (
    <ErrorBoundary>
      <AuthErrorBoundary>
        <Routes>
        <Route path="/" element={<Login />} />

        {/* Auth Pages */}
        <Route path="/login" element={<EmployeeLogin />} />
        <Route path="/auth-login" element={<AuthLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/employee-login" element={<EmployeeLogin />} />
        <Route path="/lab-login" element={<LabLogin />} />

        {/* Dashboards */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="USER">
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        {/* Role Based */}
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/employee/*" element={<EmployeeRoutes />} />

        <Route path="/lab/*" element={<LabRoutes />} />

        {/* Footer */}
        <Route path="/seeds" element={<Seeds />} />
        <Route path="/fertilizers" element={<Fertilizers />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/faqs" element={<FAQs />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/farmer-payment/processing" element={<FarmerPaymentProcessingPage />} />
        <Route path="/farmer-payment/success" element={<FarmerPaymentResultPage status="success" />} />
        <Route path="/farmer-payment/failed" element={<FarmerPaymentResultPage status="failed" />} />
        <Route path="/farmer-payment/cancelled" element={<FarmerPaymentResultPage status="cancelled" />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </AuthErrorBoundary>
    </ErrorBoundary>
  );
}

export default App;
 