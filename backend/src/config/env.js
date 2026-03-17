// This file ensures env vars are loaded before anything else
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend root
const envPath = path.join(__dirname, '../../.env');
console.log('Loading .env from:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Error loading .env file:', result.error);
  process.exit(1);
} else {
  console.log('✅ .env file loaded successfully');
}

// Verify critical variables
const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

console.log('✅ All required environment variables are present');
console.log('📊 MONGODB_URI:', process.env.MONGODB_URI ? '✅ Loaded' : '❌ Missing');
console.log('💳 Stripe configured:', !!process.env.STRIPE_SECRET_KEY);

export default process.env;