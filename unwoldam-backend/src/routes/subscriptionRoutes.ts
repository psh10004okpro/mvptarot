import { Router } from 'express';
import * as subscriptionController from '../controllers/subscriptionController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/subscription/plans
 * @desc    Get all subscription plans
 * @access  Public
 */
router.get('/plans', subscriptionController.getPlans);

/**
 * @route   POST /api/subscription/subscribe
 * @desc    Subscribe to a plan
 * @access  Private
 */
router.post('/subscribe', authenticate, subscriptionController.subscribe);

/**
 * @route   GET /api/subscription/status
 * @desc    Get subscription status
 * @access  Private
 */
router.get('/status', authenticate, subscriptionController.getStatus);

/**
 * @route   PUT /api/subscription/cancel
 * @desc    Cancel subscription
 * @access  Private
 */
router.put('/cancel', authenticate, subscriptionController.cancelSubscription);

/**
 * @route   GET /api/subscription/history
 * @desc    Get subscription history
 * @access  Private
 */
router.get('/history', authenticate, subscriptionController.getHistory);

export default router;
