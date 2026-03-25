/**
 * Production-Grade Logging System
 *
 * Uses Winston for structured logging with:
 * - Environment-specific log levels
 * - File rotation
 * - PII masking
 * - Request ID tracking
 * - No console.log in production
 *
 * Usage:
 *   const logger = require('./utils/logger');
 *   logger.info('User logged in', { userId: '123', email: 'user@example.com' });
 *   logger.error('Database connection failed', { error: err.message });
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Ensure logs directory exists
const logDir = config.logging.filePath;
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom format to mask sensitive data
const maskSensitiveData = winston.format((info) => {
  const sensitiveFields = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'jwt',
    'secret',
    'apiKey',
    'creditCard',
    'ssn',
    'tfn', // Australian Tax File Number
  ];

  const mask = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;

    const masked = Array.isArray(obj) ? [...obj] : { ...obj };

    for (const key in masked) {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some((field) => lowerKey.includes(field))) {
        masked[key] = '[REDACTED]';
      } else if (typeof masked[key] === 'object' && masked[key] !== null) {
        masked[key] = mask(masked[key]);
      }
    }

    return masked;
  };

  return mask(info);
});

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  maskSensitiveData(),
  winston.format.json()
);

// Console format (for development)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(
    ({ timestamp, level, message, requestId, ...meta }) => {
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
      const reqId = requestId ? `[${requestId}]` : '';
      return `${timestamp} ${level} ${reqId}: ${message} ${metaStr}`;
    }
  )
);

// Transport configuration
const transports = [];

// Console transport (development/staging only)
if (config.env !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: config.logging.level,
    })
  );
}

// File transports (always active)
transports.push(
  // All logs
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    format: logFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }),
  // Error logs
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: logFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  })
);

// Production-specific transports
if (config.isProduction()) {
  // In production, also log to console but with JSON format for log aggregation
  transports.push(
    new winston.transports.Console({
      format: logFormat,
      level: 'error', // Only errors to console in production
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Add request context to logger
logger.addRequestContext = (requestId, metadata = {}) => {
  return {
    info: (message, meta = {}) => logger.info(message, { requestId, ...metadata, ...meta }),
    error: (message, meta = {}) => logger.error(message, { requestId, ...metadata, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { requestId, ...metadata, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { requestId, ...metadata, ...meta }),
  };
};

// Add audit log method (for PIPEDA compliance)
logger.audit = (action, data) => {
  logger.info('AUDIT', {
    action,
    timestamp: new Date().toISOString(),
    ...data,
  });
};

// Override console methods in production (catch any stray console.log)
if (config.isProduction()) {
  console.log = (...args) => logger.info(args.join(' '));
  console.error = (...args) => logger.error(args.join(' '));
  console.warn = (...args) => logger.warn(args.join(' '));
  console.info = (...args) => logger.info(args.join(' '));
  console.debug = (...args) => logger.debug(args.join(' '));
}

module.exports = logger;
