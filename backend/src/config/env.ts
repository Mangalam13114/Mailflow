import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '5000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Database
  databaseUrl: process.env.DATABASE_URL!,

  // Redis
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379'),

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',

  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',

  // Email Rate Limiting
  maxEmailsPerHour: parseInt(process.env.MAX_EMAILS_PER_HOUR || '200'),
  emailDelayMs: parseInt(process.env.EMAIL_DELAY_MS || '2000'),
  workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '3'),
};

export default config;