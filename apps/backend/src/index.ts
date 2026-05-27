import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { RATE_LIMITS, API_BASE_PATH } from '@vakiloncall/shared';
import { authRouter } from './routes/auth';
import { userRouter } from './routes/user';
import { lawyerRouter } from './routes/lawyer';
import { tokenRouter } from './routes/tokens';
import { callRouter } from './routes/calls';
import { errorHandler } from './middleware/errorHandler';
import { initSocketHandlers } from './socket/handler';
import { logger } from './utils/logger';

const app = express();
const httpServer = createServer(app);
const PORT = parseInt(process.env.PORT ?? '3000', 10);

// =============================================
// SOCKET.IO SETUP
// =============================================
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*', // Restrict in production
    methods: ['GET', 'POST'],
  },
});

// Make io accessible in routes
app.set('io', io);

// =============================================
// GLOBAL MIDDLEWARE
// =============================================
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limiter
app.use(
  rateLimit({
    windowMs: RATE_LIMITS.GENERAL.windowMs,
    max: RATE_LIMITS.GENERAL.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' },
    },
  })
);

// =============================================
// HEALTH CHECK
// =============================================
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    },
  });
});

// =============================================
// API ROUTES
// =============================================
app.use(`${API_BASE_PATH}/auth`, authRouter);
app.use(`${API_BASE_PATH}/user`, userRouter);
app.use(`${API_BASE_PATH}/lawyer`, lawyerRouter);
app.use(`${API_BASE_PATH}/tokens`, tokenRouter);
app.use(`${API_BASE_PATH}/calls`, callRouter);

// =============================================
// 404 HANDLER
// =============================================
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
});

// =============================================
// GLOBAL ERROR HANDLER
// =============================================
app.use(errorHandler);

// =============================================
// SOCKET.IO — Matching Engine & Real-time Events
// =============================================
initSocketHandlers(io);

// =============================================
// START SERVER
// =============================================
httpServer.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV ?? 'development' }, `🚀 VakilOnCall API server running`);
});

export { app, io };
