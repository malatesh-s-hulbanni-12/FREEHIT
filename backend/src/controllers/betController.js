import Bet from '../models/Bet.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

// @desc    Place a new bet
// @route   POST /api/bets
// @access  Private
export const placeBet = async (req, res) => {
  try {
    console.log('🎲 Placing bet for user:', req.user.id);
    
    const {
      slipId,
      slipTitle,
      questionId,
      question,
      option,
      price,
      betAmount,
      returnAmount,
      potentialProfit
    } = req.body;

    // Validate required fields
    if (!slipId || !questionId || !option || !betAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate bet amount
    if (betAmount < 10) {
      return res.status(400).json({
        success: false,
        message: 'Minimum bet amount is ₹10'
      });
    }

    // Check if user exists
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check user balance
    if (user.walletBalance < betAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ₹${user.walletBalance}`
      });
    }

    // Start a session for transaction
    const session = await Bet.startSession();
    session.startTransaction();

    try {
      // Deduct bet amount from wallet
      const previousBalance = user.walletBalance;
      user.walletBalance -= betAmount;
      await user.save({ session });
      
      console.log(`💰 Balance updated: ₹${previousBalance} -> ₹${user.walletBalance} (deducted ₹${betAmount})`);

      // Create bet record
      const bet = await Bet.create([{
        userId: req.user.id,
        userEmail: user.email,
        userName: user.name,
        slipId,
        slipTitle,
        questionId,
        question,
        option,
        price,
        betAmount,
        returnAmount,
        potentialProfit,
        status: 'pending'
      }], { session });

      // Create transaction record for wallet
      await Transaction.create([{
        userId: req.user.id,
        type: 'debit',
        amount: betAmount,
        description: `Bet placed on: ${question.substring(0, 50)}${question.length > 50 ? '...' : ''}`,
        paymentMethod: 'Wallet',
        status: 'completed',
        reference: bet[0]._id,
        referenceType: 'bet'
      }], { session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      console.log('✅ Bet placed successfully:', bet[0]._id);

      res.status(201).json({
        success: true,
        message: 'Bet placed successfully',
        bet: bet[0],
        newBalance: user.walletBalance
      });
    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('❌ Place bet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to place bet',
      error: error.message
    });
  }
};

// @desc    Get user's bet history
// @route   GET /api/bets/my-bets
// @access  Private
export const getMyBets = async (req, res) => {
  try {
    const bets = await Bet.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    // Calculate statistics
    const stats = {
      totalBets: bets.length,
      totalWagered: bets.reduce((sum, bet) => sum + bet.betAmount, 0),
      pendingBets: bets.filter(b => b.status === 'pending').length,
      wonBets: bets.filter(b => b.status === 'won').length,
      lostBets: bets.filter(b => b.status === 'lost').length,
      totalWinnings: bets
        .filter(b => b.status === 'won')
        .reduce((sum, bet) => sum + bet.returnAmount, 0)
    };

    res.status(200).json({
      success: true,
      count: bets.length,
      stats,
      bets
    });
  } catch (error) {
    console.error('Get bets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bets',
      error: error.message
    });
  }
};

// @desc    Get all bets (admin only)
// @route   GET /api/bets/all
// @access  Private/Admin
export const getAllBets = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, userId } = req.query;
    
    // Build query
    const query = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;

    const bets = await Bet.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Bet.countDocuments(query);

    // Calculate overall statistics
    const allBets = await Bet.find();
    const stats = {
      totalBets: allBets.length,
      totalWagered: allBets.reduce((sum, bet) => sum + bet.betAmount, 0),
      pendingBets: allBets.filter(b => b.status === 'pending').length,
      wonBets: allBets.filter(b => b.status === 'won').length,
      lostBets: allBets.filter(b => b.status === 'lost').length,
      totalPayout: allBets
        .filter(b => b.status === 'won')
        .reduce((sum, bet) => sum + bet.returnAmount, 0)
    };

    res.status(200).json({
      success: true,
      count: bets.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      stats,
      bets
    });
  } catch (error) {
    console.error('Get all bets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bets',
      error: error.message
    });
  }
};

// @desc    Update bet status (admin only)
// @route   PUT /api/bets/:id
// @access  Private/Admin
export const updateBetStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const betId = req.params.id;
    
    console.log('=================================');
    console.log('🎯 UPDATE BET STATUS CALLED');
    console.log('=================================');
    console.log('📝 Request params:', { betId });
    console.log('📝 Request body:', { status });
    console.log('📝 Admin user:', req.user?.email);
    
    if (!['pending', 'won', 'lost'].includes(status)) {
      console.log('❌ Invalid status:', status);
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    console.log('🔍 Finding bet with ID:', betId);
    const bet = await Bet.findById(betId).populate('userId');
    
    if (!bet) {
      console.log('❌ Bet not found for ID:', betId);
      return res.status(404).json({
        success: false,
        message: 'Bet not found'
      });
    }

    console.log('✅ Bet found:', {
      betId: bet._id,
      currentStatus: bet.status,
      newStatus: status,
      userId: bet.userId?._id,
      userEmail: bet.userId?.email,
      betAmount: bet.betAmount,
      returnAmount: bet.returnAmount,
      option: bet.option,
      question: bet.question?.substring(0, 30)
    });

    // If bet is being marked as won, credit the winnings to user's wallet
    if (status === 'won' && bet.status !== 'won') {
      console.log('💰 Processing WIN for bet:', betId);
      console.log('👤 Finding user with ID:', bet.userId?._id);
      
      const user = await User.findById(bet.userId._id);
      
      if (!user) {
        console.log('❌ User not found for ID:', bet.userId?._id);
        return res.status(404).json({
          success: false,
          message: 'User not found for wallet credit'
        });
      }

      console.log('✅ User found:', {
        userId: user._id,
        email: user.email,
        currentBalance: user.walletBalance,
        returnAmount: bet.returnAmount
      });

      // Store previous balance for logging
      const previousBalance = user.walletBalance;
      
      // Credit the winnings
      user.walletBalance += bet.returnAmount;
      await user.save();

      console.log('💰 Wallet credited successfully:', {
        previousBalance,
        creditedAmount: bet.returnAmount,
        newBalance: user.walletBalance
      });

      // Create transaction record for winnings - using 'Bonus' instead of 'Winnings'
      const transaction = await Transaction.create({
        userId: user._id,
        type: 'credit',
        amount: bet.returnAmount,
        description: `🏆 Won bet: ${bet.question.substring(0, 50)}...`,
        paymentMethod: 'Bonus', // Changed from 'Winnings' to 'Bonus'
        status: 'completed',
        reference: bet._id,
        referenceType: 'bet'
      });

      console.log('📝 Transaction created:', {
        transactionId: transaction._id,
        amount: transaction.amount,
        type: transaction.type,
        paymentMethod: transaction.paymentMethod
      });
    } else {
      console.log('⏭️ Skipping wallet credit:', {
        isWon: status === 'won',
        alreadyWon: bet.status === 'won',
        condition: status === 'won' && bet.status !== 'won'
      });
    }

    // Update bet status
    bet.status = status;
    await bet.save();

    console.log('✅ Bet status updated successfully');
    console.log('=================================');

    res.status(200).json({
      success: true,
      message: `Bet marked as ${status}`,
      bet
    });
  } catch (error) {
    console.error('❌ Update bet error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to update bet',
      error: error.message
    });
  }
};

// @desc    Get bet statistics
// @route   GET /api/bets/stats
// @access  Private/Admin
export const getBetStats = async (req, res) => {
  try {
    const totalBets = await Bet.countDocuments();
    const totalWagered = await Bet.aggregate([
      { $group: { _id: null, total: { $sum: '$betAmount' } } }
    ]);
    
    const pendingBets = await Bet.countDocuments({ status: 'pending' });
    const wonBets = await Bet.countDocuments({ status: 'won' });
    const lostBets = await Bet.countDocuments({ status: 'lost' });
    
    const totalPayout = await Bet.aggregate([
      { $match: { status: 'won' } },
      { $group: { _id: null, total: { $sum: '$returnAmount' } } }
    ]);

    // Get today's bets
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayBets = await Bet.countDocuments({
      createdAt: { $gte: today }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalBets,
        totalWagered: totalWagered[0]?.total || 0,
        pendingBets,
        wonBets,
        lostBets,
        totalPayout: totalPayout[0]?.total || 0,
        todayBets
      }
    });
  } catch (error) {
    console.error('Get bet stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bet statistics',
      error: error.message
    });
  }
};

// @desc    Auto-resolve bets based on correct answers
// @route   POST /api/bets/resolve
// @access  Private/Admin
export const resolveBetsForQuestion = async (req, res) => {
  try {
    const { questionId, correctAnswer } = req.body; // correctAnswer: true for Yes, false for No
    
    console.log(`🔄 Auto-resolving bets for question: ${questionId}, correct answer: ${correctAnswer ? 'Yes' : 'No'}`);
    
    // Find all pending bets for this question
    const pendingBets = await Bet.find({ 
      questionId, 
      status: 'pending' 
    }).populate('userId');
    
    console.log(`📊 Found ${pendingBets.length} pending bets`);
    
    const results = {
      total: pendingBets.length,
      won: 0,
      lost: 0,
      processed: []
    };

    for (const bet of pendingBets) {
      const isCorrect = (bet.option === 'yes' && correctAnswer === true) ||
                       (bet.option === 'no' && correctAnswer === false);
      
      const newStatus = isCorrect ? 'won' : 'lost';
      
      console.log(`🎲 Bet ${bet._id}: user chose ${bet.option}, correct: ${isCorrect ? 'Yes' : 'No'}`);
      
      // Update bet status
      bet.status = newStatus;
      await bet.save();
      
      // If won, credit winnings
      if (isCorrect) {
        const user = await User.findById(bet.userId._id);
        const previousBalance = user.walletBalance;
        user.walletBalance += bet.returnAmount;
        await user.save();
        
        console.log(`💰 Credited ₹${bet.returnAmount} to user ${user.email}: ₹${previousBalance} -> ₹${user.walletBalance}`);
        
        await Transaction.create({
          userId: user._id,
          type: 'credit',
          amount: bet.returnAmount,
          description: `🏆 Won bet: ${bet.question.substring(0, 50)}...`,
          paymentMethod: 'Bonus', // Changed from 'Winnings' to 'Bonus'
          status: 'completed',
          reference: bet._id,
          referenceType: 'bet'
        });
        
        results.won++;
      } else {
        results.lost++;
      }
      
      results.processed.push({
        betId: bet._id,
        status: newStatus
      });
    }
    
    console.log(`✅ Auto-resolution complete: ${results.won} won, ${results.lost} lost`);
    
    res.status(200).json({
      success: true,
      message: `Resolved ${results.total} bets: ${results.won} won, ${results.lost} lost`,
      results
    });
    
  } catch (error) {
    console.error('❌ Resolve bets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve bets',
      error: error.message
    });
  }
};

// @desc    Manually credit winnings to user wallet
// @route   POST /api/bets/credit-winnings/:userId
// @access  Private/Admin
export const creditWinningsToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;

    console.log('💰 Manually crediting winnings to user:', userId);
    console.log('📝 Amount to credit:', amount);

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get all won bets for this user that haven't been credited yet
    const wonBets = await Bet.find({
      userId: userId,
      status: 'won'
    });

    const totalWinnings = wonBets.reduce((sum, bet) => sum + bet.returnAmount, 0);

    if (totalWinnings === 0) {
      return res.status(400).json({
        success: false,
        message: 'No winnings to credit for this user'
      });
    }

    // Update user wallet
    const previousBalance = user.walletBalance;
    user.walletBalance += totalWinnings;
    await user.save();

    console.log(`✅ Wallet updated: ₹${previousBalance} -> ₹${user.walletBalance}`);

    // Create transaction record - using 'Bonus' instead of 'Winnings'
    const transaction = await Transaction.create({
      userId: user._id,
      type: 'credit',
      amount: totalWinnings,
      description: `🏆 Manual credit of winnings from ${wonBets.length} bets`,
      paymentMethod: 'Bonus', // Changed from 'Winnings' to 'Bonus'
      status: 'completed'
    });

    res.status(200).json({
      success: true,
      message: `Credited ₹${totalWinnings} to user wallet`,
      previousBalance,
      newBalance: user.walletBalance,
      creditedAmount: totalWinnings,
      transaction: transaction
    });

  } catch (error) {
    console.error('❌ Credit winnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to credit winnings',
      error: error.message
    });
  }
};

// @desc    Debug endpoint to check user balance
// @route   GET /api/bets/check-balance/:userId
// @access  Private/Admin
export const checkUserBalance = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's won bets
    const wonBets = await Bet.find({ 
      userId: user._id, 
      status: 'won' 
    });

    const totalWinnings = wonBets.reduce((sum, bet) => sum + bet.returnAmount, 0);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        walletBalance: user.walletBalance
      },
      stats: {
        totalWinnings,
        wonBetsCount: wonBets.length,
        expectedBalance: 100 + totalWinnings // 100 is welcome bonus
      }
    });
  } catch (error) {
    console.error('Check balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check balance',
      error: error.message
    });
  }
};

// @desc    Fix user balance by recalculating from won bets
// @route   POST /api/bets/fix-balance/:userId
// @access  Private/Admin
export const fixUserBalance = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    console.log('🔧 FIXING BALANCE FOR USER:', userId);
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    console.log('👤 Current user data:', {
      email: user.email,
      currentBalance: user.walletBalance
    });
    
    // Find all won bets for this user
    const wonBets = await Bet.find({ 
      userId: userId, 
      status: 'won' 
    });
    
    console.log('🎲 Won bets found:', wonBets.length);
    
    // Calculate total winnings from won bets
    const totalWinnings = wonBets.reduce((sum, bet) => sum + bet.returnAmount, 0);
    console.log('💰 Total winnings from bets:', totalWinnings);
    
    // Find all credit transactions for winnings
    const creditTransactions = await Transaction.find({
      userId: userId,
      type: 'credit',
      paymentMethod: 'Bonus' // Changed from 'Winnings' to 'Bonus'
    });
    
    const totalCredited = creditTransactions.reduce((sum, t) => sum + t.amount, 0);
    console.log('📝 Total credited in transactions:', totalCredited);
    
    // Check if there's a discrepancy
    const expectedBalance = 100 + totalWinnings; // 100 is welcome bonus
    const actualBalance = user.walletBalance;
    
    console.log('📊 Balance comparison:', {
      welcomeBonus: 100,
      totalWinnings,
      expectedBalance,
      actualBalance,
      discrepancy: expectedBalance - actualBalance
    });
    
    // If actual balance is less than expected, fix it
    if (actualBalance < expectedBalance) {
      const amountToAdd = expectedBalance - actualBalance;
      console.log('⚠️ Discrepancy found! Adding:', amountToAdd);
      
      user.walletBalance = expectedBalance;
      await user.save();
      
      // Create a correction transaction
      await Transaction.create({
        userId: user._id,
        type: 'credit',
        amount: amountToAdd,
        description: '💰 Balance correction for missing winnings',
        paymentMethod: 'Bonus', // Changed from 'System' to 'Bonus'
        status: 'completed'
      });
      
      console.log('✅ Balance fixed. New balance:', user.walletBalance);
      
      return res.json({
        success: true,
        message: 'Balance fixed',
        oldBalance: actualBalance,
        newBalance: user.walletBalance,
        added: amountToAdd,
        totalWinnings
      });
    } else {
      console.log('✅ Balance is correct');
      return res.json({
        success: true,
        message: 'Balance is correct',
        balance: user.walletBalance,
        totalWinnings
      });
    }
  } catch (error) {
    console.error('❌ Fix balance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};