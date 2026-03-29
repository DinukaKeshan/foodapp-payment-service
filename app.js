import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import config from './src/config/index.js';
import logger from './src/utils/logger.js';
import errorHandler from './src/middlewares/errorHandler.js';
import { setupSwagger } from './src/docs/swagger.js';

// Routes
import paymentRoutes from './src/routes/paymentRoutes.js';
import walletRoutes from './src/routes/walletRoutes.js';
import invoiceRoutes from './src/routes/invoiceRoutes.js';

const app = express();

// ─── Security ──────────────────────────────────────────
app.use(helmet());
app.use(cors());

// ─── Rate Limiting ─────────────────────────────────────
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});
app.use('/api/', limiter);

// ─── Request Logging ───────────────────────────────────
const morganFormat = config.env === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: { write: (message) => logger.http(message.trim()) },
    skip: (req) => req.path === '/health',
  })
);

// ─── Body Parsing ──────────────────────────────────────
// NOTE: Stripe webhook needs raw body, handled at route level
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Swagger Documentation ─────────────────────────────
setupSwagger(app);

// ─── Health Check ──────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy - hi dinuka',
    service: 'payment-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── API Routes ────────────────────────────────────────
app.use('/api/payments', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/invoices', invoiceRoutes);

// ─── 404 Handler ───────────────────────────────────────
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ─── Global Error Handler ──────────────────────────────
app.use(errorHandler);

export default app;
