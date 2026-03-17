import mongoose from 'mongoose';

const betSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    default: 'User'
  },
  slipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slip',
    required: true
  },
  slipTitle: {
    type: String,
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  option: {
    type: String,
    enum: ['yes', 'no'],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  betAmount: {
    type: Number,
    required: true,
    min: 10
  },
  returnAmount: {
    type: Number,
    required: true
  },
  potentialProfit: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'won', 'lost'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Bet = mongoose.model('Bet', betSchema);

export default Bet;