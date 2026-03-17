import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './admin/context/AdminAuthContext';
import HomePage from './pages/HomePage';
import WalletPage from './pages/WalletPage';
import ProfilePage from './pages/ProfilePage';
import ToastProvider from './components/ToastProvider';
import Navbar from './components/Navbar';
import AdminRoutes from './admin/AdminRoutes';

// Create a wrapper component to conditionally render Navbar
const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  return (
    <>
      {!isAdminRoute && <Navbar />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        
        {/* Admin Routes - all paths starting with /admin */}
        <Route path="/admin/*" element={<AdminRoutes />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AdminAuthProvider>
          <ToastProvider />
          <AppContent />
        </AdminAuthProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;