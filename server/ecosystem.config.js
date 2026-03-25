/**
 * PM2 Ecosystem Configuration
 *
 * Production-grade process management for Node.js applications
 *
 * Usage:
 *   Development:  pm2 start ecosystem.config.js --env development
 *   Staging:      pm2 start ecosystem.config.js --env staging
 *   Production:   pm2 start ecosystem.config.js --env production
 *
 * Commands:
 *   pm2 start ecosystem.config.js         # Start with production env
 *   pm2 stop roster-api                   # Stop the app
 *   pm2 restart roster-api                # Restart the app
 *   pm2 reload roster-api                 # Zero-downtime reload
 *   pm2 logs roster-api                   # View logs
 *   pm2 monit                             # Monitor CPU/memory
 *   pm2 save                              # Save current process list
 *   pm2 startup                           # Generate startup script
 */

module.exports = {
  apps: [
    {
      // Application name
      name: 'roster-api',

      // Script to execute
      script: './src/index.js',

      // Number of instances (cluster mode)
      // Use 'max' to utilize all CPU cores, or specify a number
      instances: process.env.PM2_INSTANCES || 1,

      // Execution mode: 'cluster' or 'fork'
      // Use 'cluster' for production to utilize multiple cores
      exec_mode: 'fork',

      // Watch for file changes (disable in production)
      watch: false,

      // Ignore these files when watching
      ignore_watch: ['node_modules', 'logs', '.git'],

      // Maximum memory threshold before auto-restart (in MB)
      max_memory_restart: '1G',

      // Environment variables for all environments
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // Development environment
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000,
        watch: true,
      },

      // Staging environment
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5000,
      },

      // Production environment
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Auto-restart on crash
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,

      // Cron restart (optional - restart daily at 3 AM)
      // cron_restart: '0 3 * * *',

      // Merge logs from all instances
      merge_logs: true,

      // Advanced features
      exp_backoff_restart_delay: 100,

      // Shutdown signal
      shutdown_with_message: true,
    },
  ],

  // Deployment configuration (optional)
  deploy: {
    // Production deployment
    production: {
      user: 'ubuntu',
      host: ['your-ec2-instance-ip-here'],
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/roster-website.git',
      path: '/home/ubuntu/roster-api',
      'post-deploy':
        'npm install && pm2 reload ecosystem.config.js --env production && pm2 save',
      env: {
        NODE_ENV: 'production',
      },
    },

    // Staging deployment
    staging: {
      user: 'ubuntu',
      host: ['your-staging-ec2-ip-here'],
      ref: 'origin/staging',
      repo: 'git@github.com:yourusername/roster-website.git',
      path: '/home/ubuntu/roster-api-staging',
      'post-deploy':
        'npm install && pm2 reload ecosystem.config.js --env staging && pm2 save',
      env: {
        NODE_ENV: 'staging',
      },
    },
  },
};
