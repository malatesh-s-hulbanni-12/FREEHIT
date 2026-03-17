import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import ProfileMenu from './ProfileMenu';
import { Wallet, LogIn, Shield, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [modalType, setModalType] = useState('login');
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const openAuthModal = (type) => {
    setModalType(type);
    setIsAuthModalOpen(true);
  };

  // Format wallet balance
  const formatWalletBalance = (balance) => {
    return balance?.toFixed(2) || '0.00';
  };

  // Handle wallet click
  const handleWalletClick = () => {
    navigate('/wallet');
  };

  // Handle profile click
  const handleProfileClick = () => {
    navigate('/profile');
  };

  // Handle admin click - navigating to admin pages
  const handleAdminClick = () => {
    navigate('/admin/dashboard');
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-effect">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - New text (clickable to home) and wallet */}
            <div className="flex items-center space-x-4">
              <div 
                className="flex items-center cursor-pointer"
                onClick={() => navigate('/')}
              >
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                  NEW
                </h1>
              </div>
              
              {/* Wallet symbol for authenticated users with actual balance */}
              {isAuthenticated && user && (
                <div 
                  onClick={handleWalletClick}
                  className="flex items-center space-x-1 bg-gradient-to-r from-primary-50 to-primary-100 px-3 py-1.5 rounded-full border border-primary-200 shadow-sm cursor-pointer hover:from-primary-100 hover:to-primary-200 transition-all duration-200 transform hover:scale-105"
                >
                  <Wallet className="w-4 h-4 text-primary-600" />
                  <span className="text-sm font-bold text-primary-700">
                    ₹{formatWalletBalance(user.walletBalance)}
                  </span>
                  {user.walletBalance > 0 && (
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-1"></span>
                  )}
                </div>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Admin Button - Only show when NOT authenticated */}
              {!isAuthenticated && (
                <>
                  {/* Desktop Admin Button */}
                  <button
                    onClick={handleAdminClick}
                    className="hidden sm:flex items-center space-x-1 bg-purple-50 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors duration-200 border border-purple-200"
                    title="Admin Panel"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">Admin</span>
                  </button>

                  {/* Mobile Admin Button */}
                  <button
                    onClick={handleAdminClick}
                    className="sm:hidden flex items-center justify-center w-8 h-8 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors duration-200 border border-purple-200"
                    title="Admin Panel"
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                </>
              )}

              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => openAuthModal('login')}
                    className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-gray-700 hover:text-primary-600 transition-colors duration-200 group"
                  >
                    <LogIn className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-sm sm:text-base">Login</span>
                  </button>
                  <button
                    onClick={() => openAuthModal('register')}
                    className="bg-gradient-to-r from-primary-600 to-primary-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-primary-700 hover:to-primary-600 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base"
                  >
                    Register
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  {/* Profile button for mobile/desktop */}
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center space-x-1 bg-primary-50 text-primary-700 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-primary-100 transition-colors duration-200 border border-primary-200 mr-1"
                    title="Profile"
                  >
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline text-sm font-medium">Profile</span>
                  </button>
                  <ProfileMenu user={user} />
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialType={modalType}
      />
    </>
  );
};

export default Navbar;