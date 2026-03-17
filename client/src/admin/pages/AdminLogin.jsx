import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { adminLogin } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      const result = adminLogin(email, password);
      
      if (result.success) {
        toast.success('Admin login successful!');
        navigate('/admin/dashboard');
      } else {
        setError(result.error);
        toast.error(result.error);
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl max-w-md w-full p-8 border border-white/20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-500/30 rounded-full mb-4 border-2 border-purple-400">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Admin Login</h2>
          <p className="text-purple-200">Enter your admin credentials</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center space-x-2 text-white">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-purple-300/30 rounded-lg text-white placeholder-purple-300/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition-all"
                placeholder="admin@freehit.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-purple-300/30 rounded-lg text-white placeholder-purple-300/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-indigo-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Authenticating...</span>
              </div>
            ) : (
              'Login to Admin Panel'
            )}
          </button>

          <div className="text-center text-sm text-purple-300">
            Demo credentials are in your .env file
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;