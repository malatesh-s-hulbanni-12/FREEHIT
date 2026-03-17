import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  slipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slip',
    required: true
  },
  slipTitle: {
    type: String,
    required: true
  },
  slipDescription: {
    type: String,
    default: ''
  },
  userId: {
    type: String,
    default: 'anonymous'
  },
  userName: {
    type: String,
    default: 'Anonymous User'
  },
  userEmail: {
    type: String,
    default: ''
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    question: {
      type: String,
      required: true
    },
    answerType: {
      type: String,
      enum: ['yes/no', 'text', 'number'],
      default: 'yes/no'
    },
    answer: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    yesPrice: {
      type: Number,
      default: 0
    },
    noPrice: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      default: 0
    }
  }],
  totalPrice: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'reviewed'],
    default: 'completed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Answer = mongoose.model('Answer', answerSchema);

export default Answer;