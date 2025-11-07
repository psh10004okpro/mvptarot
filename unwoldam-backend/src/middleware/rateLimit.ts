import rateLimit from 'express-rate-limit';
import { HTTP_STATUS } from '../config/constants';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.'
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS
});

// Rate limiter for reading creation
export const readingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 readings per minute
  message: {
    success: false,
    error: 'Too many reading requests, please slow down.'
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS
});

// Rate limiter for registration
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: {
    success: false,
    error: 'Too many accounts created from this IP, please try again later.'
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS
});
