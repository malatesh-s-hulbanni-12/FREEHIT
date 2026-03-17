import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Settings, ChevronDown, Wallet, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ProfileMenu = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatWalletBalance = (balance) => {
    return balance?.toFixed(2) || '0.00';
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-gradient-to-r from-primary-50 to-primary-100 px-3 py-2 rounded-lg hover:from-primary-100 hover:to-primary-200 transition-all duration-200 border border-primary-200"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs text-primary-600">Welcome back</p>
          <p className="text-sm font-semibold text-gray-700">{user?.name?.split(' ')[0]}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-primary-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-1 animate-fade-in">
          {/* User info with wallet */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            
            {/* Wallet balance in dropdown */}
            <div className="mt-2 flex items-center justify-between bg-white p-2 rounded-lg border border-primary-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Wallet Balance</p>
                  <p className="text-sm font-bold text-primary-700">₹{formatWalletBalance(user?.walletBalance)}</p>
                </div>
              </div>
              {user?.walletBalance >= 100 && (
                <Award className="w-5 h-5 text-yellow-500" />
              )}
            </div>
          </div>

          <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-primary-50 flex items-center space-x-2 transition-colors">
            <User className="w-4 h-4 text-gray-500" />
            <span>Profile</span>
          </button>

          <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-primary-50 flex items-center space-x-2 transition-colors">
            <Wallet className="w-4 h-4 text-gray-500" />
            <span>Wallet History</span>
          </button>

          <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-primary-50 flex items-center space-x-2 transition-colors">
            <Settings className="w-4 h-4 text-gray-500" />
            <span>Settings</span>
          </button>

          <div className="border-t border-gray-100 my-1"></div>

          <button
            onClick={logout}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;