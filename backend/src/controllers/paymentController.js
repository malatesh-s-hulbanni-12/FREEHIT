import User from '../models/User.js';
import { getStripe } from '../config/stripe.js';

// @desc    Create Stripe payment intent
// @route   POST /api/payments/create-payment-intent
// @access  Private
export const createPaymentIntent = async (req, res) => {
  try {
    console.log('=== Create Payment Intent Debug ===');
    
    const stripe = getStripe();
    
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Payment service is not configured properly. Please check server logs.',
        debug: {
          stripeInitialized: false,
          secretKeyExists: !!process.env.STRIPE_SECRET_KEY
        }
      });
    }

    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid amount'
      });
    }

    // Check minimum amount based on currency
    const currency = 'inr'; // Change this to match your Stripe account currency
    let minAmount = 50; // 50 paise minimum for INR
    
    // If your account is in GBP, minimum is 30 GBP = 3000 pence
    if (currency === 'gbp') {
      minAmount = 30; // 30 GBP minimum
    }
    
    if (amount < minAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum amount is ₹${minAmount} for INR or £30 for GBP. Please check your Stripe account currency.`
      });
    }

    console.log(`Creating payment intent for amount: ₹${amount}`);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'inr',
      metadata: {
        userId: req.user.id,
        email: req.user.email
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log(`✅ Payment intent created: ${paymentIntent.id}`);

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('❌ Stripe payment intent error:', error.message);
    
    // Provide more helpful error message
    let errorMessage = 'Failed to create payment intent';
    if (error.message.includes('Amount must convert to at least')) {
      errorMessage = 'Minimum amount is ₹50 or £30 depending on your Stripe account currency. Please try a higher amount.';
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
};

// @desc    Confirm payment and add money to wallet
// @route   POST /api/payments/confirm-payment
// @access  Private
export const confirmPayment = async (req, res) => {
  try {
    const stripe = getStripe();
    
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Payment service is not configured properly'
      });
    }

    const { paymentIntentId, amount } = req.body;

    if (!paymentIntentId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment information'
      });
    }

    console.log(`Confirming payment: ${paymentIntentId}`);

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    console.log('Payment intent status:', paymentIntent.status);

    if (paymentIntent.status === 'succeeded') {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      user.walletBalance += parseFloat(amount);
      await user.save();

      res.status(200).json({
        success: true,
        message: `₹${amount} added to wallet successfully`,
        walletBalance: user.walletBalance
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Payment not successful. Status: ${paymentIntent.status}`
      });
    }
  } catch (error) {
    console.error('❌ Payment confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: error.message
    });
  }
};

// @desc    Get Stripe publishable key
// @route   GET /api/payments/config
// @access  Public
export const getStripeConfig = (req, res) => {
  try {
    if (!process.env.STRIPE_PUBLISHABLE_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Stripe publishable key is not configured'
      });
    }

    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY.trim().replace(/^["']|["']$/g, '');

    res.status(200).json({
      success: true,
      publishableKey: publishableKey
    });
  } catch (error) {
    console.error('Error getting Stripe config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment configuration'
    });
  }
};