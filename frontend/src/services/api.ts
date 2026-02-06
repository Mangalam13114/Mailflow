import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// ================================
// AUTH API
// ================================
export const authAPI = {
  // Get current user
  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  // Get Google login URL
  getGoogleLoginUrl: () => {
    return `${API_URL}/api/auth/google`;
  },
};

// ================================
// EMAIL API
// ================================
export const emailAPI = {
  // Schedule multiple emails
  scheduleEmails: async (data: {
    emails: { to: string; subject: string; body: string }[];
    startTime: string;
    delayBetweenEmails: number;
  }) => {
    const response = await api.post('/api/emails/schedule', data);
    return response.data;
  },

  // Schedule single email
  scheduleSingleEmail: async (data: {
    to: string;
    subject: string;
    body: string;
    scheduledAt: string;
  }) => {
    const response = await api.post('/api/emails/schedule-single', data);
    return response.data;
  },

  // Get scheduled emails
  getScheduledEmails: async () => {
    const response = await api.get('/api/emails/scheduled');
    return response.data;
  },

  // Get sent emails
  getSentEmails: async () => {
    const response = await api.get('/api/emails/sent');
    return response.data;
  },

  // Get queue stats
  getStats: async () => {
    const response = await api.get('/api/emails/stats');
    return response.data;
  },

  // Cancel email
  cancelEmail: async (id: string) => {
    const response = await api.delete(`/api/emails/${id}`);
    return response.data;
  },
};

export default api;