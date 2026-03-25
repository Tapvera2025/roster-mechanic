/**
 * Enhanced Health Check Routes
 *
 * Provides detailed health information for monitoring systems
 */

const express = require('express');
const os = require('os');
const database = require('../config/database');
const config = require('../config');

const router = express.Router();

/**
 * GET /health
 * Basic health check
 */
router.get('/', async (req, res) => {
  try {
    const dbHealth = await database.healthCheck();

    const health = {
      status: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: config.env,
      uptime: process.uptime(),
      database: {
        status: dbHealth.status,
        state: dbHealth.state,
      },
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * GET /health/detailed
 * Detailed health information (development/staging only)
 */
router.get('/detailed', async (req, res) => {
  if (config.isProduction()) {
    return res.status(403).json({
      error: 'Detailed health check is not available in production',
    });
  }

  try {
    const dbHealth = await database.healthCheck();

    const healthDetails = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.env,
      version: process.env.npm_package_version || 'unknown',
      node: process.version,

      uptime: {
        process: process.uptime(),
        system: os.uptime(),
      },

      memory: {
        usage: process.memoryUsage(),
        free: os.freemem(),
        total: os.totalmem(),
        percentUsed: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(2) + '%',
      },

      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0]?.model,
        loadAverage: os.loadavg(),
      },

      database: {
        status: dbHealth.status,
        state: dbHealth.state,
        host: dbHealth.host,
        name: dbHealth.name,
      },

      platform: {
        os: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
      },
    };

    res.json(healthDetails);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * GET /health/ready
 * Kubernetes readiness probe
 */
router.get('/ready', async (req, res) => {
  try {
    const dbHealth = await database.healthCheck();

    if (dbHealth.status === 'healthy') {
      res.status(200).json({ ready: true });
    } else {
      res.status(503).json({ ready: false });
    }
  } catch (error) {
    res.status(503).json({ ready: false, error: error.message });
  }
});

/**
 * GET /health/live
 * Kubernetes liveness probe
 */
router.get('/live', (req, res) => {
  res.status(200).json({ alive: true });
});

module.exports = router;
