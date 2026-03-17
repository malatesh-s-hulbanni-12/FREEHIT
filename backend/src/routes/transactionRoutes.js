import express from 'express';
import { protect } from '../middleware/auth.js';
import { admin } from '../middleware/auth.js';
import {
  getUserTransactions,
  getAllTransactions
} from '../controllers/transactionController.js';

const router = express.Router();

// Protected routes
router.use(protect);

router.get('/', getUserTransactions);
router.get('/all', admin, getAllTransactions);

export default router;