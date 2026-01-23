/**
 * Main Server Entry Point
 *
 * Production-Grade Express Server with:
 * - MongoDB/Mongoose
 * - Environment-based configuration
 * - Security hardening
 * - Request tracking
 * - API versioning
 * - Comprehensive logging
 * - Graceful shutdown
 */

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');

// Load configuration FIRST (uses dotenv-flow)
const config = require('./config');
const database = require('./config/database');
const logger = require('./utils/logger');

// Security middleware
const {
  helmetConfig,
  globalRateLimiter,
  requestId,
  mongoInjectionProtection,
  xssProtection,
  hppProtection,
  corsOptions,
  trustProxy,
  logSecurityHeaders,
} = require('./middleware/security');

const errorHandler = require('./middleware/errorHandler');

// Initialize Express app
const app = express();

// Trust proxy (required for AWS EC2 behind load balancer)
trustProxy(app);

// =========================================
// MIDDLEWARE STACK (ORDER MATTERS!)
// =========================================

// 1. Request ID (must be first for logging)
app.use(requestId);

// 2. Security headers
app.use(helmetConfig());

// 3. CORS
app.use(cors(corsOptions));

// 4. Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 5. Compression (gzip)
if (config.features.compression) {
  app.use(compression());
}

// 6. Request logging (development/staging only)
if (config.features.requestLogging && !config.isProduction()) {
  app.use(
    morgan('combined', {
      stream: {
        write: (message) => logger.http(message.trim()),
      },
    })
  );
}

// 7. Security protection
// app.use(mongoInjectionProtection); // Disabled due to compatibility issue - using express-validator instead
app.use(xssProtection);
app.use(hppProtection);
app.use(logSecurityHeaders);

// 8. Global rate limiting
if (config.isProduction() || config.isStaging()) {
  app.use(globalRateLimiter);
}

// =========================================
// HEALTH CHECK ROUTES (NO AUTH REQUIRED)
// =========================================
app.use('/health', require('./routes/health'));

// =========================================
// API ROUTES (VERSIONED)
// =========================================

// API v1
const v1Router = express.Router();

// Mount v1 routes
v1Router.use('/sites', require('./routes/sites.routes'));
v1Router.use('/scheduler', require('./routes/scheduler.routes'));
v1Router.use('/weather', require('./routes/weather.routes'));
v1Router.use('/employees', require('./routes/employee.routes'));
v1Router.use('/companies', require('./routes/company.routes'));
v1Router.use('/users', require('./routes/user.routes'));

// TODO: Add auth routes (login, register, password reset)
// v1Router.use('/auth', require('./routes/auth.routes'));

// Mount API version
app.use('/api/v1', v1Router);

// Legacy routes (redirect to v1)
app.use('/api', v1Router);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: config.app.name,
    version: '1.0.0',
    environment: config.env,
    apiVersion: 'v1',
    documentation: config.features.apiDocs ? '/api-docs' : undefined,
  });
});

// =========================================
// ERROR HANDLING
// =========================================

// 404 handler for unknown routes
app.use((req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    requestId: req.id,
  });

  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.path}`,
    requestId: req.id,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// =========================================
// SERVER STARTUP
// =========================================

const PORT = config.app.port;

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    logger.info('Connecting to database...');
    await database.connect();
    logger.info('✓ Database connected successfully');

    // 2. Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info('✓ Server started successfully', {
        port: PORT,
        environment: config.env,
        nodeVersion: process.version,
        timezone: config.app.timezone,
      });

      logger.info(`✓ Server running on ${config.app.url}`);
      logger.info(`✓ Client URL: ${config.client.url}`);

      if (config.isDevelopment()) {
        logger.info('🔥 Development mode enabled');
        logger.info(`📊 Health check: ${config.app.url}/health`);
        logger.info(`🔍 Detailed health: ${config.app.url}/health/detailed`);
      }
    });

    // =========================================
    // GRACEFUL SHUTDOWN
    // =========================================

    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      // 1. Stop accepting new connections
      server.close(async () => {
        logger.info('✓ HTTP server closed');

        try {
          // 2. Close database connection
          await database.disconnect();
          logger.info('✓ Database connection closed');

          // 3. Exit process
          logger.info('✓ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('✗ Error during shutdown', { error: error.message });
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('✗ Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('✗ Uncaught Exception', {
        error: error.message,
        stack: error.stack,
      });
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('✗ Unhandled Rejection', {
        reason,
        promise,
      });
      gracefulShutdown('unhandledRejection');
    });
  } catch (error) {
    logger.error('✗ Failed to start server', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
