// src/pages/WalletPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Wallet, ArrowUpCircle, ArrowDownCircle, History, 
  Plus, Minus, XCircle, CheckCircle, Award, TrendingUp,
  RefreshCw, Trophy, Smartphone, Copy, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import StripePaymentModal from '../components/StripePaymentModal';

const WalletPage = () => {
  const { user, refreshUserData } = useAuth();
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showStripePayment, setShowStripePayment] = useState(false);
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [confirmUpiId, setConfirmUpiId] = useState('');
  const [upiError, setUpiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Transaction history
  const [transactions, setTransactions] = useState([]);
  const [bets, setBets] = useState([]);
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalTransactions: 0,
    totalWinnings: 0,
    totalWithdrawals: 0,
    totalDeposits: 0
  });

  useEffect(() => {
    console.log('👤 Current user from AuthContext:', user);
    console.log('👤 User email:', user?.email);
    console.log('👤 User ID:', user?._id);
    fetchData();
  }, []);

  // Refresh data when user balance changes
  useEffect(() => {
    if (user) {
      console.log('💰 User balance updated:', user.walletBalance);
      setStats(prev => ({
        ...prev,
        totalBalance: user.walletBalance || 0
      }));
    }
  }, [user?.walletBalance]);

  const fetchData = async () => {
    console.log('📡 Fetching wallet data...');
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token exists:', !!token);
      
      if (!token) {
        console.error('❌ No token found');
        toast.error('Please login again');
        return;
      }

      console.log('📡 Fetching transactions and bets in parallel...');
      
      // Fetch transactions and won bets in parallel
      const [transactionsResponse, betsResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/transactions', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/bets/my-bets', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      console.log('📦 Transactions response:', transactionsResponse.data);
      console.log('📦 Bets response:', betsResponse.data);
      
      // Process transactions
      if (transactionsResponse.data.success) {
        console.log('✅ Transactions fetched successfully:', transactionsResponse.data.transactions?.length || 0);
        const formattedTransactions = transactionsResponse.data.transactions.map(t => ({
          id: t._id,
          type: t.type,
          amount: t.amount,
          description: t.description,
          date: new Date(t.createdAt),
          status: t.status,
          paymentMethod: t.paymentMethod,
          reference: t.reference
        }));
        setTransactions(formattedTransactions);
        console.log('📝 Formatted transactions:', formattedTransactions);
      } else {
        console.warn('⚠️ Transactions response not successful:', transactionsResponse.data);
      }
      
      // Process bets to get won bets
      if (betsResponse.data.success) {
        const allBets = betsResponse.data.bets || [];
        console.log('🎲 All bets fetched:', allBets.length);
        console.log('🎲 Raw bets data:', allBets);
        
        // Log each bet's status
        allBets.forEach((bet, index) => {
          console.log(`🎲 Bet ${index + 1}:`, {
            id: bet._id,
            status: bet.status,
            returnAmount: bet.returnAmount,
            question: bet.question?.substring(0, 30),
            option: bet.option
          });
        });
        
        const wonBets = allBets.filter(b => b.status === 'won');
        console.log('🏆 Won bets found:', wonBets.length);
        console.log('🏆 Won bets details:', wonBets);
        
        setBets(wonBets);
        
        // Calculate total winnings from won bets
        const totalWinnings = wonBets.reduce((sum, bet) => {
          console.log(`💰 Adding bet return: ${bet.returnAmount} to sum: ${sum}`);
          return sum + (bet.returnAmount || 0);
        }, 0);
        
        console.log('💰 Total winnings calculated:', totalWinnings);
        
        // Update stats with winnings
        setStats(prev => {
          const newStats = {
            ...prev,
            totalWinnings: totalWinnings
          };
          console.log('📊 Updated stats:', newStats);
          return newStats;
        });
      } else {
        console.warn('⚠️ Bets response not successful:', betsResponse.data);
      }
      
      // Calculate other stats
      calculateStats(transactionsResponse.data.transactions || []);
      
    } catch (error) {
      console.error('❌ Failed to fetch data:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error('Failed to load wallet data');
    }
  };

  const calculateStats = (transactionsData) => {
    console.log('📊 Calculating stats from transactions:', transactionsData.length);
    
    // Calculate total deposits (credits from Stripe)
    const deposits = transactionsData
      .filter(t => t.type === 'credit' && t.paymentMethod === 'Stripe' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate total withdrawals
    const withdrawals = transactionsData
      .filter(t => t.type === 'debit' && t.paymentMethod === 'UPI' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
    
    console.log('💰 Deposits calculated:', deposits);
    console.log('💰 Withdrawals calculated:', withdrawals);
    
    setStats(prev => {
      const newStats = {
        ...prev,
        totalTransactions: transactionsData.length + bets.length,
        totalWithdrawals: withdrawals,
        totalDeposits: deposits
      };
      console.log('📊 Final stats:', newStats);
      return newStats;
    });
  };

  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshing(true);
    await refreshUserData(); // Refresh user data from backend
    await fetchData(); // Refresh transactions
    setRefreshing(false);
    toast.success('Wallet updated');
  };

  const formatWalletBalance = (balance) => {
    return balance?.toFixed(2) || '0.00';
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

  const handleAddMoneyClick = () => {
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    const minAmount = 50;
    if (parseFloat(amount) < minAmount) {
      toast.error(`Minimum amount is ₹${minAmount}`);
      return;
    }
    
    setShowAddMoney(false);
    setShowStripePayment(true);
  };

  // Validate UPI ID format
  const validateUpiId = (upi) => {
    // Basic UPI validation: something@provider
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    return upiRegex.test(upi);
  };

  // Handle UPI ID change
  const handleUpiChange = (e) => {
    const value = e.target.value;
    setUpiId(value);
    if (value && !validateUpiId(value)) {
      setUpiError('Please enter a valid UPI ID (e.g., name@bank)');
    } else {
      setUpiError('');
    }
  };

  // Handle confirm UPI change
  const handleConfirmUpiChange = (e) => {
    const value = e.target.value;
    setConfirmUpiId(value);
    if (upiId && value && upiId !== value) {
      setUpiError('UPI IDs do not match');
    } else if (value && !validateUpiId(value)) {
      setUpiError('Please enter a valid UPI ID');
    } else {
      setUpiError('');
    }
  };

  // Updated handleWithdraw function with UPI ID and wallet deduction
  const handleWithdraw = async () => {
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const minWithdrawAmount = 100;
    if (parseFloat(amount) < minWithdrawAmount) {
      toast.error(`Minimum withdrawal amount is ₹${minWithdrawAmount}`);
      return;
    }

    if (parseFloat(amount) > user.walletBalance) {
      toast.error('Insufficient balance');
      return;
    }

    if (!upiId) {
      toast.error('Please enter your UPI ID');
      return;
    }

    if (!validateUpiId(upiId)) {
      toast.error('Please enter a valid UPI ID');
      return;
    }

    if (upiId !== confirmUpiId) {
      toast.error('UPI IDs do not match');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const withdrawalData = {
        amount: parseFloat(amount),
        method: 'UPI',
        upiId: upiId,
        bankDetails: {
          upiId: upiId
        }
      };

      console.log('📤 Processing withdrawal:', withdrawalData);
      
      const response = await axios.post('http://localhost:5000/api/withdrawals', 
        withdrawalData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('📥 Withdrawal response:', response.data);
      
      if (response.data.success) {
        // Refresh user data to get updated balance
        await refreshUserData();
        await fetchData();
        
        toast.success(`₹${amount} withdrawal request submitted successfully!`);
        
        // Reset form
        setShowWithdraw(false);
        setAmount('');
        setUpiId('');
        setConfirmUpiId('');
        setUpiError('');
        
        // Show success message with details
        toast.success(`Amount will be sent to UPI: ${upiId} within 24-48 hours`);
      }
    } catch (error) {
      console.error('❌ Withdrawal error:', error);
      
      // Check if error is due to insufficient balance
      if (error.response?.status === 400 && error.response?.data?.message.includes('Insufficient')) {
        toast.error('Insufficient balance');
      } else {
        toast.error(error.response?.data?.message || 'Failed to process withdrawal');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    refreshUserData(); // Refresh user data
    fetchData(); // Refresh transactions
    setAmount('');
    toast.success('Payment completed successfully!');
    setShowStripePayment(false);
  };

  const handlePaymentFailure = (errorMessage) => {
    toast.error(errorMessage || 'Payment failed');
    setShowStripePayment(false);
    setAmount('');
  };

  // Combine and sort all transactions (including won bets)
  const allTransactions = [
    // Regular transactions
    ...transactions.map(t => ({
      ...t,
      transactionType: 'regular'
    })),
    // Won bets as credit transactions
    ...bets.map(bet => ({
      id: `bet_${bet._id}`,
      type: 'credit',
      amount: bet.returnAmount,
      description: `🏆 Won Bet: ${bet.question?.substring(0, 50)}...`,
      date: new Date(bet.resolvedAt || bet.createdAt),
      status: 'completed',
      paymentMethod: 'Winnings',
      transactionType: 'bet',
      betDetails: bet
    }))
  ].sort((a, b) => b.date - a.date); // Sort by date descending

  console.log('📋 All transactions combined:', allTransactions);
  console.log('🏆 Current bets state:', bets);
  console.log('📊 Current stats state:', stats);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Header with Refresh */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Wallet</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your funds and track your winnings</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 text-primary-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Wallet Balance Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-gradient-to-br from-primary-100 to-primary-50 rounded-full -mr-24 sm:-mr-32 -mt-24 sm:-mt-32 opacity-50"></div>
          
          <div className="relative">
            {/* Header with Balance and Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Total Balance</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">₹{formatWalletBalance(user?.walletBalance)}</p>
                </div>
              </div>
              
              {/* Buttons */}
              <div className="flex space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setShowAddMoney(true);
                    setShowWithdraw(false);
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-1 sm:space-x-2 bg-green-500 text-white px-2 sm:px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Add</span>
                </button>
                <button
                  onClick={() => {
                    setShowWithdraw(true);
                    setShowAddMoney(false);
                    // Reset UPI fields when opening modal
                    setUpiId('');
                    setConfirmUpiId('');
                    setUpiError('');
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-1 sm:space-x-2 bg-blue-500 text-white px-2 sm:px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm sm:text-base"
                >
                  <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Withdraw (Min ₹100)</span>
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-1 sm:gap-4 mt-4 sm:mt-6">
              <div className="bg-gray-50 rounded-lg p-2 sm:p-4">
                <p className="text-xs text-gray-500">Balance</p>
                <p className="text-sm sm:text-xl font-semibold text-gray-900 truncate">
                  ₹{formatWalletBalance(user?.walletBalance)}
                </p>
              </div>
              
              {/* Winnings Box */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-2 sm:p-4 border border-green-200">
                <p className="text-xs text-gray-500 flex items-center">
                  <Trophy className="w-3 h-3 text-green-600 mr-1" />
                  Total Winnings
                </p>
                <p className="text-sm sm:text-xl font-bold text-green-600 truncate">
                  ₹{stats.totalWinnings}
                </p>
                <p className="text-[10px] text-green-500 mt-0.5">
                  From {bets.length} won {bets.length === 1 ? 'bet' : 'bets'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-2 sm:p-4">
                <p className="text-xs text-gray-500">Deposits</p>
                <p className="text-sm sm:text-xl font-semibold text-purple-600 truncate">
                  ₹{stats.totalDeposits}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 sm:p-4">
                <p className="text-xs text-gray-500">Withdrawals</p>
                <p className="text-sm sm:text-xl font-semibold text-blue-600 truncate">
                  ₹{stats.totalWithdrawals}
                </p>
              </div>
            </div>

            {/* Winnings Info */}
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Winning History</span>
                </div>
                <span className="text-xs bg-green-200 text-green-700 px-2 py-1 rounded-full">
                  {bets.length} Wins
                </span>
              </div>
              
              {/* Show recent wins */}
              {bets.length > 0 ? (
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {bets.slice(0, 3).map((bet, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 truncate max-w-[150px]">
                        {bet.question?.substring(0, 30)}...
                      </span>
                      <span className="font-bold text-green-600">+₹{bet.returnAmount}</span>
                    </div>
                  ))}
                  {bets.length > 3 && (
                    <p className="text-xs text-gray-400 text-center mt-1">
                      +{bets.length - 3} more wins
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-2">
                  No winning bets yet
                </p>
              )}
              
              <div className="mt-2 pt-2 border-t border-green-200 flex items-center justify-between text-xs">
                <span className="text-gray-600">Total Winnings:</span>
                <span className="font-bold text-green-600">₹{stats.totalWinnings}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Add Money Modal */}
        {showAddMoney && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-md p-4 sm:p-6 animate-slide-up mx-auto">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Add Money to Wallet</h3>
              
              <div className="mb-3 sm:mb-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Amount (₹) - Min ₹50
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="50"
                    step="1"
                    className="w-full pl-8 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-3 sm:mb-4">
                {[100, 500, 1000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset)}
                    className="py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
                <button
                  onClick={() => {
                    setShowAddMoney(false);
                    setAmount('');
                  }}
                  className="w-full sm:flex-1 bg-gray-100 text-gray-700 py-2 sm:py-3 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMoneyClick}
                  className="w-full sm:flex-1 bg-green-500 text-white py-2 sm:py-3 rounded-lg hover:bg-green-600 transition-colors text-sm sm:text-base"
                >
                  Continue to Payment
                </button>
              </div>

              <p className="text-center text-xs text-gray-500 mt-3 sm:mt-4">
                Min: ₹50 • Powered by Stripe
              </p>
            </div>
          </div>
        )}

        {/* Stripe Payment Modal */}
        <StripePaymentModal
          isOpen={showStripePayment}
          onClose={() => {
            setShowStripePayment(false);
            setAmount('');
          }}
          amount={amount}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
        />

        {/* Withdraw Modal - Updated with UPI ID field */}
        {showWithdraw && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-md p-4 sm:p-6 animate-slide-up mx-auto">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Withdraw Money to UPI</h3>
              
              <div className="mb-3 sm:mb-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Amount (₹) - Min ₹100
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="100"
                    max={user?.walletBalance}
                    step="1"
                    className="w-full pl-8 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Available: ₹{formatWalletBalance(user?.walletBalance)} • Minimum: ₹100
                </p>
              </div>

              {/* UPI ID Input */}
              <div className="mb-3 sm:mb-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  UPI ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={upiId}
                    onChange={handleUpiChange}
                    placeholder="e.g., yourname@okhdfcbank"
                    className="w-full pl-9 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Enter your UPI ID (e.g., name@bank)
                </p>
              </div>

              {/* Confirm UPI ID */}
              <div className="mb-3 sm:mb-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Confirm UPI ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={confirmUpiId}
                    onChange={handleConfirmUpiChange}
                    placeholder="Re-enter your UPI ID"
                    className="w-full pl-9 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                {upiError && (
                  <p className="text-xs text-red-500 mt-1">{upiError}</p>
                )}
              </div>

              {/* Preset Amounts */}
              <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-3 sm:mb-4">
                {[100, 500, 1000, 2000, 5000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset)}
                    disabled={preset > user?.walletBalance}
                    className="py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>

              {/* User Info Summary */}
              <div className="mb-3 p-3 bg-gray-50 rounded-lg text-xs">
                <p className="font-medium text-gray-700 mb-1">Withdrawal Details:</p>
                <p className="text-gray-600">Name: {user?.name}</p>
                <p className="text-gray-600">Email: {user?.email}</p>
                <p className="text-gray-600">Phone: {user?.phone}</p>
                <p className="text-gray-600">UPI ID: {upiId || 'Not entered'}</p>
                <p className="text-gray-600">Amount: ₹{amount || '0'}</p>
                <p className="text-xs text-red-500 mt-1">
                  This amount will be deducted from your wallet balance immediately.
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
                <button
                  onClick={() => {
                    setShowWithdraw(false);
                    setAmount('');
                    setUpiId('');
                    setConfirmUpiId('');
                    setUpiError('');
                  }}
                  className="w-full sm:flex-1 bg-gray-100 text-gray-700 py-2 sm:py-3 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={loading || !amount || parseFloat(amount) < 100 || parseFloat(amount) > user?.walletBalance || !upiId || !confirmUpiId || upiId !== confirmUpiId || !validateUpiId(upiId)}
                  className="w-full sm:flex-1 bg-blue-500 text-white py-2 sm:py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    'Request Withdrawal'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-3 sm:p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Transaction History</h2>
            </div>
            <span className="text-xs text-gray-500">
              {allTransactions.length} transactions
            </span>
          </div>

          {/* Transaction List */}
          <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto pr-1">
            {allTransactions.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <History className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm text-gray-500">No transactions yet</p>
              </div>
            ) : (
              allTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-4 rounded-lg transition-colors ${
                    transaction.transactionType === 'bet' 
                      ? 'bg-green-50 hover:bg-green-100 border-l-4 border-green-500' 
                      : transaction.status === 'failed' 
                        ? 'bg-red-50 hover:bg-red-100 border-l-4 border-red-500' 
                        : transaction.type === 'credit'
                          ? 'bg-green-50 hover:bg-green-100 border-l-4 border-green-300'
                          : 'bg-red-50 hover:bg-red-100 border-l-4 border-red-300'
                  }`}
                >
                  {/* Left section */}
                  <div className="flex items-start space-x-2 sm:space-x-3 mb-2 sm:mb-0">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      transaction.transactionType === 'bet'
                        ? 'bg-green-200'
                        : transaction.status === 'failed' 
                          ? 'bg-red-200' 
                          : transaction.type === 'credit' 
                            ? 'bg-green-100' 
                            : 'bg-red-100'
                    }`}>
                      {transaction.transactionType === 'bet' ? (
                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-green-700" />
                      ) : transaction.status === 'failed' ? (
                        <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                      ) : transaction.type === 'credit' ? (
                        <ArrowDownCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      ) : (
                        <ArrowUpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                      )}
                    </div>
                    
                    {/* Transaction details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-900">
                          {transaction.description}
                        </p>
                        {transaction.transactionType === 'bet' && (
                          <span className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-green-200 text-green-700 rounded-full">
                            Winnings Added
                          </span>
                        )}
                        {transaction.paymentMethod === 'Winnings' && (
                          <span className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-yellow-200 text-yellow-700 rounded-full">
                            +₹{transaction.amount}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-500">
                        {formatDate(transaction.date)}
                      </p>
                      {transaction.paymentMethod && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {transaction.paymentMethod}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right section - Amount */}
                  <div className="flex items-center justify-between sm:justify-end sm:space-x-3 ml-10 sm:ml-0">
                    <p className={`text-xs sm:text-sm font-bold ${
                      transaction.type === 'credit' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {transaction.type === 'credit' ? '+' : '-'} ₹{transaction.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary */}
          {allTransactions.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
              <p className="flex items-center justify-between">
                <span>Total Winnings Added:</span>
                <span className="font-bold text-green-600">+₹{stats.totalWinnings}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletPage;