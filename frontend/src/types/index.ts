// ================================
// USER TYPES
// ================================
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  createdAt: string;
}

// ================================
// EMAIL TYPES
// ================================
export interface Email {
  id: string;
  to: string;
  subject: string;
  body: string;
  status: EmailStatus;
  scheduledAt: string;
  sentAt?: string;
  error?: string;
  createdAt: string;
}

export type EmailStatus = 
  | 'SCHEDULED' 
  | 'QUEUED' 
  | 'SENDING' 
  | 'SENT' 
  | 'FAILED' 
  | 'CANCELLED';

// ================================
// API RESPONSE TYPES
// ================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// ================================
// QUEUE STATS
// ================================
export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
}