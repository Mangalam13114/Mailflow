import emailQueue, { EmailJobData } from '../queues/emailQueue';
import prisma from '../config/database';
import { EmailStatus } from '@prisma/client';

// ================================
// SCHEDULER SERVICE
// ================================
class SchedulerService {
  
  /**
   * Schedule a single email to be sent at a specific time
   */
  async scheduleEmail(data: {
    emailId: string;
    to: string;
    subject: string;
    body: string;
    scheduledAt: Date;
    userId: string;
    senderId?: string;
  }): Promise<string> {
    
    // Calculate delay in milliseconds
    const now = new Date();
    const scheduledTime = new Date(data.scheduledAt);
    let delay = scheduledTime.getTime() - now.getTime();
    
    // If scheduled time is in the past, send immediately
    if (delay < 0) {
      delay = 0;
    }

    // Create job data
    const jobData: EmailJobData = {
      emailId: data.emailId,
      to: data.to,
      subject: data.subject,
      body: data.body,
      userId: data.userId,
      senderId: data.senderId,
    };

    // Add job to queue with delay
    const job = await emailQueue.add(
      `email-${data.emailId}`,  // Job name
      jobData,                   // Job data
      {
        delay,                   // Delay in ms
        jobId: data.emailId,     // Use email ID as job ID (prevents duplicates)
      }
    );

    // Update email status in database
    await prisma.email.update({
      where: { id: data.emailId },
      data: {
        status: EmailStatus.QUEUED,
        jobId: job.id,
      },
    });

    console.log(`📅 Email scheduled: ${data.emailId} | Delay: ${delay}ms | To: ${data.to}`);
    
    return job.id!;
  }

  /**
   * Schedule multiple emails with delay between each
   */
  async scheduleBulkEmails(data: {
    emails: Array<{
      to: string;
      subject: string;
      body: string;
    }>;
    startTime: Date;
    delayBetweenEmails: number; // in milliseconds
    userId: string;
    senderId?: string;
  }): Promise<string[]> {
    
    const jobIds: string[] = [];
    let currentScheduleTime = new Date(data.startTime);

    for (const emailData of data.emails) {
      // Create email record in database
      const email = await prisma.email.create({
        data: {
          to: emailData.to,
          subject: emailData.subject,
          body: emailData.body,
          scheduledAt: currentScheduleTime,
          userId: data.userId,
          senderId: data.senderId,
          status: EmailStatus.SCHEDULED,
        },
      });

      // Schedule the email
      const jobId = await this.scheduleEmail({
        emailId: email.id,
        to: email.to,
        subject: email.subject,
        body: email.body,
        scheduledAt: currentScheduleTime,
        userId: data.userId,
        senderId: data.senderId,
      });

      jobIds.push(jobId);

      // Add delay for next email
      currentScheduleTime = new Date(currentScheduleTime.getTime() + data.delayBetweenEmails);
    }

    console.log(`📧 Bulk scheduled: ${jobIds.length} emails`);
    
    return jobIds;
  }

  /**
   * Cancel a scheduled email
   */
  async cancelEmail(emailId: string): Promise<boolean> {
    try {
      const job = await emailQueue.getJob(emailId);
      
      if (job) {
        await job.remove();
      }

      // Update database
      await prisma.email.update({
        where: { id: emailId },
        data: {
          status: EmailStatus.CANCELLED,
        },
      });

      console.log(`❌ Email cancelled: ${emailId}`);
      return true;
    } catch (error) {
      console.error(`Error cancelling email ${emailId}:`, error);
      return false;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      emailQueue.getWaitingCount(),
      emailQueue.getActiveCount(),
      emailQueue.getCompletedCount(),
      emailQueue.getFailedCount(),
      emailQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + delayed,
    };
  }
}

export default new SchedulerService();