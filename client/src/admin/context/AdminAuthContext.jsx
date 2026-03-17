import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  return useContext(AdminAuthContext);
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = () => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      // You could verify this token with your backend
      setAdmin({ email: import.meta.env.VITE_ADMIN_EMAIL });
      setIsAuthenticated(true);
    }
    setLoading(false);
  };

  const adminLogin = (email, password) => {
    // Check against env variables
    if (
      email === import.meta.env.VITE_ADMIN_EMAIL && 
      password === import.meta.env.VITE_ADMIN_PASSWORD
    ) {
      // Store a token that the backend will recognize
      const token = 'admin_' + Date.now();
      localStorage.setItem('adminToken', token);
      setAdmin({ email });
      setIsAuthenticated(true);
      return { success: true };
    } else {
      return { 
        success: false, 
        error: 'Invalid admin credentials' 
      };
    }
  };

  const adminLogout = () => {
    localStorage.removeItem('adminToken');
    setAdmin(null);
    setIsAuthenticated(false);
  };

  const value = {
    admin,
    isAuthenticated,
    loading,
    adminLogin,
    adminLogout
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};