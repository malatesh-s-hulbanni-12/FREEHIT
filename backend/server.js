// First, load environment variables
import './src/config/env.js';

// Now import everything else
import mongoose from 'mongoose';
import { initializeStripe } from './src/config/stripe.js';
import app from './src/app.js';

// Initialize Stripe after env vars are loaded
initializeStripe();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: ${process.env.MONGODB_URI ? '✅ Configured' : '❌ Not Configured'}`);
  console.log(`💳 Stripe: ${process.env.STRIPE_SECRET_KEY ? '✅ Configured' : '❌ Not Configured'}`);
  console.log(`🔗 Local: http://localhost:${PORT}\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  server.close(() => process.exit(1));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});