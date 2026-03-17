import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true
  },
  answerType: {
    type: String,
    enum: ['yes/no', 'text', 'number'],
    default: 'yes/no'
  },
  yesPrice: {
    type: Number,
    min: [0, 'Price cannot be negative'],
    default: 0
  },
  noPrice: {
    type: Number,
    min: [0, 'Price cannot be negative'],
    default: 0
  }
});

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  answer: {
    type: mongoose.Schema.Types.Mixed, // Can be string, boolean, or number
    required: true
  },
  price: {
    type: Number,
    default: 0
  }
});

const slipSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    default: 'Untitled Slip'
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  questions: [questionSchema],
  answers: [answerSchema], // Store user answers
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Total price cannot be negative'],
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'archived'],
    default: 'active'
  },
  createdBy: {
    type: String,
    required: true,
    default: 'admin'
  },
  answeredBy: {
    type: String,
    default: null
  },
  answeredAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update the updatedAt field on save
slipSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate total price before saving
slipSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0 && !this.answers.length) {
    this.totalPrice = this.questions.reduce((total, q) => {
      return total + (parseFloat(q.yesPrice) || 0) + (parseFloat(q.noPrice) || 0);
    }, 0);
  }
  next();
});

const Slip = mongoose.model('Slip', slipSchema);

export default Slip;