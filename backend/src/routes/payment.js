import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createPaymentIntent,
  confirmPayment,
  getStripeConfig
  // Remove testStripeConnection from here
} from '../controllers/paymentController.js';

const router = express.Router();

// Public routes
router.get('/config', getStripeConfig);

// Protected routes
router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/confirm-payment', protect, confirmPayment);

export default router;