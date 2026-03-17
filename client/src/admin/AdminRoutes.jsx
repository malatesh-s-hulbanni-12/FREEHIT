import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuth } from './context/AdminAuthContext';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AnswersPage from './pages/AnswersPage';
import BetsPage from './pages/BetsPage';
import WithdrawalsPage from './pages/WithdrawalsPage';  // Import the new page

// Protected Route wrapper for admin
const ProtectedAdminRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAdminAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/admin" />;
};

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminLogin />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedAdminRoute>
            <AdminDashboard />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/answers"
        element={
          <ProtectedAdminRoute>
            <AnswersPage />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/bets"
        element={
          <ProtectedAdminRoute>
            <BetsPage />
          </ProtectedAdminRoute>
        }
      />
        <Route
        path="/withdrawals"
        element={
          <ProtectedAdminRoute>
            <WithdrawalsPage />
          </ProtectedAdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/admin" />} />
    </Routes>
  );
};

export default AdminRoutes;