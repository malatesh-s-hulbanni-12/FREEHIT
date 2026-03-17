import Stripe from 'stripe';

let stripeInstance = null;

export const initializeStripe = () => {
  console.log('\n=== Stripe Initialization ===');
  
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.log('⚠️ STRIPE_SECRET_KEY not found - Stripe features will be disabled');
      return false;
    }
    
    console.log('Initializing Stripe...');
    
    const secretKey = process.env.STRIPE_SECRET_KEY.trim();
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
    
    console.log('✅ Stripe initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Stripe:', error.message);
    stripeInstance = null;
    return false;
  }
};

export const getStripe = () => {
  if (!stripeInstance) {
    initializeStripe();
  }
  return stripeInstance;
};