import { Router } from 'express';
import emailController from '../controllers/emailController';

const router = Router();

// ================================
// EMAIL ROUTES
// ================================

/**
 * POST /api/emails/schedule
 * Schedule multiple emails (bulk)
 */
router.post('/schedule', (req, res) => emailController.scheduleEmails(req, res));

/**
 * POST /api/emails/schedule-single
 * Schedule a single email
 */
router.post('/schedule-single', (req, res) => emailController.scheduleSingleEmail(req, res));

/**
 * GET /api/emails/scheduled
 * Get all scheduled emails
 */
router.get('/scheduled', (req, res) => emailController.getScheduledEmails(req, res));

/**
 * GET /api/emails/sent
 * Get all sent emails
 */
router.get('/sent', (req, res) => emailController.getSentEmails(req, res));

/**
 * GET /api/emails/stats
 * Get queue statistics
 */
router.get('/stats', (req, res) => emailController.getStats(req, res));

/**
 * DELETE /api/emails/:id
 * Cancel a scheduled email
 */
router.delete('/:id', (req, res) => emailController.cancelEmail(req, res));

export default router; 