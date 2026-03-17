// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, Mail, Phone, Wallet, Calendar, 
  TrendingUp, Trophy, History, ChevronDown, 
  ChevronUp, ThumbsUp, ThumbsDown, Clock,
  CheckCircle, XCircle, ArrowUpCircle, ArrowDownCircle,
  RefreshCw, Award, AlertCircle, Smartphone
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('bets');
  const [bets, setBets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedBet, setExpandedBet] = useState(null);
  const [expandedWithdrawal, setExpandedWithdrawal] = useState(null);
  const [stats, setStats] = useState({
    totalBets: 0,
    wonBets: 0,
    lostBets: 0,
    pendingBets: 0,
    totalWinnings: 0,
    totalWithdrawals: 0,
    pendingWithdrawals: 0,
    processingWithdrawals: 0,
    completedWithdrawals: 0,
    rejectedWithdrawals: 0
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all data in parallel
      const [betsResponse, transactionsResponse, withdrawalsResponse, answersResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/bets/my-bets', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/transactions', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/withdrawals/my-withdrawals', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/answers/public')
      ]);
      
      const betsData = betsResponse.data.bets || [];
      const answersData = answersResponse.data.answers || [];
      const withdrawalsData = withdrawalsResponse.data.withdrawals || [];
      
      console.log('✅ Fetched bets:', betsData.length);
      console.log('✅ Fetched public answers:', answersData.length);
      console.log('✅ Fetched withdrawals:', withdrawalsData.length);
      
      setAnswers(answersData);
      setWithdrawals(withdrawalsData);
      
      // Determine bet status based on answers
      const updatedBets = determineBetStatus(betsData, answersData);
      setBets(updatedBets);
      
      // Calculate bet stats
      const totalBets = updatedBets.length;
      const wonBets = updatedBets.filter(b => b.status === 'won');
      const lostBets = updatedBets.filter(b => b.status === 'lost');
      const pendingBets = updatedBets.filter(b => b.status === 'pending');
      
      const totalWinnings = wonBets.reduce((sum, bet) => sum + (bet.returnAmount || 0), 0);
      
      // Calculate withdrawal stats
      const pendingWithdrawals = withdrawalsData.filter(w => w.status === 'pending').length;
      const processingWithdrawals = withdrawalsData.filter(w => w.status === 'processing').length;
      const completedWithdrawals = withdrawalsData.filter(w => w.status === 'completed').length;
      const rejectedWithdrawals = withdrawalsData.filter(w => w.status === 'rejected').length;
      const totalWithdrawals = withdrawalsData.reduce((sum, w) => sum + (w.amount || 0), 0);
      
      setStats(prev => ({
        ...prev,
        totalBets,
        wonBets: wonBets.length,
        lostBets: lostBets.length,
        pendingBets: pendingBets.length,
        totalWinnings,
        totalWithdrawals,
        pendingWithdrawals,
        processingWithdrawals,
        completedWithdrawals,
        rejectedWithdrawals
      }));
      
      // Set transactions
      if (transactionsResponse.data.success) {
        setTransactions(transactionsResponse.data.transactions || []);
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const determineBetStatus = (betsData, answersData) => {
    // Create a map of questionId to correct answer from public answers
    const answerMap = {};
    answersData.forEach(answer => {
      answer.answers?.forEach(q => {
        answerMap[q.questionId] = {
          correctAnswer: q.answer,
          resolvedAt: answer.resolvedAt
        };
      });
    });

    console.log('📊 Answer map:', answerMap);

    // Update bet status based on correct answers
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
          resolvedAt: correctAnswerInfo.resolvedAt,
          correctAnswer: correctAnswerInfo.correctAnswer
        };
      }
      
      // Keep original status if no answer found
      return bet;
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const toggleExpand = (betId) => {
    setExpandedBet(expandedBet === betId ? null : betId);
  };

  const toggleWithdrawalExpand = (withdrawalId) => {
    setExpandedWithdrawal(expandedWithdrawal === withdrawalId ? null : withdrawalId);
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

  const getWithdrawalStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center space-x-1">
          <CheckCircle className="w-3 h-3" />
          <span>Completed</span>
        </span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center space-x-1">
          <XCircle className="w-3 h-3" />
          <span>Rejected</span>
        </span>;
      case 'processing':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center space-x-1">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Processing</span>
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

  // Filter bets
  const wonBets = bets.filter(bet => bet.status === 'won');
  const lostBets = bets.filter(bet => bet.status === 'lost');
  const pendingBets = bets.filter(bet => bet.status === 'pending');
  
  // Calculate total returns for won bets
  const totalWonReturns = wonBets.reduce((sum, bet) => sum + (bet.returnAmount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20 pb-10">
      <div className="max-w-4xl mx-auto px-3 sm:px-4">
        {/* Profile Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">My Profile</h1>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
            {/* Profile Avatar */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-r from-primary-600 to-primary-500 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl md:text-4xl font-bold shadow-lg">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Profile Details - Grid on mobile */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{user?.name}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm sm:text-base font-medium text-gray-900">{user?.phone}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Balance</p>
                  <p className="text-sm sm:text-base font-bold text-primary-600">₹{user?.walletBalance?.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg sm:col-span-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Member Since</p>
                  <p className="text-sm sm:text-base font-medium text-gray-900">
                    {new Date(user?.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats - Updated with withdrawal stats */}
          <div className="grid grid-cols-5 gap-1 sm:gap-4 mt-4 sm:mt-6 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-xs text-gray-500">Total Bets</p>
              <p className="text-sm sm:text-lg font-bold text-gray-900">{stats.totalBets}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Won</p>
              <p className="text-sm sm:text-lg font-bold text-green-600">{stats.wonBets}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Lost</p>
              <p className="text-sm sm:text-lg font-bold text-red-600">{stats.lostBets}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-sm sm:text-lg font-bold text-yellow-600">{stats.pendingBets}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Winnings</p>
              <p className="text-sm sm:text-lg font-bold text-purple-600">₹{stats.totalWinnings}</p>
            </div>
          </div>
          
          {/* Withdrawal Quick Stats */}
          {withdrawals.length > 0 && (
            <div className="grid grid-cols-4 gap-1 sm:gap-4 mt-3 pt-3 border-t border-gray-100">
              <div className="text-center">
                <p className="text-xs text-gray-500">Pending WD</p>
                <p className="text-sm font-bold text-yellow-600">{stats.pendingWithdrawals}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Processing</p>
                <p className="text-sm font-bold text-blue-600">{stats.processingWithdrawals}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Completed</p>
                <p className="text-sm font-bold text-green-600">{stats.completedWithdrawals}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Rejected</p>
                <p className="text-sm font-bold text-red-600">{stats.rejectedWithdrawals}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setActiveTab('bets')}
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'bets'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>All Bets ({bets.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('won')}
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'won'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Won ({wonBets.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'withdrawals'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <History className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Withdrawals ({withdrawals.length})</span>
          </button>
        </div>

        {/* Content based on active tab */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
          {loading && activeTab !== 'withdrawals' ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
          ) : activeTab === 'bets' && (
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">My Betting History</h2>
              {bets.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No bets placed yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bets.map((bet) => (
                    <div key={bet._id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="p-3 sm:p-4">
                        {/* Bet Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 mb-1">{bet.slipTitle}</p>
                            <p className="text-sm font-medium text-gray-900 truncate">{bet.question}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(bet.status)}
                            <button
                              onClick={() => toggleExpand(bet._id)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              {expandedBet === bet._id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Bet Summary */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getOptionIcon(bet.option)}
                            <span className="text-xs font-medium capitalize text-gray-600">{bet.option}</span>
                            {bet.correctAnswer !== undefined && bet.status !== 'pending' && (
                              <span className="text-xs text-gray-400">
                                (Correct: {bet.correctAnswer ? 'Yes' : 'No'})
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-purple-600">₹{bet.betAmount}</span>
                        </div>

                        {/* Date */}
                        <div className="mt-1 text-xs text-gray-400">
                          {formatDate(bet.createdAt)}
                          {bet.resolvedAt && ` • Resolved: ${formatDate(bet.resolvedAt)}`}
                        </div>

                        {/* Expanded Details */}
                        {expandedBet === bet._id && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-gray-50 p-2 rounded">
                                <p className="text-gray-500">Multiplier</p>
                                <p className="font-bold text-purple-600">{bet.price}x</p>
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <p className="text-gray-500">Return</p>
                                <p className={`font-bold ${bet.status === 'won' ? 'text-green-600' : 'text-gray-600'}`}>
                                  ₹{bet.returnAmount}
                                </p>
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <p className="text-gray-500">Profit/Loss</p>
                                <p className={`font-bold ${
                                  bet.status === 'won' ? 'text-green-600' : 
                                  bet.status === 'lost' ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {bet.status === 'won' ? `+₹{bet.returnAmount - bet.betAmount}` : 
                                   bet.status === 'lost' ? `-₹{bet.betAmount}` : 
                                   `₹{bet.potentialProfit}`}
                                </p>
                              </div>
                              <div className="bg-gray-50 p-2 rounded">
                                <p className="text-gray-500">Bet ID</p>
                                <p className="text-xs font-mono text-gray-600 truncate">
                                  {bet._id.slice(-8)}
                                </p>
                              </div>
                            </div>
                            
                            {bet.correctAnswer !== undefined && (
                              <div className={`mt-2 p-2 rounded-lg ${
                                bet.status === 'won' ? 'bg-green-50' : 'bg-red-50'
                              }`}>
                                <p className="text-xs">
                                  <span className="font-medium">Correct Answer: </span>
                                  {bet.correctAnswer ? 'Yes' : 'No'}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'won' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Won Bets</h2>
                <div className="flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-full">
                  <Award className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-bold text-green-600">Total: ₹{totalWonReturns}</span>
                </div>
              </div>
              
              {wonBets.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No won bets yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {wonBets.map((bet) => (
                    <div key={bet._id} className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 mb-1">{bet.slipTitle}</p>
                          <p className="text-sm font-medium text-gray-900">{bet.question}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-green-600 block">+₹{bet.returnAmount}</span>
                          <span className="text-xs text-gray-500">Return</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          {getOptionIcon(bet.option)}
                          <span className="capitalize font-medium">{bet.option}</span>
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-600">Bet: ₹{bet.betAmount}</span>
                          <span className="text-purple-600 font-medium">{bet.price}x</span>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                        <span>{formatDate(bet.createdAt)}</span>
                        <span className="text-green-600 font-medium">Profit: +₹{bet.returnAmount - bet.betAmount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'withdrawals' && (
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Withdrawal History</h2>
              {withdrawals.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No withdrawals yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {withdrawals.map((withdrawal) => (
                    <div key={withdrawal._id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="p-3 sm:p-4">
                        {/* Withdrawal Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <ArrowUpCircle className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Withdrawal</p>
                              <p className="text-xs text-gray-500">ID: {withdrawal.withdrawalId || withdrawal._id.slice(-8)}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getWithdrawalStatusBadge(withdrawal.status)}
                            <button
                              onClick={() => toggleWithdrawalExpand(withdrawal._id)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              {expandedWithdrawal === withdrawal._id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Amount and UPI */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Smartphone className="w-4 h-4 text-gray-500" />
                            <span className="text-xs font-medium text-gray-600">
                              {withdrawal.upiId || 'N/A'}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Amount</p>
                            <p className="text-sm font-bold text-purple-600">₹{withdrawal.amount}</p>
                          </div>
                        </div>

                        {/* Date */}
                        <div className="text-xs text-gray-400">
                          {formatDate(withdrawal.requestedAt || withdrawal.createdAt)}
                        </div>

                        {/* Expanded Details */}
                        {expandedWithdrawal === withdrawal._id && (
                          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                            {/* Processed Info */}
                            {withdrawal.processedAt && (
                              <div className="bg-gray-50 rounded-lg p-2">
                                <p className="text-xs text-gray-500">Processed On</p>
                                <p className="text-xs font-medium text-gray-700">
                                  {formatDate(withdrawal.processedAt)}
                                </p>
                              </div>
                            )}
                            
                            {/* Transaction ID */}
                            {withdrawal.transactionId && (
                              <div className="bg-gray-50 rounded-lg p-2">
                                <p className="text-xs text-gray-500">Transaction ID</p>
                                <p className="text-xs font-mono text-gray-700">{withdrawal.transactionId}</p>
                              </div>
                            )}
                            
                            {/* Rejection Reason */}
                            {withdrawal.rejectionReason && (
                              <div className="bg-red-50 rounded-lg p-2">
                                <p className="text-xs text-red-500">Rejection Reason</p>
                                <p className="text-xs text-red-700">{withdrawal.rejectionReason}</p>
                              </div>
                            )}
                            
                            {/* Notes */}
                            {withdrawal.notes && (
                              <div className="bg-gray-50 rounded-lg p-2">
                                <p className="text-xs text-gray-500">Notes</p>
                                <p className="text-xs text-gray-700">{withdrawal.notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;