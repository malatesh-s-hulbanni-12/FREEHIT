import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Stripe', 'Wallet', 'Bank Transfer', 'UPI', 'Bonus', 'Bet', 'Winnings'],
    default: 'Wallet'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  reference: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceType'
  },
  referenceType: {
    type: String,
    enum: ['bet', 'withdrawal', 'deposit', 'refund']
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;