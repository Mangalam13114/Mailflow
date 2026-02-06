import nodemailer from 'nodemailer';
import prisma from '../config/database';
import { EmailStatus } from '@prisma/client';

// ================================
// EMAIL SERVICE
// ================================
class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private etherealAccount: { user: string; pass: string } | null = null;

  /**
   * Initialize Ethereal Email account and transporter
   */
  async initialize(): Promise<void> {
    try {
      // Create Ethereal test account
      const testAccount = await nodemailer.createTestAccount();
      
      this.etherealAccount = {
        user: testAccount.user,
        pass: testAccount.pass,
      };

      // Create transporter with Ethereal credentials
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      console.log('✅ Ethereal Email initialized');
      console.log(`📧 Ethereal User: ${testAccount.user}`);
      console.log(`🔗 View emails at: https://ethereal.email/login`);
      console.log(`   Login with: ${testAccount.user} / ${testAccount.pass}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize Ethereal Email:', error);
      throw error;
    }
  }

  /**
   * Get transporter (initialize if needed)
   */
  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (!this.transporter) {
      await this.initialize();
    }
    return this.transporter!;
  }

  /**
   * Send an email using Ethereal
   */
  async sendEmail(data: {
    emailId: string;
    to: string;
    subject: string;
    body: string;
  }): Promise<{ success: boolean; previewUrl?: string; error?: string }> {
    
    try {
      const transporter = await this.getTransporter();

      // Update status to SENDING
      await prisma.email.update({
        where: { id: data.emailId },
        data: { status: EmailStatus.SENDING },
      });

      // Send the email
      const info = await transporter.sendMail({
        from: `"ReachInbox" <${this.etherealAccount?.user}>`,
        to: data.to,
        subject: data.subject,
        html: data.body,
        text: data.body.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      });

      // Get preview URL
      const previewUrl = nodemailer.getTestMessageUrl(info);

      // Update database - mark as SENT
      await prisma.email.update({
        where: { id: data.emailId },
        data: {
          status: EmailStatus.SENT,
          sentAt: new Date(),
        },
      });

      console.log(`✅ Email sent: ${data.emailId}`);
      console.log(`🔗 Preview URL: ${previewUrl}`);

      return {
        success: true,
        previewUrl: previewUrl || undefined,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update database - mark as FAILED
      await prisma.email.update({
        where: { id: data.emailId },
        data: {
          status: EmailStatus.FAILED,
          error: errorMessage,
        },
      });

      console.error(`❌ Email failed: ${data.emailId} - ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get Ethereal credentials (for debugging)
   */
  getCredentials() {
    return this.etherealAccount;
  }
}

// Export singleton instance
export default new EmailService();