import { Router } from 'express';
import authRoutes from './authRoutes';
import tarotRoutes from './tarotRoutes';
import cardRoutes from './cardRoutes';
import subscriptionRoutes from './subscriptionRoutes';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/tarot', tarotRoutes);
router.use('/cards', cardRoutes);
router.use('/subscription', subscriptionRoutes);

export default router;
