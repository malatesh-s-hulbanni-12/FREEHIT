import Withdrawal from '../models/Withdrawal.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

// @desc    Request a withdrawal
// @route   POST /api/withdrawals
// @access  Private
export const requestWithdrawal = async (req, res) => {
  try {
    console.log('💰 Processing withdrawal request for user:', req.user.id);
    
    const { 
      amount, 
      method = 'UPI',
      upiId,
      bankDetails 
    } = req.body;

    // Validate amount
    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum withdrawal amount is ₹100'
      });
    }

    // Validate UPI ID for UPI method
    if (method === 'UPI') {
      if (!upiId) {
        return res.status(400).json({
          success: false,
          message: 'UPI ID is required for withdrawal'
        });
      }

      // Validate UPI format
      const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
      if (!upiRegex.test(upiId)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid UPI ID (e.g., name@bank)'
        });
      }
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
    if (user.walletBalance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ₹${user.walletBalance}`
      });
    }

    // Check for pending withdrawals
    const pendingWithdrawals = await Withdrawal.countDocuments({
      userId: user._id,
      status: { $in: ['pending', 'processing'] }
    });

    if (pendingWithdrawals >= 3) {
      return res.status(400).json({
        success: false,
        message: 'You have too many pending withdrawal requests. Please wait for them to be processed.'
      });
    }

    // Start a session for transaction
    const session = await Withdrawal.startSession();
    session.startTransaction();

    try {
      // Create withdrawal record with UPI ID
      const withdrawal = await Withdrawal.create([{
        userId: user._id,
        userEmail: user.email,
        userName: user.name,
        userPhone: user.phone,
        amount,
        method,
        upiId: method === 'UPI' ? upiId : undefined,
        bankDetails: {
          ...bankDetails,
          upiId: method === 'UPI' ? upiId : undefined
        },
        status: 'pending',
        requestedAt: new Date()
      }], { session });

      // Deduct amount from user wallet
      const previousBalance = user.walletBalance;
      user.walletBalance -= amount;
      await user.save({ session });

      // Create transaction record
      await Transaction.create([{
        userId: user._id,
        type: 'debit',
        amount,
        description: `Withdrawal request: ₹${amount} via ${method}${method === 'UPI' ? ` to UPI: ${upiId}` : ''}`,
        paymentMethod: method,
        status: 'pending',
        reference: withdrawal[0]._id,
        referenceType: 'withdrawal',
        metadata: {
          upiId: method === 'UPI' ? upiId : undefined,
          requestedAt: new Date()
        }
      }], { session });

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      console.log('✅ Withdrawal request created:', withdrawal[0]._id);
      console.log('📝 UPI ID stored:', upiId);

      res.status(201).json({
        success: true,
        message: 'Withdrawal request submitted successfully',
        withdrawal: {
          ...withdrawal[0].toObject(),
          withdrawalId: withdrawal[0].withdrawalId
        },
        newBalance: user.walletBalance
      });

    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    console.error('❌ Withdrawal request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal request',
      error: error.message
    });
  }
};

// @desc    Get user's withdrawal history
// @route   GET /api/withdrawals/my-withdrawals
// @access  Private
export const getMyWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ userId: req.user.id })
      .sort({ requestedAt: -1 });

    // Calculate statistics
    const stats = {
      totalWithdrawals: withdrawals.length,
      totalAmount: withdrawals.reduce((sum, w) => sum + w.amount, 0),
      pendingAmount: withdrawals
        .filter(w => w.status === 'pending')
        .reduce((sum, w) => sum + w.amount, 0),
      completedAmount: withdrawals
        .filter(w => w.status === 'completed')
        .reduce((sum, w) => sum + w.amount, 0),
      rejectedAmount: withdrawals
        .filter(w => w.status === 'rejected')
        .reduce((sum, w) => sum + w.amount, 0)
    };

    res.status(200).json({
      success: true,
      count: withdrawals.length,
      stats,
      withdrawals: withdrawals.map(w => ({
        ...w.toObject(),
        withdrawalId: w.withdrawalId
      }))
    });

  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawals',
      error: error.message
    });
  }
};

// @desc    Get all withdrawals (admin only) - Single version
// @route   GET /api/withdrawals/all
// @access  Private/Admin
export const getAllWithdrawals = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      userId,
      startDate,
      endDate,
      method
    } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (method) query.method = method;
    if (startDate || endDate) {
      query.requestedAt = {};
      if (startDate) query.requestedAt.$gte = new Date(startDate);
      if (endDate) query.requestedAt.$lte = new Date(endDate);
    }

    const withdrawals = await Withdrawal.find(query)
      .populate('userId', 'name email phone')
      .sort({ requestedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Withdrawal.countDocuments(query);

    // Calculate statistics
    const totalStats = await Withdrawal.aggregate([
      { $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalUPI: { $sum: { $cond: [{ $eq: ['$method', 'UPI'] }, '$amount', 0] } },
        totalBank: { $sum: { $cond: [{ $eq: ['$method', 'Bank Transfer'] }, '$amount', 0] } }
      }}
    ]);

    const stats = {
      totalWithdrawals: await Withdrawal.countDocuments(),
      pendingWithdrawals: await Withdrawal.countDocuments({ status: 'pending' }),
      processingWithdrawals: await Withdrawal.countDocuments({ status: 'processing' }),
      completedWithdrawals: await Withdrawal.countDocuments({ status: 'completed' }),
      rejectedWithdrawals: await Withdrawal.countDocuments({ status: 'rejected' }),
      upiWithdrawals: await Withdrawal.countDocuments({ method: 'UPI' }),
      bankWithdrawals: await Withdrawal.countDocuments({ method: 'Bank Transfer' }),
      totalAmount: totalStats[0]?.totalAmount || 0,
      totalUPI: totalStats[0]?.totalUPI || 0,
      totalBank: totalStats[0]?.totalBank || 0
    };

    // Format withdrawals with virtual fields
    const formattedWithdrawals = withdrawals.map(w => ({
      ...w.toObject(),
      withdrawalId: w.withdrawalId
    }));

    res.status(200).json({
      success: true,
      count: withdrawals.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      stats,
      withdrawals: formattedWithdrawals
    });

  } catch (error) {
    console.error('Get all withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawals',
      error: error.message
    });
  }
};

// @desc    Get single withdrawal (admin only)
// @route   GET /api/withdrawals/:id
// @access  Private/Admin
export const getWithdrawalById = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id)
      .populate('userId', 'name email phone');

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found'
      });
    }

    res.status(200).json({
      success: true,
      withdrawal: {
        ...withdrawal.toObject(),
        withdrawalId: withdrawal.withdrawalId
      }
    });

  } catch (error) {
    console.error('Get withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal',
      error: error.message
    });
  }
};

// @desc    Update withdrawal status (admin only) - Fixed version with proper processedBy handling
// @route   PUT /api/withdrawals/:id
// @access  Private/Admin
export const updateWithdrawalStatus = async (req, res) => {
  try {
    const { status, transactionId, rejectionReason } = req.body;
    const withdrawalId = req.params.id;

    console.log('🔄 Updating withdrawal:', withdrawalId, 'to status:', status);

    if (!['pending', 'processing', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const withdrawal = await Withdrawal.findById(withdrawalId).populate('userId');
    
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found'
      });
    }

    // Start session for transaction
    const session = await Withdrawal.startSession();
    session.startTransaction();

    try {
      // If status is being changed to completed
      if (status === 'completed' && withdrawal.status !== 'completed') {
        // Update transaction status
        await Transaction.findOneAndUpdate(
          { reference: withdrawal._id, referenceType: 'withdrawal' },
          { 
            status: 'completed',
            description: `Withdrawal completed: ₹${withdrawal.amount} to UPI: ${withdrawal.upiId}`,
            'metadata.completedAt': new Date(),
            'metadata.transactionId': transactionId,
            'metadata.processedBy': req.user.id
          },
          { session }
        );

        console.log('✅ Withdrawal completed for user:', withdrawal.userEmail);
        console.log('📤 Amount sent to UPI:', withdrawal.upiId);
      }

      // If status is being changed to rejected
      if (status === 'rejected' && withdrawal.status !== 'rejected') {
        // Refund the amount to user wallet
        const user = await User.findById(withdrawal.userId);
        if (user) {
          user.walletBalance += withdrawal.amount;
          await user.save({ session });

          // Create refund transaction
          await Transaction.create([{
            userId: user._id,
            type: 'credit',
            amount: withdrawal.amount,
            description: `Refund for rejected withdrawal: ₹${withdrawal.amount}`,
            paymentMethod: 'Refund',
            status: 'completed',
            reference: withdrawal._id,
            referenceType: 'refund',
            metadata: {
              rejectedAt: new Date(),
              rejectionReason: rejectionReason
            }
          }], { session });

          console.log(`💰 Refunded ₹${withdrawal.amount} to user:`, user.email);
        }

        // Update original transaction status
        await Transaction.findOneAndUpdate(
          { reference: withdrawal._id, referenceType: 'withdrawal' },
          { 
            status: 'failed',
            description: `Withdrawal rejected: ₹${withdrawal.amount}`,
            'metadata.rejectedAt': new Date(),
            'metadata.rejectionReason': rejectionReason,
            'metadata.processedBy': req.user.id
          },
          { session }
        );
      }

      // If status is being changed to processing
      if (status === 'processing' && withdrawal.status === 'pending') {
        // Just update the status, no wallet changes needed
        console.log('⏳ Withdrawal marked as processing');
      }

      // Prepare update data - handle processedBy as string for admin
      const updateData = {
        status: status,
        processedAt: new Date()
      };
      
      // Add processedBy only if it's a valid ObjectId or store as string
      // Since admin tokens use "admin" as ID, we'll store it as a string
      if (req.user.id) {
        updateData.processedBy = req.user.id; // This can be "admin" or a real ObjectId
      }
      
      if (transactionId) updateData.transactionId = transactionId;
      if (rejectionReason) updateData.rejectionReason = rejectionReason;

      // Update withdrawal using findByIdAndUpdate to avoid validation issues
      const updatedWithdrawal = await Withdrawal.findByIdAndUpdate(
        withdrawalId,
        updateData,
        { new: true, session }
      );

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      console.log('✅ Withdrawal updated successfully');

      res.status(200).json({
        success: true,
        message: `Withdrawal marked as ${status}`,
        withdrawal: {
          ...updatedWithdrawal.toObject(),
          withdrawalId: updatedWithdrawal.withdrawalId
        }
      });

    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    console.error('❌ Update withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update withdrawal',
      error: error.message
    });
  }
};

// @desc    Cancel withdrawal request (user only)
// @route   POST /api/withdrawals/:id/cancel
// @access  Private
export const cancelWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found'
      });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending withdrawals can be cancelled'
      });
    }

    // Start session for transaction
    const session = await Withdrawal.startSession();
    session.startTransaction();

    try {
      // Update withdrawal status
      withdrawal.status = 'rejected';
      withdrawal.rejectionReason = 'Cancelled by user';
      await withdrawal.save({ session });

      // Refund amount to user
      const user = await User.findById(req.user.id);
      user.walletBalance += withdrawal.amount;
      await user.save({ session });

      // Update transaction
      await Transaction.findOneAndUpdate(
        { reference: withdrawal._id, referenceType: 'withdrawal' },
        { 
          status: 'failed',
          description: `Withdrawal cancelled by user: ₹${withdrawal.amount}`
        },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      console.log('✅ Withdrawal cancelled by user:', withdrawal._id);

      res.status(200).json({
        success: true,
        message: 'Withdrawal cancelled successfully',
        newBalance: user.walletBalance
      });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    console.error('❌ Cancel withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel withdrawal',
      error: error.message
    });
  }
};

// @desc    Get withdrawal statistics (admin only)
// @route   GET /api/withdrawals/stats
// @access  Private/Admin
export const getWithdrawalStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      totalWithdrawals: await Withdrawal.countDocuments(),
      pendingWithdrawals: await Withdrawal.countDocuments({ status: 'pending' }),
      processingWithdrawals: await Withdrawal.countDocuments({ status: 'processing' }),
      completedWithdrawals: await Withdrawal.countDocuments({ status: 'completed' }),
      rejectedWithdrawals: await Withdrawal.countDocuments({ status: 'rejected' }),
      todayWithdrawals: await Withdrawal.countDocuments({
        requestedAt: { $gte: today }
      }),
      upiWithdrawals: await Withdrawal.countDocuments({ method: 'UPI' }),
      bankWithdrawals: await Withdrawal.countDocuments({ method: 'Bank Transfer' }),
      totalAmount: await Withdrawal.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      todayAmount: await Withdrawal.aggregate([
        { $match: { requestedAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      upiAmount: await Withdrawal.aggregate([
        { $match: { method: 'UPI' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      bankAmount: await Withdrawal.aggregate([
        { $match: { method: 'Bank Transfer' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    };

    res.status(200).json({
      success: true,
      stats: {
        ...stats,
        totalAmount: stats.totalAmount[0]?.total || 0,
        todayAmount: stats.todayAmount[0]?.total || 0,
        upiAmount: stats.upiAmount[0]?.total || 0,
        bankAmount: stats.bankAmount[0]?.total || 0
      }
    });

  } catch (error) {
    console.error('Get withdrawal stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal statistics',
      error: error.message
    });
  }
};