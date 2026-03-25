/**
 * Security Middleware
 *
 * Production-grade security hardening:
 * - Helmet for HTTP headers
 * - Rate limiting (per IP and per user)
 * - MongoDB injection protection
 * - XSS protection
 * - HPP (HTTP Parameter Pollution) protection
 * - Request ID tracking
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Helmet configuration (per environment)
 */
const helmetConfig = () => {
  const options = {
    contentSecurityPolicy: config.security.helmetCSP,
    crossOriginEmbedderPolicy: false,
  };

  return helmet(options);
};

/**
 * Rate Limiter - Global
 */
const globalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      requestId: req.id,
    });
    res.status(429).json({
      error: 'Too many requests, please try again later.',
    });
  },
});

/**
 * Rate Limiter - Auth Routes (stricter)
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.isProduction() ? 5 : 50, // 5 attempts in prod, 50 in dev
  message: {
    error: 'Too many login attempts, please try again later.',
  },
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email,
      requestId: req.id,
    });
    res.status(429).json({
      error: 'Too many login attempts, please try again after 15 minutes.',
    });
  },
});

/**
 * Rate Limiter - Per Company/Tenant
 * Prevents one company from consuming all resources
 */
const companyRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests * 10, // Higher limit for company-level
  keyGenerator: (req, res) => {
    // Use companyId from authenticated user, otherwise fall back to default IP handling
    if (req.user?.companyId) {
      return req.user.companyId;
    }
    // Return undefined to use default IP key generation (handles IPv6 properly)
    return undefined;
  },
  message: {
    error: 'Company request limit exceeded.',
  },
});

/**
 * Request ID Middleware
 * Adds unique ID to every request for tracing
 */
const requestId = (req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
};

/**
 * MongoDB Injection Protection
 * Sanitizes user input to prevent NoSQL injection
 */
const mongoInjectionProtection = mongoSanitize({
  onSanitize: ({ req, key }) => {
    logger.warn('MongoDB injection attempt detected', {
      ip: req.ip,
      key,
      requestId: req.id,
    });
  },
});

/**
 * XSS Protection (deprecated xss-clean replacement)
 * Note: xss-clean is deprecated, consider using express-validator instead
 */
const xssProtection = (req, res, next) => {
  // Basic XSS protection - sanitize common patterns
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/<script[^>]*>.*?<\/script>/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

/**
 * HPP Protection
 * Prevents HTTP Parameter Pollution
 */
const hppProtection = hpp({
  whitelist: [
    // Allow duplicate parameters for these fields (e.g., filtering)
    'status',
    'role',
    'shiftType',
    'siteId',
    'employeeId',
  ],
});

/**
 * CORS Configuration (allow all origins)
 */
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  optionsSuccessStatus: 200,
};

/**
 * Trust Proxy (required for AWS EC2 behind load balancer)
 */
const trustProxy = (app) => {
  if (config.security.trustProxy) {
    app.set('trust proxy', 1);
    logger.info('Trust proxy enabled');
  }
};

/**
 * Security Headers Logging
 */
const logSecurityHeaders = (req, res, next) => {
  if (config.isDevelopment()) {
    logger.debug('Security headers', {
      'user-agent': req.headers['user-agent'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
      origin: req.headers.origin,
      requestId: req.id,
    });
  }
  next();
};

module.exports = {
  helmetConfig,
  globalRateLimiter,
  authRateLimiter,
  companyRateLimiter,
  requestId,
  mongoInjectionProtection,
  xssProtection,
  hppProtection,
  corsOptions,
  trustProxy,
  logSecurityHeaders,
};
