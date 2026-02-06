// ================================
// API REQUEST TYPES
// ================================

export interface ScheduleEmailRequest {
  emails: {
    to: string;
    subject: string;
    body: string;
  }[];
  startTime: string;           // ISO date string
  delayBetweenEmails: number;  // milliseconds
  hourlyLimit?: number;        // optional override
}

export interface ScheduleSingleEmailRequest {
  to: string;
  subject: string;
  body: string;
  scheduledAt: string;  // ISO date string
}

// ================================
// API RESPONSE TYPES
// ================================

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface EmailResponse {
  id: string;
  to: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt: string;
  sentAt?: string;
  error?: string;
  createdAt: string;
}

export interface QueueStatsResponse {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
}

// ================================
// USER TYPES (for auth later)
// ================================

export interface UserPayload {
  id: string;
  email: string;
  name?: string;
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}