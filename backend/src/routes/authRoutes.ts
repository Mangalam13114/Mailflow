import { Router } from 'express';
import authController from '../controllers/authController';

const router = Router();

// ================================
// AUTH ROUTES
// ================================

/**
 * GET /api/auth/google
 * Redirect to Google OAuth
 */
router.get('/google', (req, res) => authController.googleLogin(req, res));

/**
 * GET /api/auth/google/callback
 * Google OAuth callback
 */
router.get('/google/callback', (req, res) => authController.googleCallback(req, res));

/**
 * GET /api/auth/me
 * Get current logged-in user
 */
router.get('/me', (req, res) => authController.getCurrentUser(req, res));

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', (req, res) => authController.logout(req, res));

export default router;