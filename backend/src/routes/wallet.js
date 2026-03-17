// backend/src/routes/wallet.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Add money to wallet
router.post('/add', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid amount'
      });
    }

    const user = await User.findById(req.user.id);
    user.walletBalance += parseFloat(amount);
    
    // Add transaction record (you can create a Transaction model for this)
    await user.save();

    res.status(200).json({
      success: true,
      message: `₹${amount} added to wallet successfully`,
      walletBalance: user.walletBalance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add money',
      error: error.message
    });
  }
});

// Withdraw money from wallet
router.post('/withdraw', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid amount'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (user.walletBalance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    user.walletBalance -= parseFloat(amount);
    
    // Add transaction record
    await user.save();

    res.status(200).json({
      success: true,
      message: `₹${amount} withdrawn successfully`,
      walletBalance: user.walletBalance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to withdraw money',
      error: error.message
    });
  }
});

// Get transaction history
router.get('/transactions', protect, async (req, res) => {
  try {
    // You'll need to create a Transaction model for this
    // For now, returning mock data
    const transactions = [];
    
    res.status(200).json({
      success: true,
      transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

export default router;