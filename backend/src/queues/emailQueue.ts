import { Queue } from 'bullmq';
import redisConnection from '../config/redis';

// ================================
// EMAIL JOB DATA TYPE
// ================================
export interface EmailJobData {
  emailId: string;        // Database email ID
  to: string;             // Recipient email
  subject: string;        // Email subject
  body: string;           // Email body (HTML or text)
  senderId?: string;      // Sender ID (for SMTP credentials)
  userId: string;         // User who scheduled this email
  attemptNumber?: number; // For retry tracking
}

// ================================
// CREATE EMAIL QUEUE
// ================================
const emailQueue = new Queue<EmailJobData>('email-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,                    // Retry 3 times if failed
    backoff: {
      type: 'exponential',          // Wait longer between each retry
      delay: 5000,                  // Start with 5 seconds
    },
    removeOnComplete: {
      count: 1000,                  // Keep last 1000 completed jobs
      age: 24 * 60 * 60,            // Remove after 24 hours
    },
    removeOnFail: {
      count: 500,                   // Keep last 500 failed jobs
      age: 7 * 24 * 60 * 60,        // Remove after 7 days
    },
  },
});

console.log('📧 Email queue initialized');

export default emailQueue;