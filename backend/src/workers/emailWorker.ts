import { Worker, Job } from 'bullmq';
import redisConnection from '../config/redis';
import config from '../config/env';
import emailService from '../services/emailService';
import rateLimiterService from '../services/rateLimiterService';
import { EmailJobData } from '../queues/emailQueue';
import prisma from '../config/database';
import { EmailStatus } from '@prisma/client';

// ================================
// HELPER: Delay function
// ================================
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ================================
// EMAIL WORKER
// ================================
const emailWorker = new Worker<EmailJobData>(
  'email-queue',
  async (job: Job<EmailJobData>) => {
    console.log(`\n📧 Processing job: ${job.id}`);
    console.log(`   To: ${job.data.to}`);
    console.log(`   Subject: ${job.data.subject}`);

    const { emailId, to, subject, body, userId } = job.data;

    try {
      // ================================
      // STEP 1: Check Rate Limit
      // ================================
      const rateStatus = await rateLimiterService.canSendEmail(userId);
      
      if (!rateStatus.allowed) {
        // Rate limit exceeded - calculate delay to next window
        const delayMs = await rateLimiterService.getDelayUntilNextWindow();
        
        console.log(`⏳ Rate limit hit! Rescheduling in ${Math.ceil(delayMs / 1000 / 60)} minutes`);
        
        // Update email status
        await prisma.email.update({
          where: { id: emailId },
          data: { status: EmailStatus.QUEUED },
        });

        // Throw error to trigger retry with delay
        throw new Error(`RATE_LIMIT_EXCEEDED:${delayMs}`);
      }

      // ================================
      // STEP 2: Add delay between emails (throttling)
      // ================================
      const emailDelay = config.emailDelayMs;
      if (emailDelay > 0) {
        console.log(`   ⏱️  Waiting ${emailDelay}ms (throttle delay)...`);
        await delay(emailDelay);
      }

      // ================================
      // STEP 3: Send the email
      // ================================
      const result = await emailService.sendEmail({
        emailId,
        to,
        subject,
        body,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to send email');
      }

      // ================================
      // STEP 4: Increment rate limit counter
      // ================================
      await rateLimiterService.incrementCount(userId);

      // ================================
      // STEP 5: Log success
      // ================================
      console.log(`✅ Job completed: ${job.id}`);
      if (result.previewUrl) {
        console.log(`   🔗 Preview: ${result.previewUrl}`);
      }

      // Return result (stored in job)
      return {
        success: true,
        previewUrl: result.previewUrl,
        sentAt: new Date().toISOString(),
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check if it's a rate limit error
      if (errorMessage.startsWith('RATE_LIMIT_EXCEEDED:')) {
        const delayMs = parseInt(errorMessage.split(':')[1]);
        
        // Move job back to delayed state
        await job.moveToDelayed(Date.now() + delayMs, job.token);
        
        throw new Error('Rate limit exceeded - job rescheduled');
      }

      console.error(`❌ Job failed: ${job.id} - ${errorMessage}`);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: config.workerConcurrency, // Process multiple jobs in parallel
    limiter: {
      max: config.maxEmailsPerHour,        // Max jobs per duration
      duration: 60 * 60 * 1000,            // 1 hour in milliseconds
    },
  }
);

// ================================
// WORKER EVENT LISTENERS
// ================================

emailWorker.on('ready', () => {
  console.log('🚀 Email worker is ready and waiting for jobs...');
  console.log(`   Concurrency: ${config.workerConcurrency}`);
  console.log(`   Max emails/hour: ${config.maxEmailsPerHour}`);
  console.log(`   Delay between emails: ${config.emailDelayMs}ms`);
});

emailWorker.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed: ${err.message}`);
});

emailWorker.on('error', (err) => {
  console.error('❌ Worker error:', err);
});

emailWorker.on('stalled', (jobId) => {
  console.warn(`⚠️ Job ${jobId} has stalled`);
});

// ================================
// GRACEFUL SHUTDOWN
// ================================
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Closing worker gracefully...`);
  
  await emailWorker.close();
  
  console.log('Worker closed. Exiting...');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default emailWorker;