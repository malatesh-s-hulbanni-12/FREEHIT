import React, { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';
import toast from 'react-hot-toast';
import { X, CreditCard, Lock } from 'lucide-react';

// Initialize Stripe outside component to avoid recreating
let stripePromise;

const PaymentForm = ({ amount, onSuccess, onFailure, onCancel, clientSecret }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message);
        toast.error(submitError.message);
        // Call onFailure for submit error
        if (onFailure) {
          onFailure(submitError.message);
        }
        setLoading(false);
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment-confirmation`,
        },
        redirect: 'if_required'
      });

      if (error) {
        setErrorMessage(error.message);
        toast.error(error.message);
        // Call onFailure for payment error
        if (onFailure) {
          onFailure(error.message);
        }
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment successful
        try {
          const token = localStorage.getItem('token');
          await axios.post('https://freehit.onrender.com/api/payments/confirm-payment',
            {
              paymentIntentId: clientSecret.split('_secret_')[0],
              amount: parseFloat(amount)
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          toast.success(`₹${amount} added to wallet successfully!`);
          onSuccess();
        } catch (confirmError) {
          console.error('Confirmation error:', confirmError);
          const errorMsg = 'Payment succeeded but failed to update wallet';
          toast.error(errorMsg);
          if (onFailure) {
            onFailure(errorMsg);
          }
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMsg = 'Payment failed. Please try again.';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
      if (onFailure) {
        onFailure(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <PaymentElement />
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {errorMessage}
        </div>
      )}

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-lg hover:from-green-700 hover:to-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              <span>Pay ₹{amount}</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            onCancel();
            if (onFailure) {
              onFailure('Payment cancelled by user');
            }
          }}
          disabled={loading}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
        <CreditCard className="w-4 h-4" />
        <span>Secure payment powered by Stripe</span>
      </div>
    </form>
  );
};

const StripePaymentModal = ({ isOpen, onClose, amount, onSuccess, onFailure }) => {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        // Get Stripe publishable key
        const configResponse = await axios.get('https://freehit.onrender.com/api/payments/config');
        const stripe = loadStripe(configResponse.data.publishableKey);
        setStripePromise(stripe);
      } catch (error) {
        console.error('Stripe initialization error:', error);
        setError('Failed to initialize payment system');
        if (onFailure) {
          onFailure('Failed to initialize payment system');
        }
      }
    };

    if (isOpen) {
      initializeStripe();
    }
  }, [isOpen, onFailure]);

  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!isOpen || !amount) return;

      setLoading(true);
      setError('');

      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
          'https://freehit.onrender.com/api/payments/create-payment-intent',
          { amount: parseFloat(amount) },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setClientSecret(response.data.clientSecret);
      } catch (error) {
        console.error('Payment intent error:', error);
        const errorMsg = error.response?.data?.message || 'Failed to initialize payment';
        setError(errorMsg);
        toast.error(errorMsg);
        if (onFailure) {
          onFailure(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && amount) {
      createPaymentIntent();
    }
  }, [isOpen, amount, onFailure]);

  const handleClose = () => {
    onClose();
    // Reset states when closing
    setClientSecret('');
    setError('');
    setLoading(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Complete Payment</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-4 bg-primary-50 rounded-lg">
          <p className="text-sm text-gray-600">Amount to add:</p>
          <p className="text-2xl font-bold text-primary-600">₹{amount}</p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Initializing payment...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 mb-4">
            {error}
          </div>
        )}

        {!loading && !error && clientSecret && stripePromise && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm
              amount={amount}
              onSuccess={() => {
                onSuccess();
                handleClose();
              }}
              onFailure={(errorMsg) => {
                if (onFailure) {
                  onFailure(errorMsg);
                }
                handleClose();
              }}
              onCancel={handleClose}
              clientSecret={clientSecret}
            />
          </Elements>
        )}
      </div>
    </div>
  );
};

export default StripePaymentModal;
