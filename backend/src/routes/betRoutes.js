import express from 'express';
import { protect } from '../middleware/auth.js';
import { admin } from '../middleware/auth.js';
import {
  placeBet,
  getMyBets,
  getAllBets,
  updateBetStatus,
  getBetStats,
  resolveBetsForQuestion,
  checkUserBalance,
  fixUserBalance  // Add this import
} from '../controllers/betController.js';

const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
  console.log(`🔵 Bet Route: ${req.method} ${req.path}`);
  next();
});

// All bet routes require authentication
router.use(protect);

// User routes
router.post('/', placeBet);
router.get('/my-bets', getMyBets);

// Admin routes
router.get('/all', admin, getAllBets);
router.get('/stats', admin, getBetStats);
router.put('/:id', admin, updateBetStatus);
router.post('/resolve', admin, resolveBetsForQuestion);

// Debug route (admin only)
router.get('/check-balance/:userId', admin, checkUserBalance);
// Add this line with your other admin routes
router.post('/fix-balance/:userId', admin, fixUserBalance);

export default router;