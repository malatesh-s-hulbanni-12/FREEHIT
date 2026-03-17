import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Environment variables should already be loaded by env.js
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    console.log('🔌 Connecting to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Create indexes
    await createIndexes();
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Please check your MONGODB_URI in .env file');
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    
    // Create unique index on email if it doesn't exist
    const collections = await db.listCollections().toArray();
    const usersCollectionExists = collections.some(col => col.name === 'users');
    
    if (usersCollectionExists) {
      const users = db.collection('users');
      await users.createIndex({ email: 1 }, { unique: true });
      console.log('✅ Database indexes created successfully');
    }
  } catch (error) {
    console.log('⚠️ Index creation skipped:', error.message);
  }
};

export default connectDB;