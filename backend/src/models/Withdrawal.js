import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
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
    required: true
  },
  userPhone: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [100, 'Minimum withdrawal amount is ₹100']
  },
  method: {
    type: String,
    enum: ['Bank Transfer', 'UPI', 'PayPal'],
    default: 'UPI'
  },
  upiId: {
    type: String,
    required: function() {
      return this.method === 'UPI';
    },
    trim: true,
    validate: {
      validator: function(v) {
        // Basic UPI validation: something@provider
        return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(v);
      },
      message: props => `${props.value} is not a valid UPI ID!`
    }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'rejected'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  processedBy: {
    type: String,  // Changed from ObjectId to String to accept "admin"
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Generate withdrawal ID
withdrawalSchema.virtual('withdrawalId').get(function() {
  return `WD${this._id.toString().slice(-8).toUpperCase()}`;
});

// Update timestamps on status change
withdrawalSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'completed') {
      this.completedAt = Date.now();
      this.processedAt = Date.now();
    }
    if (this.status === 'processing') {
      this.processedAt = Date.now();
    }
    if (this.status === 'rejected') {
      this.processedAt = Date.now();
    }
  }
  next();
});

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

export default Withdrawal;