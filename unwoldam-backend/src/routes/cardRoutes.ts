import { Router } from 'express';
import * as cardController from '../controllers/cardController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/cards
 * @desc    Get all tarot cards
 * @access  Public (optional auth)
 */
router.get('/', optionalAuth, cardController.getAllCards);

/**
 * @route   GET /api/cards/:id
 * @desc    Get specific card by ID
 * @access  Public (optional auth)
 */
router.get('/:id', optionalAuth, cardController.getCardById);

/**
 * @route   GET /api/cards/combination
 * @desc    Get interpretation for card combination
 * @access  Public (optional auth)
 */
router.get('/combination/interpret', optionalAuth, cardController.getCardCombination);

export default router;
