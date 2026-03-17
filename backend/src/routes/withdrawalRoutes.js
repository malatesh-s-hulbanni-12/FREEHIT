import express from 'express';
import { protect } from '../middleware/auth.js';
import { admin } from '../middleware/auth.js';
import {
  requestWithdrawal,
  getMyWithdrawals,
  getAllWithdrawals,
  getWithdrawalById,
  updateWithdrawalStatus,
  cancelWithdrawal,
  getWithdrawalStats
} from '../controllers/withdrawalController.js';

const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
  console.log(`💸 Withdrawal Route: ${req.method} ${req.path}`);
  next();
});

// All withdrawal routes require authentication
router.use(protect);

// User routes
router.post('/', requestWithdrawal);
router.get('/my-withdrawals', getMyWithdrawals);
router.post('/:id/cancel', cancelWithdrawal);

// Admin routes
router.get('/all', admin, getAllWithdrawals);
router.get('/stats', admin, getWithdrawalStats);
router.get('/:id', admin, getWithdrawalById);
router.put('/:id', admin, updateWithdrawalStatus);

export default router;