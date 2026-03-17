import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import connectDB from './config/database.js';
import slipRoutes from './routes/slipRoutes.js';
import answerRoutes from './routes/answerRoutes.js';
import betRoutes from './routes/betRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import withdrawalRoutes from './routes/withdrawalRoutes.js';


// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Import routes
import authRoutes from './routes/auth.js';
import paymentRoutes from './routes/payment.js';
// Add this with other routes
app.use('/api/slips', slipRoutes);
// Add with other routes
app.use('/api/answers', answerRoutes);
app.use('/api/bets', betRoutes);
// Add with other routes
app.use('/api/transactions', transactionRoutes);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
// Add with other routes
app.use('/api/withdrawals', withdrawalRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    stripe: !!process.env.STRIPE_SECRET_KEY ? 'configured' : 'not configured'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

export default app;