import React, { useState, useEffect } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import { 
  TrendingUp, 
  User, 
  Calendar, 
  Search,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Save,
  Database
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const BetsPage = () => {
  const [bets, setBets] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedBet, setExpandedBet] = useState(null);
  const [pendingSaveBets, setPendingSaveBets] = useState(new Set()); // Track which bets need saving
  const [stats, setStats] = useState({
    totalBets: 0,
    totalAmount: 0,
    pendingBets: 0,
    wonBets: 0,
    lostBets: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Fetch all bets
      const betsResponse = await axios.get('http://localhost:5000/api/bets/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch all answers to determine winners
      const answersResponse = await axios.get('http://localhost:5000/api/answers/public');
      
      const betsData = betsResponse.data.bets || [];
      const answersData = answersResponse.data.answers || [];
      
      setAnswers(answersData);
      
      // Store original database status
      const betsWithOriginalStatus = betsData.map(bet => ({
        ...bet,
        originalStatus: bet.status // Store the original status from DB
      }));
      
      // Auto-determine bet status based on answers (frontend only)
      const updatedBets = determineBetStatus(betsWithOriginalStatus, answersData);
      setBets(updatedBets);
      
      // Calculate which bets need saving (where frontend status differs from DB status)
      const pendingIds = new Set();
      updatedBets.forEach(bet => {
        if (bet.status !== bet.originalStatus && bet.status !== 'pending') {
          pendingIds.add(bet._id);
          console.log(`🔄 Bet ${bet._id} needs saving: DB=${bet.originalStatus}, New=${bet.status}`);
        }
      });
      
      console.log(`📝 Found ${pendingIds.size} bets needing status update`);
      setPendingSaveBets(pendingIds);
      
      // Calculate stats
      calculateStats(updatedBets);
      
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const determineBetStatus = (betsData, answersData) => {
    // Create a map of questionId to correct answer
    const answerMap = {};
    answersData.forEach(answer => {
      answer.answers?.forEach(q => {
        answerMap[q.questionId] = {
          correctAnswer: q.answer,
          answeredAt: answer.resolvedAt || answer.createdAt
        };
      });
    });

    // Update bet status based on correct answers (frontend only)
    return betsData.map(bet => {
      const correctAnswerInfo = answerMap[bet.questionId];
      
      if (correctAnswerInfo) {
        // Check if bet matches correct answer
        const isCorrect = (
          (bet.option === 'yes' && correctAnswerInfo.correctAnswer === true) ||
          (bet.option === 'no' && correctAnswerInfo.correctAnswer === false)
        );
        
        return {
          ...bet,
          status: isCorrect ? 'won' : 'lost',
          resolvedAt: correctAnswerInfo.answeredAt,
          correctAnswer: correctAnswerInfo.correctAnswer
        };
      }
      
      // Keep original status if no answer found
      return bet;
    });
  };

  // Function to update bet status in database
  const updateBetStatusInDB = async (betId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log(`📝 Updating bet ${betId} to ${newStatus} in database...`);
      
      const response = await axios.put(
        `http://localhost:5000/api/bets/${betId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('✅ Bet status updated in DB:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Failed to update bet status in DB:', error);
      toast.error(`Failed to update bet status: ${error.response?.data?.message || error.message}`);
      return false;
    }
  };

  // Function to save all pending statuses to database
  const saveAllStatuses = async () => {
    if (pendingSaveBets.size === 0) {
      toast.info('No bets need status updates');
      return;
    }

    setSaving(true);
    
    // Get all bets that need saving
    const betsToUpdate = bets.filter(bet => pendingSaveBets.has(bet._id));
    
    console.log(`🔄 Saving ${betsToUpdate.length} bet statuses to database...`);
    console.log('Bets to update:', betsToUpdate.map(b => ({
      id: b._id,
      from: b.originalStatus,
      to: b.status
    })));
    
    let successCount = 0;
    let failCount = 0;
    const failedIds = [];
    
    for (const bet of betsToUpdate) {
      const success = await updateBetStatusInDB(bet._id, bet.status);
      if (success) {
        successCount++;
      } else {
        failCount++;
        failedIds.push(bet._id);
      }
    }
    
    if (failCount === 0) {
      toast.success(`✅ Successfully updated ${successCount} bet statuses`);
      // Clear all pending saves on success
      setPendingSaveBets(new Set());
    } else {
      toast.warning(`⚠️ Updated ${successCount}, failed ${failCount} bets`);
      // Keep failed ones in pending
      const newPending = new Set();
      failedIds.forEach(id => newPending.add(id));
      setPendingSaveBets(newPending);
    }
    
    // Refresh data to get updated statuses
    await fetchData();
    setSaving(false);
  };

  // Function to manually mark a bet as won/lost
  const markBetAs = async (betId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log(`📝 Manually marking bet ${betId} as ${newStatus}...`);
      
      const response = await axios.put(
        `http://localhost:5000/api/bets/${betId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('✅ Bet marked successfully:', response.data);
      toast.success(`Bet marked as ${newStatus}`);
      
      // Remove from pending saves
      setPendingSaveBets(prev => {
        const newSet = new Set(prev);
        newSet.delete(betId);
        return newSet;
      });
      
      // Refresh data
      await fetchData();
      
    } catch (error) {
      console.error('❌ Failed to mark bet:', error);
      toast.error(`Failed to mark bet: ${error.response?.data?.message || error.message}`);
    }
  };

  const calculateStats = (betsData) => {
    const stats = {
      totalBets: betsData.length,
      totalAmount: betsData.reduce((sum, bet) => sum + (bet.betAmount || 0), 0),
      pendingBets: betsData.filter(b => b.status === 'pending').length,
      wonBets: betsData.filter(b => b.status === 'won').length,
      lostBets: betsData.filter(b => b.status === 'lost').length
    };
    setStats(stats);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const toggleExpand = (betId) => {
    setExpandedBet(expandedBet === betId ? null : betId);
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
      case 'won':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center space-x-1">
          <CheckCircle className="w-3 h-3" />
          <span>Won</span>
        </span>;
      case 'lost':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center space-x-1">
          <XCircle className="w-3 h-3" />
          <span>Lost</span>
        </span>;
      default:
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>Pending</span>
        </span>;
    }
  };

  const getOptionIcon = (option) => {
    return option === 'yes' ? 
      <ThumbsUp className="w-4 h-4 text-green-600" /> : 
      <ThumbsDown className="w-4 h-4 text-red-600" />;
  };

  // Filter bets based on search and status
  const filteredBets = bets.filter(bet => {
    const matchesSearch = 
      bet.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bet.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bet.slipTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bet.question?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || bet.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bets Management</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">View and manage all user bets</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-0">
            {/* Save All Button - Shows count of pending saves */}
            {pendingSaveBets.size > 0 && (
              <button
                onClick={saveAllStatuses}
                disabled={saving}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                <span>Save to Database ({pendingSaveBets.size})</span>
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
            <p className="text-xs text-gray-500">Total Bets</p>
            <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.totalBets}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
            <p className="text-xs text-gray-500">Total Amount</p>
            <p className="text-lg sm:text-xl font-bold text-purple-600">₹{stats.totalAmount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-lg sm:text-xl font-bold text-yellow-600">{stats.pendingBets}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
            <p className="text-xs text-gray-500">Won</p>
            <p className="text-lg sm:text-xl font-bold text-green-600">{stats.wonBets}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
            <p className="text-xs text-gray-500">Lost</p>
            <p className="text-lg sm:text-xl font-bold text-red-600">{stats.lostBets}</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by user, slip or question..."
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
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>

        {/* Info Banner */}
        {answers.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-700">
              <span className="font-medium">Auto-resolved:</span> Bets are automatically marked as Won/Lost based on answers.
              {pendingSaveBets.size > 0 && (
                <span className="ml-2 font-bold text-green-600">
                  {pendingSaveBets.size} bet(s) pending save to database.
                </span>
              )}
            </p>
          </div>
        )}

        {/* Bets List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
          ) : filteredBets.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No bets found</p>
            </div>
          ) : (
            filteredBets.map((bet) => (
              <div 
                key={bet._id} 
                className={`bg-white rounded-lg shadow-sm overflow-hidden ${
                  pendingSaveBets.has(bet._id) ? 'border-2 border-green-400' : ''
                }`}
              >
                <div className="p-4">
                  {/* Pending Save Indicator */}
                  {pendingSaveBets.has(bet._id) && (
                    <div className="mb-2 flex items-center space-x-2 text-xs text-green-600 bg-green-50 p-1.5 rounded-lg">
                      <Database className="w-3 h-3" />
                      <span>Pending save to database (will be {bet.status})</span>
                    </div>
                  )}

                  {/* User Info Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {bet.userName || 'Anonymous'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {bet.userEmail || 'No email'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(bet.status)}
                      <button
                        onClick={() => toggleExpand(bet._id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        {expandedBet === bet._id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Manual Action Buttons - Only show for pending bets */}
                  {bet.status === 'pending' && (
                    <div className="flex space-x-2 mb-3">
                      <button
                        onClick={() => markBetAs(bet._id, 'won')}
                        className="flex-1 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors"
                      >
                        Mark as Won
                      </button>
                      <button
                        onClick={() => markBetAs(bet._id, 'lost')}
                        className="flex-1 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors"
                      >
                        Mark as Lost
                      </button>
                    </div>
                  )}

                  {/* Bet Summary */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getOptionIcon(bet.option)}
                      <span className="text-xs font-medium capitalize text-gray-600">
                        {bet.option}
                      </span>
                      {bet.correctAnswer !== undefined && bet.status !== 'pending' && (
                        <span className="text-xs text-gray-400">
                          (Correct: {bet.correctAnswer ? 'Yes' : 'No'})
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Bet Amount</p>
                      <p className="text-sm font-bold text-purple-600">₹{bet.betAmount}</p>
                    </div>
                  </div>

                  {/* Slip Title & Date */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="truncate max-w-[150px] sm:max-w-xs">
                      {bet.slipTitle}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(bet.createdAt)}</span>
                    </div>
                  </div>

                  {/* Original Status Indicator */}
                  {bet.originalStatus && bet.originalStatus !== bet.status && (
                    <div className="mt-1 text-xs text-gray-400">
                      Current in DB: {bet.originalStatus}
                    </div>
                  )}

                  {/* Expanded Details */}
                  {expandedBet === bet._id && (
                    <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
                      {/* Question */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Question:</p>
                        <p className="text-sm text-gray-800">{bet.question}</p>
                      </div>

                      {/* Bet Details Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-500">Multiplier</p>
                          <p className="text-sm font-bold text-purple-600">{bet.price}x</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-500">Return Amount</p>
                          <p className={`text-sm font-bold ${bet.status === 'won' ? 'text-green-600' : 'text-gray-600'}`}>
                            ₹{bet.returnAmount}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-500">Profit/Loss</p>
                          <p className={`text-sm font-bold ${
                            bet.status === 'won' ? 'text-green-600' : 
                            bet.status === 'lost' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {bet.status === 'won' ? `+₹{bet.returnAmount - bet.betAmount}` : 
                             bet.status === 'lost' ? `-₹{bet.betAmount}` : 
                             `₹{bet.potentialProfit}`}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-500">Bet ID</p>
                          <p className="text-xs font-mono text-gray-600 truncate">
                            {bet._id.slice(-8)}
                          </p>
                        </div>
                      </div>

                      {/* Correct Answer Info */}
                      {bet.correctAnswer !== undefined && (
                        <div className={`p-2 rounded-lg ${
                          bet.status === 'won' ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                          <p className="text-xs font-medium">
                            Correct Answer: {bet.correctAnswer ? 'Yes' : 'No'}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            User bet on: {bet.option === 'yes' ? 'Yes' : 'No'}
                          </p>
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
    </div>
  );
};

export default BetsPage;