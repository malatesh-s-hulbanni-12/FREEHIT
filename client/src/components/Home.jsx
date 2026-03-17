import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Shield, Zap, Globe, Users, ArrowRight, Star, 
  ThumbsUp, ThumbsDown, Wallet, X, AlertCircle,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const [showBetModal, setShowBetModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [userBalance, setUserBalance] = useState(user?.walletBalance || 0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchActiveSlips();
  }, []);

  useEffect(() => {
    if (user) {
      setUserBalance(user.walletBalance);
    }
  }, [user]);

  useEffect(() => {
  const token = localStorage.getItem('token');
  console.log('🔐 User logged in?', !!token);
  console.log('🔐 Token exists:', token ? 'Yes' : 'No');
  
  if (token) {
    console.log('🔐 Token preview:', token.substring(0, 20) + '...');
  }
  
  fetchActiveSlips();
}, []);

  const fetchActiveSlips = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 Fetching active slips from server...');
      const response = await axios.get('http://localhost:5000/api/slips/active');
      
      console.log('📦 Server response:', response.data);
      
      if (response.data.success) {
        const slipsData = response.data.slips || [];
        console.log('✅ Received slips:', slipsData.length);
        
        // Log each slip's structure for debugging
        slipsData.forEach((slip, index) => {
          console.log(`Slip ${index + 1}:`, {
            id: slip._id,
            title: slip.title,
            questionsCount: slip.questions?.length || 0,
            questions: slip.questions
          });
        });
        
        setSlips(slipsData);
        
        if (slipsData.length === 0) {
          setError('No active slips available');
        }
      } else {
        setError('Failed to load slips');
      }
    } catch (error) {
      console.error('❌ Failed to fetch slips:', error);
      setError(error.message);
      toast.error('Failed to load active slips');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActiveSlips();
  };

  const debugDatabase = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/slips/debug');
      console.log('🔍 Database Debug Info:', response.data);
      toast.success('Check console for debug info');
      
      // Show alert with basic info
      alert(`
        Total Slips: ${response.data.totalSlips}
        Active Slips: ${response.data.activeSlips}
        Check console for full details
      `);
    } catch (error) {
      console.error('Debug error:', error);
      toast.error('Debug failed');
    }
  };

  useEffect(() => {
    window.debug = debugDatabase;
  }, []);

  const handleOptionClick = (slip, question, option, price) => {
    if (!isAuthenticated) {
      toast.error('Please login to place bets');
      return;
    }
    
    console.log('Selected:', { slip, question, option, price });
    
    setSelectedSlip(slip);
    setSelectedQuestion(question);
    setSelectedOption({ type: option, price });
    setBetAmount('');
    setShowBetModal(true);
  };

  const calculateReturn = () => {
    const amount = parseFloat(betAmount) || 0;
    const multiplier = selectedOption?.price || 0;
    return amount * multiplier;
  };

  const handlePlaceBet = async () => {
  if (!betAmount || betAmount < 10) {
    toast.error('Minimum bet amount is ₹10');
    return;
  }

  if (parseFloat(betAmount) > userBalance) {
    toast.error('Insufficient balance');
    return;
  }

  setProcessing(true);

  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      toast.error('Please login first');
      setProcessing(false);
      return;
    }

    const returnAmount = calculateReturn();

    const betData = {
      slipId: selectedSlip._id,
      slipTitle: selectedSlip.title,
      questionId: selectedQuestion._id,
      question: selectedQuestion.question,
      option: selectedOption.type,
      price: selectedOption.price,
      betAmount: parseFloat(betAmount),
      returnAmount: returnAmount,
      potentialProfit: returnAmount - parseFloat(betAmount)
    };

    console.log('📤 Sending bet data:', betData);

    const response = await axios.post(
      'http://localhost:5000/api/bets',
      betData,
      { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    );

    console.log('📥 Response:', response.data);
    
    if (response.data.success) {
      toast.success(`Bet placed successfully! Potential return: ₹${returnAmount}`);
      setShowBetModal(false);
      
      // Update local balance
      const newBalance = response.data.newBalance || (userBalance - parseFloat(betAmount));
      setUserBalance(newBalance);
      
      // Update user object in auth context
      if (user) {
        user.walletBalance = newBalance;
      }
      
      // Refresh user data from server to update wallet page
      if (refreshUserData) {
        await refreshUserData();
      }
    }
  } catch (error) {
    console.error('❌ Failed to place bet:', error);
    
    if (error.response?.status === 401) {
      toast.error('Session expired. Please login again.');
      localStorage.removeItem('token');
      window.location.href = '/';
    } else {
      toast.error(error.response?.data?.message || 'Failed to place bet');
    }
  } finally {
    setProcessing(false);
  }
};

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Lightning Fast',
      description: 'Experience blazing fast performance with our optimized platform'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Secure',
      description: 'Your data is protected with enterprise-grade security'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Global Access',
      description: 'Access your account from anywhere in the world'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Community',
      description: 'Join thousands of satisfied users worldwide'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Business Owner',
      content: 'This platform has transformed how I manage my business. Incredible features!',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Developer',
      content: 'The best user experience I have ever had. Highly recommended!',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Designer',
      content: 'Outstanding service and support. The team really cares about their users.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                FreeHit
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Experience the future of digital services with our cutting-edge platform. 
              Secure, fast, and designed for you.
            </p>
            {!isAuthenticated && (
              <div className="flex justify-center space-x-4">
                <button className="bg-gradient-to-r from-primary-600 to-primary-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-primary-700 hover:to-primary-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                  Get Started
                </button>
                <button className="bg-white text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-md border border-gray-200">
                  Learn More
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">10K+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">50K+</div>
              <div className="text-gray-600">Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">24/7</div>
              <div className="text-gray-600">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Debug Tools - Development Only */}
      {process.env.NODE_ENV === 'development' && (
        <div className="max-w-7xl mx-auto px-4 mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">Debug Mode</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={debugDatabase}
                  className="text-xs bg-blue-200 px-3 py-1 rounded hover:bg-blue-300"
                >
                  Check Database
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="text-xs bg-blue-200 px-3 py-1 rounded hover:bg-blue-300 flex items-center space-x-1"
                >
                  <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Slips/Bets Section - Only visible when logged in */}
      {isAuthenticated && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 to-primary-100">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Active Slips</h2>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <RefreshCw className={`w-5 h-5 text-primary-600 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                  <Wallet className="w-5 h-5 text-primary-600" />
                  <span className="font-bold text-primary-700">₹{userBalance}</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                <p className="text-gray-700 mb-2">{error}</p>
                <button
                  onClick={fetchActiveSlips}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Try Again
                </button>
              </div>
            ) : slips.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <p className="text-gray-500 mb-2">No active slips available</p>
                <p className="text-sm text-gray-400">
                  Check back later for new betting opportunities
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {slips.map((slip) => (
                  <div key={slip._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="p-4 sm:p-6">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{slip.title}</h3>
                      <p className="text-sm sm:text-base text-gray-600 mb-4">{slip.description}</p>
                      
                      <div className="space-y-4">
                        {slip.questions && slip.questions.length > 0 ? (
                          slip.questions.map((question, qIndex) => (
                            <div key={qIndex} className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
                              <p className="text-sm font-medium text-gray-700 mb-3">{question.question}</p>
                              
                              <div className="flex flex-col sm:flex-row gap-2">
                                {/* Yes Button */}
                                <button
                                  onClick={() => handleOptionClick(slip, question, 'yes', question.yesPrice)}
                                  className="flex-1 flex items-center justify-between px-4 py-3 bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-lg transition-all group"
                                >
                                  <div className="flex items-center space-x-2">
                                    <ThumbsUp className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-700">Yes</span>
                                  </div>
                                  <span className="text-sm font-bold text-green-600">₹{question.yesPrice}</span>
                                </button>

                                {/* No Button */}
                                <button
                                  onClick={() => handleOptionClick(slip, question, 'no', question.noPrice)}
                                  className="flex-1 flex items-center justify-between px-4 py-3 bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-lg transition-all group"
                                >
                                  <div className="flex items-center space-x-2">
                                    <ThumbsDown className="w-4 h-4 text-red-600" />
                                    <span className="text-sm font-medium text-red-700">No</span>
                                  </div>
                                  <span className="text-sm font-bold text-red-600">₹{question.noPrice}</span>
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No questions available for this slip
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Bet Modal */}
      {showBetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6 animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Place Your Bet</h3>
              <button
                onClick={() => setShowBetModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Question */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Question:</p>
              <p className="text-sm font-medium text-gray-900">{selectedQuestion?.question}</p>
            </div>

            {/* Selected Option */}
            <div className="mb-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                {selectedOption?.type === 'yes' ? (
                  <ThumbsUp className="w-4 h-4 text-green-600" />
                ) : (
                  <ThumbsDown className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm font-medium capitalize">{selectedOption?.type}</span>
              </div>
              <span className="text-sm font-bold text-purple-600">{selectedOption?.price}x</span>
            </div>

            {/* Bet Amount Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Amount (Min ₹10)
              </label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                min="10"
                step="1"
                placeholder="Enter amount"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            {/* Return Calculation */}
            {betAmount >= 10 && (
              <div className="mb-6 p-3 bg-primary-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Bet Amount:</span>
                  <span className="text-sm font-bold">₹{parseFloat(betAmount) || 0}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Multiplier:</span>
                  <span className="text-sm font-bold">{selectedOption?.price}x</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-primary-200">
                  <span className="text-sm font-medium text-gray-700">Potential Return:</span>
                  <span className="text-lg font-bold text-primary-600">₹{calculateReturn()}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:space-x-3 space-y-2 space-y-reverse sm:space-y-0">
              <button
                onClick={() => setShowBetModal(false)}
                className="w-full sm:flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handlePlaceBet}
                disabled={processing || betAmount < 10}
                className="w-full sm:flex-1 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-700 hover:to-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {processing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Place Bet'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Us?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-primary-100 to-primary-200 rounded-lg flex items-center justify-center text-primary-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            What Our Users Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of satisfied users today and experience the difference.
            </p>
            <button className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-primary-700 hover:to-primary-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
              <span>Create Your Account</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;