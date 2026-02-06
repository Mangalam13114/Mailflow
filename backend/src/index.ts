import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import apiRoutes from './routes';

// Import config
import prisma from './config/database';
import redisConnection from './config/redis';

const app: Express = express();
const PORT = process.env.PORT || 5000;

// ================================
// MIDDLEWARE
// ================================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ================================
// API ROUTES
// ================================
app.use('/api', apiRoutes);

// ================================
// ROOT ROUTE
// ================================
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to ReachInbox API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      scheduleEmails: 'POST /api/emails/schedule',
      scheduleSingle: 'POST /api/emails/schedule-single',
      getScheduled: 'GET /api/emails/scheduled',
      getSent: 'GET /api/emails/sent',
      getStats: 'GET /api/emails/stats',
      cancelEmail: 'DELETE /api/emails/:id',
    },
  });
});

// ================================
// HEALTH CHECK
// ================================
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
  });
});

// ================================
// 404 HANDLER
// ================================
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// ================================
// START SERVER
// ================================
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Redis connection is tested via the import
    console.log('✅ Redis connection established');

    // Start server
    app.listen(PORT, () => {
      console.log('═══════════════════════════════════════════');
      console.log(`   ⚡ Server is running on http://localhost:${PORT}`);
      console.log('═══════════════════════════════════════════');
      console.log('');
      console.log('📍 Available Endpoints:');
      console.log(`   GET  http://localhost:${PORT}/`);
      console.log(`   GET  http://localhost:${PORT}/health`);
      console.log(`   GET  http://localhost:${PORT}/api/health`);
      console.log(`   POST http://localhost:${PORT}/api/emails/schedule`);
      console.log(`   POST http://localhost:${PORT}/api/emails/schedule-single`);
      console.log(`   GET  http://localhost:${PORT}/api/emails/scheduled`);
      console.log(`   GET  http://localhost:${PORT}/api/emails/sent`);
      console.log(`   GET  http://localhost:${PORT}/api/emails/stats`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;