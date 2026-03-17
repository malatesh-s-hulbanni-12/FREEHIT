import React, { useState, useEffect } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import { 
  Wallet, 
  User, 
  Mail, 
  Smartphone,
  Calendar,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const WithdrawalsPage = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedWithdrawal, setExpandedWithdrawal] = useState(null);
  const [stats, setStats] = useState({
    totalWithdrawals: 0,
    totalAmount: 0,
    pendingWithdrawals: 0,
    processingWithdrawals: 0,
    completedWithdrawals: 0,
    rejectedWithdrawals: 0
  });
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/withdrawals/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setWithdrawals(response.data.withdrawals || []);
      
      // Calculate stats
      const data = response.data.withdrawals || [];
      const stats = {
        totalWithdrawals: data.length,
        totalAmount: data.reduce((sum, w) => sum + (w.amount || 0), 0),
        pendingWithdrawals: data.filter(w => w.status === 'pending').length,
        processingWithdrawals: data.filter(w => w.status === 'processing').length,
        completedWithdrawals: data.filter(w => w.status === 'completed').length,
        rejectedWithdrawals: data.filter(w => w.status === 'rejected').length
      };
      setStats(stats);
      
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
      toast.error('Failed to load withdrawals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWithdrawals();
  };

  const toggleExpand = (id) => {
    setExpandedWithdrawal(expandedWithdrawal === id ? null : id);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center space-x-1">
          <CheckCircle className="w-3 h-3" />
          <span>Approved</span>
        </span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center space-x-1">
          <XCircle className="w-3 h-3" />
          <span>Rejected</span>
        </span>;
      case 'processing':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>Processing</span>
        </span>;
      default:
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>Pending</span>
        </span>;
    }
  };

  const handleApproveClick = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setTransactionId('');
    setShowApproveModal(true);
  };

  const handleRejectClick = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleProcessWithdrawal = async (status) => {
    if (!selectedWithdrawal) return;

    setProcessingAction(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      const updateData = {
        status: status
      };

      if (status === 'completed' && transactionId) {
        updateData.transactionId = transactionId;
      }

      if (status === 'rejected' && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }

      const response = await axios.put(
        `http://localhost:5000/api/withdrawals/${selectedWithdrawal._id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(`Withdrawal ${status === 'completed' ? 'approved' : 'rejected'} successfully!`);
        
        // Update local state
        setWithdrawals(prev => prev.map(w => 
          w._id === selectedWithdrawal._id ? { ...w, status } : w
        ));
        
        // Refresh data
        fetchWithdrawals();
        
        // Close modals
        setShowApproveModal(false);
        setShowRejectModal(false);
        setSelectedWithdrawal(null);
        setTransactionId('');
        setRejectionReason('');
      }
    } catch (error) {
      console.error('Failed to update withdrawal:', error);
      toast.error(error.response?.data?.message || 'Failed to update withdrawal');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleMarkAsProcessing = async (withdrawal) => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await axios.put(
        `http://localhost:5000/api/withdrawals/${withdrawal._id}`,
        { status: 'processing' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Withdrawal marked as processing');
        fetchWithdrawals();
      }
    } catch (error) {
      console.error('Failed to update withdrawal:', error);
      toast.error('Failed to update status');
    }
  };

  // Filter withdrawals based on search and status
  const filteredWithdrawals = withdrawals.filter(w => {
    const matchesSearch = 
      w.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.upiId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.withdrawalId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || w.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Withdrawals Management</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">View and manage all user withdrawal requests</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="mt-3 sm:mt-0 flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.totalWithdrawals}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
            <p className="text-xs text-gray-500">Total Amount</p>
            <p className="text-lg sm:text-xl font-bold text-purple-600">₹{stats.totalAmount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-lg sm:text-xl font-bold text-yellow-600">{stats.pendingWithdrawals}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
            <p className="text-xs text-gray-500">Processing</p>
            <p className="text-lg sm:text-xl font-bold text-blue-600">{stats.processingWithdrawals}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
            <p className="text-xs text-gray-500">Approved</p>
            <p className="text-lg sm:text-xl font-bold text-green-600">{stats.completedWithdrawals}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
            <p className="text-xs text-gray-500">Rejected</p>
            <p className="text-lg sm:text-xl font-bold text-red-600">{stats.rejectedWithdrawals}</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, email, UPI ID or withdrawal ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full sm:w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Withdrawals List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No withdrawals found</p>
            </div>
          ) : (
            filteredWithdrawals.map((withdrawal) => (
              <div key={withdrawal._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4">
                  {/* Header with User Info and Status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {withdrawal.userName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {withdrawal.userEmail}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(withdrawal.status)}
                      <button
                        onClick={() => toggleExpand(withdrawal._id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        {expandedWithdrawal === withdrawal._id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Amount and UPI Info - Always Visible */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-4 h-4 text-gray-500" />
                      <span className="text-xs font-medium text-gray-600">
                        {withdrawal.upiId || 'No UPI ID'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="text-sm font-bold text-purple-600">₹{withdrawal.amount}</p>
                    </div>
                  </div>

                  {/* Date and Withdrawal ID */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="truncate max-w-[150px] sm:max-w-xs">
                      ID: {withdrawal.withdrawalId || withdrawal._id.slice(-8)}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(withdrawal.requestedAt || withdrawal.createdAt)}</span>
                    </div>
                  </div>

                  {/* Action Buttons for Pending/Processing */}
                  {(withdrawal.status === 'pending' || withdrawal.status === 'processing') && (
                    <div className="flex space-x-2 mt-3">
                      {withdrawal.status === 'pending' && (
                        <button
                          onClick={() => handleMarkAsProcessing(withdrawal)}
                          className="flex-1 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                        >
                          Mark Processing
                        </button>
                      )}
                      <button
                        onClick={() => handleApproveClick(withdrawal)}
                        className="flex-1 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectClick(withdrawal)}
                        className="flex-1 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {/* Expanded Details */}
                  {expandedWithdrawal === withdrawal._id && (
                    <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
                      {/* User Details */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-sm font-medium text-gray-900">{withdrawal.userPhone || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-500">Method</p>
                          <p className="text-sm font-medium text-gray-900">{withdrawal.method || 'UPI'}</p>
                        </div>
                      </div>

                      {/* UPI Details */}
                      {withdrawal.upiId && (
                        <div className="bg-purple-50 rounded-lg p-2">
                          <p className="text-xs text-gray-500 mb-1">UPI ID</p>
                          <p className="text-sm font-bold text-purple-700">{withdrawal.upiId}</p>
                        </div>
                      )}

                      {/* Transaction Details */}
                      {withdrawal.transactionId && (
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-500">Transaction ID</p>
                          <p className="text-sm font-mono text-gray-900">{withdrawal.transactionId}</p>
                        </div>
                      )}

                      {/* Rejection Reason */}
                      {withdrawal.rejectionReason && (
                        <div className="bg-red-50 rounded-lg p-2">
                          <p className="text-xs text-red-500 mb-1">Rejection Reason</p>
                          <p className="text-sm text-red-700">{withdrawal.rejectionReason}</p>
                        </div>
                      )}

                      {/* Processed By */}
                      {withdrawal.processedBy && (
                        <div className="text-xs text-gray-400">
                          Processed by: Admin
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Approve Withdrawal</h3>
            <p className="text-sm text-gray-600 mb-4">
              Approve withdrawal of ₹{selectedWithdrawal.amount} for {selectedWithdrawal.userName}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction ID (Optional)
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter UPI transaction ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => handleProcessWithdrawal('completed')}
                disabled={processingAction}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {processingAction ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Withdrawal</h3>
            <p className="text-sm text-gray-600 mb-4">
              Reject withdrawal of ₹{selectedWithdrawal.amount} for {selectedWithdrawal.userName}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Rejection
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => handleProcessWithdrawal('rejected')}
                disabled={processingAction || !rejectionReason}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {processingAction ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalsPage;