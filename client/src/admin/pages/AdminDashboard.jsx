import React, { useState, useEffect } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import CreateSlipModal from '../components/CreateSlipModal';
import ViewSlipModal from '../components/ViewSlipModal';
import EditSlipModal from '../components/EditSlipModal';
import { 
  Users, Wallet, Activity, 
  FileText, Plus, Eye, Edit, Trash2 
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const AdminDashboard = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSlips: 0,
    totalValue: 0
  });

  useEffect(() => {
    fetchSlips();
    fetchStats();
  }, []);

  const fetchSlips = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('https://freehit.onrender.com/api/slips', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSlips(response.data.slips || []);
    } catch (error) {
      console.error('Failed to fetch slips:', error);
      toast.error('Failed to load slips');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('https://freehit.onrender.com/api/slips/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStats({
        totalSlips: response.data.stats?.totalSlips || 0,
        totalValue: response.data.stats?.totalValue || 0
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleDeleteSlip = async (id) => {
    if (!window.confirm('Are you sure you want to delete this slip?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`https://freehit.onrender.com/api/slips/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Slip deleted successfully');
      fetchSlips();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete slip');
    }
  };

  const handleViewSlip = (slip) => {
    setSelectedSlip(slip);
    setShowViewModal(true);
  };

  const handleEditSlip = (slip) => {
    setSelectedSlip(slip);
    setShowEditModal(true);
  };

  const statsCards = [
    { 
      label: 'Total Users', 
      value: '1,234', 
      icon: Users, 
      change: '+12%', 
      color: 'blue' 
    },
    { 
      label: 'Total Balance', 
      value: '₹45,678', 
      icon: Wallet, 
      change: '+8%', 
      color: 'green' 
    },
    { 
      label: 'Total Slips', 
      value: stats.totalSlips?.toString() || '0', 
      icon: FileText, 
      change: '+5%', 
      color: 'purple' 
    },
    { 
      label: 'Total Value', 
      value: `₹${stats.totalValue}` || '0', 
      icon: Activity, 
      change: '+3%', 
      color: 'indigo' 
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Create Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, Admin</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 sm:mt-0 flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Slip</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            const colors = {
              blue: 'bg-blue-50 text-blue-600',
              green: 'bg-green-50 text-green-600',
              purple: 'bg-purple-50 text-purple-600',
              indigo: 'bg-indigo-50 text-indigo-600',
            };
            
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${colors[stat.color]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Slips Management Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Slips Management</h2>
            <div className="flex items-center space-x-2">
              <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none">
                <option value="all">All Slips</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
          ) : slips.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No slips created yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
              >
                Create your first slip
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {slips.map((slip) => (
                <div key={slip._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{slip.title || 'Untitled'}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          slip.status === 'completed' 
                            ? 'bg-green-100 text-green-700'
                            : slip.status === 'active'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {slip.status || 'active'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{slip.description || 'No description'}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{slip.questions?.length || 0} questions</span>
                        <span>Total: ₹{slip.totalPrice || 0}</span>
                        {slip.answers?.length > 0 && (
                          <span className="text-green-600">{slip.answers.length} answers</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-3 sm:mt-0">
                      <button
                        onClick={() => handleViewSlip(slip)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditSlip(slip)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit Slip"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSlip(slip._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Slip"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Preview of questions */}
                  {slip.questions && slip.questions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">Questions:</p>
                      <div className="flex flex-wrap gap-2">
                        {slip.questions.slice(0, 3).map((q, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                            {q.question?.substring(0, 30)}...
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateSlipModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(newSlip) => {
          setSlips([newSlip, ...slips]);
          fetchStats();
        }}
      />

      <ViewSlipModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedSlip(null);
        }}
        slip={selectedSlip}
      />

      <EditSlipModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedSlip(null);
        }}
        slip={selectedSlip}
        onSuccess={(updatedSlip) => {
          setSlips(slips.map(s => s._id === updatedSlip._id ? updatedSlip : s));
          fetchStats();
        }}
      />
    </div>
  );
};

export default AdminDashboard;
