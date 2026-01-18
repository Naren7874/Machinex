import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

// Import database and routes
import database from './config/database';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(compression()); // Compress responses
app.use(morgan('dev')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Health check route
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Machinery Marketplace API',
    database: database.getConnectionStatus(),
  });
});

// API Routes
app.use('/api', routes);

// 404 Handler
app.use(notFoundHandler);

// Error Handler
app.use(errorHandler);

// Connect to database and start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await database.connect();

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
      logger.info(`📚 API Base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Closing server...');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Closing server...');
  await database.disconnect();
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer();

export default app;