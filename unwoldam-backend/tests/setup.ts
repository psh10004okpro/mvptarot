import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Setup global test timeout
jest.setTimeout(30000);

// Connect to test database before all tests
beforeAll(async () => {
  const mongoURI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/unwoldam_tarot_test';

  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to test database');
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    throw error;
  }
});

// Clean up database after each test
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});

// Disconnect after all tests
afterAll(async () => {
  try {
    await mongoose.connection.close();
    console.log('✅ Disconnected from test database');
  } catch (error) {
    console.error('❌ Error disconnecting from test database:', error);
  }
});

// Global test helpers
global.console = {
  ...console,
  // Suppress console logs in tests unless DEBUG is set
  log: process.env.DEBUG ? console.log : jest.fn(),
  debug: process.env.DEBUG ? console.debug : jest.fn(),
  info: process.env.DEBUG ? console.info : jest.fn(),
  warn: console.warn,
  error: console.error,
};
