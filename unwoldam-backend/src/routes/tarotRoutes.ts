import { Router } from 'express';
import * as tarotController from '../controllers/tarotController';
import { authenticate } from '../middleware/auth';
import { checkReadingLimit, requireSubscription } from '../middleware/subscription';
import { readingLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * @route   GET /api/tarot/daily-fortune
 * @desc    Get today's fortune (daily reading)
 * @access  Private
 */
router.get(
  '/daily-fortune',
  authenticate,
  checkReadingLimit,
  readingLimiter,
  tarotController.getDailyFortune
);

/**
 * @route   POST /api/tarot/reading/single
 * @desc    Create single card reading
 * @access  Private
 */
router.post(
  '/reading/single',
  authenticate,
  checkReadingLimit,
  readingLimiter,
  tarotController.createReading
);

/**
 * @route   POST /api/tarot/reading/three-card
 * @desc    Create three-card spread reading
 * @access  Private
 */
router.post(
  '/reading/three-card',
  authenticate,
  checkReadingLimit,
  readingLimiter,
  tarotController.createReading
);

/**
 * @route   POST /api/tarot/reading/celtic-cross
 * @desc    Create Celtic Cross spread reading (Premium only)
 * @access  Private (Premium)
 */
router.post(
  '/reading/celtic-cross',
  authenticate,
  requireSubscription('premium'),
  checkReadingLimit,
  readingLimiter,
  tarotController.createReading
);

/**
 * @route   GET /api/tarot/reading/history
 * @desc    Get reading history
 * @access  Private
 */
router.get(
  '/reading/history',
  authenticate,
  tarotController.getReadingHistory
);

/**
 * @route   GET /api/tarot/reading/:id
 * @desc    Get specific reading by ID
 * @access  Private
 */
router.get(
  '/reading/:id',
  authenticate,
  tarotController.getReadingById
);

export default router;
