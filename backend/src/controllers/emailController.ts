import { Request, Response } from 'express';
import prisma from '../config/database';
import schedulerService from '../services/schedulerService';
import rateLimiterService from '../services/rateLimiterService';
import { EmailStatus } from '@prisma/client';
import {
  ScheduleEmailRequest,
  ScheduleSingleEmailRequest,
  ApiResponse,
  EmailResponse,
} from '../types';

// ================================
// EMAIL CONTROLLER
// ================================

class EmailController {
  /**
   * Schedule multiple emails (bulk)
   * POST /api/emails/schedule
   */
  async scheduleEmails(req: Request, res: Response): Promise<void> {
    try {
      const { emails, startTime, delayBetweenEmails } = req.body as ScheduleEmailRequest;

      // Validation
      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        res.status(400).json({
          success: false,
          error: 'emails array is required and must not be empty',
        } as ApiResponse);
        return;
      }

      if (!startTime) {
        res.status(400).json({
          success: false,
          error: 'startTime is required',
        } as ApiResponse);
        return;
      }

      // For now, use a default user ID (we'll add auth later)
      // In production, this would come from req.user
      let user = await prisma.user.findFirst();
      
      if (!user) {
        // Create a default user for testing
        user = await prisma.user.create({
          data: {
            email: 'test@reachinbox.com',
            name: 'Test User',
          },
        });
      }

      // Schedule the emails
      const jobIds = await schedulerService.scheduleBulkEmails({
        emails,
        startTime: new Date(startTime),
        delayBetweenEmails: delayBetweenEmails || 2000,
        userId: user.id,
      });

      res.status(201).json({
        success: true,
        message: `Successfully scheduled ${jobIds.length} emails`,
        data: {
          scheduledCount: jobIds.length,
          jobIds,
          startTime,
          delayBetweenEmails: delayBetweenEmails || 2000,
        },
      } as ApiResponse);

    } catch (error) {
      console.error('Error scheduling emails:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to schedule emails',
      } as ApiResponse);
    }
  }

  /**
   * Schedule a single email
   * POST /api/emails/schedule-single
   */
  async scheduleSingleEmail(req: Request, res: Response): Promise<void> {
    try {
      const { to, subject, body, scheduledAt } = req.body as ScheduleSingleEmailRequest;

      // Validation
      if (!to || !subject || !body || !scheduledAt) {
        res.status(400).json({
          success: false,
          error: 'to, subject, body, and scheduledAt are required',
        } as ApiResponse);
        return;
      }

      // Get or create default user
      let user = await prisma.user.findFirst();
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: 'test@reachinbox.com',
            name: 'Test User',
          },
        });
      }

      // Create email in database
      const email = await prisma.email.create({
        data: {
          to,
          subject,
          body,
          scheduledAt: new Date(scheduledAt),
          userId: user.id,
          status: EmailStatus.SCHEDULED,
        },
      });

      // Schedule the email
      const jobId = await schedulerService.scheduleEmail({
        emailId: email.id,
        to,
        subject,
        body,
        scheduledAt: new Date(scheduledAt),
        userId: user.id,
      });

      res.status(201).json({
        success: true,
        message: 'Email scheduled successfully',
        data: {
          id: email.id,
          jobId,
          to,
          subject,
          scheduledAt,
        },
      } as ApiResponse);

    } catch (error) {
      console.error('Error scheduling email:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to schedule email',
      } as ApiResponse);
    }
  }

  /**
   * Get all scheduled emails (not yet sent)
   * GET /api/emails/scheduled
   */
  async getScheduledEmails(req: Request, res: Response): Promise<void> {
    try {
      const emails = await prisma.email.findMany({
        where: {
          status: {
            in: [EmailStatus.SCHEDULED, EmailStatus.QUEUED],
          },
        },
        orderBy: {
          scheduledAt: 'asc',
        },
        select: {
          id: true,
          to: true,
          subject: true,
          body: true,
          status: true,
          scheduledAt: true,
          createdAt: true,
        },
      });

      const response: EmailResponse[] = emails.map(email => ({
        id: email.id,
        to: email.to,
        subject: email.subject,
        body: email.body,
        status: email.status,
        scheduledAt: email.scheduledAt.toISOString(),
        createdAt: email.createdAt.toISOString(),
      }));

      res.status(200).json({
        success: true,
        data: response,
        message: `Found ${emails.length} scheduled emails`,
      } as ApiResponse<EmailResponse[]>);

    } catch (error) {
      console.error('Error fetching scheduled emails:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch scheduled emails',
      } as ApiResponse);
    }
  }

  /**
   * Get all sent emails
   * GET /api/emails/sent
   */
  async getSentEmails(req: Request, res: Response): Promise<void> {
    try {
      const emails = await prisma.email.findMany({
        where: {
          status: {
            in: [EmailStatus.SENT, EmailStatus.FAILED],
          },
        },
        orderBy: {
          sentAt: 'desc',
        },
        select: {
          id: true,
          to: true,
          subject: true,
          body: true,
          status: true,
          scheduledAt: true,
          sentAt: true,
          error: true,
          createdAt: true,
        },
      });

      const response: EmailResponse[] = emails.map(email => ({
        id: email.id,
        to: email.to,
        subject: email.subject,
        body: email.body,
        status: email.status,
        scheduledAt: email.scheduledAt.toISOString(),
        sentAt: email.sentAt?.toISOString(),
        error: email.error || undefined,
        createdAt: email.createdAt.toISOString(),
      }));

      res.status(200).json({
        success: true,
        data: response,
        message: `Found ${emails.length} sent emails`,
      } as ApiResponse<EmailResponse[]>);

    } catch (error) {
      console.error('Error fetching sent emails:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sent emails',
      } as ApiResponse);
    }
  }

  /**
   * Get queue statistics
   * GET /api/emails/stats
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const [queueStats, rateLimitStats] = await Promise.all([
        schedulerService.getQueueStats(),
        rateLimiterService.getStats(),
      ]);

      res.status(200).json({
        success: true,
        data: {
          queue: queueStats,
          rateLimit: rateLimitStats,
        },
      } as ApiResponse);

    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics',
      } as ApiResponse);
    }
  }

  /**
   * Cancel a scheduled email
   * DELETE /api/emails/:id
   */
    /**
   * Cancel a scheduled email
   * DELETE /api/emails/:id
   */
  async cancelEmail(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Email ID is required',
        } as ApiResponse);
        return;
      }

      // Check if email exists
      const email = await prisma.email.findUnique({
        where: { id },
      });

      if (!email) {
        res.status(404).json({
          success: false,
          error: 'Email not found',
        } as ApiResponse);
        return;
      }

      // Can only cancel scheduled/queued emails
      if (!['SCHEDULED', 'QUEUED'].includes(email.status)) {
        res.status(400).json({
          success: false,
          error: `Cannot cancel email with status: ${email.status}`,
        } as ApiResponse);
        return;
      }

      // Cancel the email
      const cancelled = await schedulerService.cancelEmail(id);

      if (cancelled) {
        res.status(200).json({
          success: true,
          message: 'Email cancelled successfully',
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to cancel email',
        } as ApiResponse);
      }

    } catch (error) {
      console.error('Error cancelling email:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel email',
      } as ApiResponse);
    }
  }
}

export default new EmailController();