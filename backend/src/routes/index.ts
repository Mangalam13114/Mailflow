import { Router } from 'express';
import emailRoutes from './emailRoutes';
import authRoutes from './authRoutes';

const router = Router();

// ================================
// API ROUTES
// ================================

// Auth routes
router.use('/auth', authRoutes);

// Email routes
router.use('/emails', emailRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running!',
    timestamp: new Date().toISOString(),
  });
});

export default router;