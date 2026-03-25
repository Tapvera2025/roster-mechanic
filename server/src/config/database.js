/**
 * MongoDB Database Connection
 *
 * Production-grade MongoDB connection with:
 * - Automatic reconnection
 * - Connection pooling
 * - Error handling
 * - Graceful shutdown
 * - Environment-specific options
 */

const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) {
      logger.warn('Database already connected');
      return;
    }

    try {
      // Set mongoose configuration
      mongoose.set('strictQuery', false);

      // Connect to MongoDB with dbName specified
      await mongoose.connect(config.database.uri, {
        dbName: config.database.dbName,
        ...config.database.options
      });

      this.isConnected = true;

      // Connection events
      mongoose.connection.on('connected', () => {
        logger.info('MongoDB connected successfully', {
          host: mongoose.connection.host,
          name: mongoose.connection.name,
        });
      });

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error', { error: err.message });
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      // Log in development
      if (config.isDevelopment()) {
        mongoose.set('debug', true);
        logger.info('MongoDB debug mode enabled');
      }

      logger.info('Database connection established');
    } catch (error) {
      logger.error('Failed to connect to database', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error disconnecting from database', { error: error.message });
      throw error;
    }
  }

  async healthCheck() {
    try {
      const state = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      };

      return {
        status: state === 1 ? 'healthy' : 'unhealthy',
        state: states[state],
        host: mongoose.connection.host,
        name: mongoose.connection.name,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }
}

// Export singleton instance
module.exports = new Database();
