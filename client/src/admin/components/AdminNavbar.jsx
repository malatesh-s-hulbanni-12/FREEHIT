import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { 
  Shield, 
  LayoutDashboard, 
  FileText, 
  CheckSquare,
  Settings, 
  LogOut, 
  Menu, 
  X,
  Wallet,
  TrendingUp,
  Bell
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { admin, adminLogout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/slips', icon: FileText, label: 'Slips' },
    { path: '/admin/answers', icon: CheckSquare, label: 'Answers' },
    { path: '/admin/withdrawals', icon: Wallet, label: 'Withdrawals' },
    { path: '/admin/analytics', icon: TrendingUp, label: 'Analytics' },
    { path: '/admin/bets', icon: Settings, label: 'Bets' },
  ];

  const handleLogout = () => {
    adminLogout();
    setShowLogoutModal(false);
    navigate('/admin');
    toast.success('Logged out successfully');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-purple-300" />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-200 to-white bg-clip-text text-transparent">
                Admin Panel
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-white/20 text-white shadow-lg'
                        : 'hover:bg-white/10 text-purple-200 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right side - Admin Info & Logout */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-purple-200" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center space-x-3 bg-white/10 px-3 py-2 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {admin?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden lg:block">
                  <p className="text-xs text-purple-200">Admin</p>
                  <p className="text-sm font-medium truncate max-w-[150px]">
                    {admin?.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors border border-red-500/30"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-purple-900/95 backdrop-blur-lg border-t border-purple-700/50">
            <div className="px-4 py-3 space-y-1">
              <div className="flex items-center space-x-3 bg-white/10 p-3 rounded-lg mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-white">
                    {admin?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{admin?.email}</p>
                  <p className="text-xs text-purple-300">Administrator</p>
                </div>
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-white/20 text-white'
                        : 'text-purple-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-base font-medium">{item.label}</span>
                  </button>
                );
              })}

              <button
                onClick={() => {
                  setShowLogoutModal(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-red-300 hover:bg-red-500/20 hover:text-red-200 rounded-lg transition-colors mt-2 border-t border-purple-700/50 pt-4"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-base font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 animate-slide-up">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
            <div className="flex space-x-3">
              <button onClick={handleLogout} className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600">
                Logout
              </button>
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminNavbar;