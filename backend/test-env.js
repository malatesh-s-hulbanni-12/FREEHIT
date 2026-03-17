import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Testing .env file loading ===');
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('.env path:', path.join(__dirname, '.env'));

// Try to load .env
const result = dotenv.config({ path: path.join(__dirname, '.env') });

if (result.error) {
  console.error('❌ Error loading .env:', result.error);
} else {
  console.log('✅ .env loaded successfully');
}

console.log('\n=== Environment Variables ===');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Found' : '❌ Missing');
console.log('STRIPE_PUBLISHABLE_KEY:', process.env.STRIPE_PUBLISHABLE_KEY ? '✅ Found' : '❌ Missing');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Found' : '❌ Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Found' : '❌ Missing');

if (process.env.STRIPE_SECRET_KEY) {
  console.log('\nStripe secret key prefix:', process.env.STRIPE_SECRET_KEY.substring(0, 10) + '...');
  console.log('Stripe secret key length:', process.env.STRIPE_SECRET_KEY.length);
}

if (process.env.STRIPE_PUBLISHABLE_KEY) {
  console.log('Stripe publishable key prefix:', process.env.STRIPE_PUBLISHABLE_KEY.substring(0, 10) + '...');
  console.log('Stripe publishable key length:', process.env.STRIPE_PUBLISHABLE_KEY.length);
}