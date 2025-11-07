import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import connectDB from './config/database';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit';
import { checkExpiredSubscriptions } from './services/subscriptionService';

// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true
}));
app.use(compression()); // Compress responses
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// API routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🌙 운월담 타로 API 서버입니다.',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      tarot: '/api/tarot',
      cards: '/api/cards',
      subscription: '/api/subscription'
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🌙 운월담 타로 서비스 API 서버                    ║
║                                                   ║
║   Environment: ${process.env.NODE_ENV || 'development'}                          ║
║   Port: ${PORT}                                      ║
║   API Base URL: http://localhost:${PORT}/api         ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});

// Run subscription check every hour
setInterval(async () => {
  try {
    console.log('⏰ Running subscription expiration check...');
    await checkExpiredSubscriptions();
  } catch (error) {
    console.error('❌ Error checking expired subscriptions:', error);
  }
}, 60 * 60 * 1000); // 1 hour

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

export default app;
