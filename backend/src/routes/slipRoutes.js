import express from 'express';
import { protect } from '../middleware/auth.js';
import { admin } from '../middleware/auth.js';
import {
  createSlip,
  getAllSlips,
  //getSlipById,
  //updateSlip,
  deleteSlip,
  getSlipStats,
  getActiveSlips,
  debugSlips // Make sure this is imported
} from '../controllers/slipController.js';

const router = express.Router();

// Public route - NO AUTH REQUIRED
router.get('/active', getActiveSlips);  // This should be BEFORE the protected routes

// All routes below are protected and require admin access
router.use(protect);
router.use(admin);

// Slip routes
router.post('/', createSlip);
router.get('/', getAllSlips);
router.get('/stats', getSlipStats);
//router.get('/:id', getSlipById);
//router.put('/:id', updateSlip);
router.delete('/:id', deleteSlip);
router.get('/debug', debugSlips);  // Add this for debugging

export default router;