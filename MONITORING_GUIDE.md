# Monitoring & Error Tracking Guide

Complete monitoring setup for production Australian roster management system.

---

## Table of Contents

1. [Monitoring Strategy](#monitoring-strategy)
2. [PM2 Monitoring](#pm2-monitoring)
3. [AWS CloudWatch Setup](#aws-cloudwatch-setup)
4. [Sentry Error Tracking](#sentry-error-tracking)
5. [MongoDB Atlas Monitoring](#mongodb-atlas-monitoring)
6. [Nginx Monitoring](#nginx-monitoring)
7. [Custom Alerts](#custom-alerts)
8. [Performance Metrics](#performance-metrics)

---

## Monitoring Strategy

### Four Pillars of Monitoring

1. **Application Health** - PM2, Sentry
2. **Infrastructure** - AWS CloudWatch, EC2 metrics
3. **Database** - MongoDB Atlas Performance Advisor
4. **Network** - Nginx access logs, rate limiting

### Key Metrics to Track

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Uptime | 99.9% | <99.5% |
| Response Time (p95) | <500ms | >1s |
| Error Rate | <0.1% | >1% |
| CPU Usage | <50% | >80% |
| Memory Usage | <60% | >80% |
| Database Query Time | <100ms | >500ms |
| API Request Rate | Varies | Sudden spike >200% |

---

## PM2 Monitoring

### 1. Real-Time Monitoring

```bash
# Terminal dashboard
pm2 monit

# Web dashboard (install PM2 Plus)
pm2 link [secret-key] [public-key]
```

### 2. PM2 Plus (Recommended for Production)

**Setup:**

1. Create account at [pm2.io](https://pm2.io)
2. Link your server:
   ```bash
   pm2 link [secret-key] [public-key]
   ```

**Features:**
- Real-time metrics
- Custom metrics
- Exception tracking
- Transaction tracing
- CPU/memory profiling

### 3. Custom Metrics

Add to your app:

```javascript
// src/utils/metrics.js
const io = require('@pm2/io');

const metrics = {
  requestCounter: io.counter({
    name: 'Total Requests',
  }),

  activeUsers: io.metric({
    name: 'Active Users',
  }),

  averageResponseTime: io.metric({
    name: 'Avg Response Time (ms)',
  }),
};

module.exports = metrics;
```

### 4. PM2 Logs

```bash
# View logs
pm2 logs roster-api

# Export logs
pm2 logs roster-api --out /path/to/export.log

# Clear logs
pm2 flush
```

---

## AWS CloudWatch Setup

### 1. Install CloudWatch Agent

```bash
# Download
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb

# Install
sudo dpkg -i amazon-cloudwatch-agent.deb

# Configure
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

### 2. CloudWatch Configuration

Create `/opt/aws/amazon-cloudwatch-agent/etc/config.json`:

```json
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "root"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/roster/combined.log",
            "log_group_name": "/roster-api/application",
            "log_stream_name": "{instance_id}"
          },
          {
            "file_path": "/var/log/roster/error.log",
            "log_group_name": "/roster-api/errors",
            "log_stream_name": "{instance_id}"
          },
          {
            "file_path": "/var/log/nginx/access.log",
            "log_group_name": "/roster-api/nginx",
            "log_stream_name": "access"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "RosterAPI",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {
            "name": "cpu_usage_idle",
            "rename": "CPU_IDLE",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          {
            "name": "used_percent",
            "rename": "DISK_USED",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "mem": {
        "measurement": [
          {
            "name": "mem_used_percent",
            "rename": "MEM_USED",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
```

### 3. Start CloudWatch Agent

```bash
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json
```

### 4. CloudWatch Alarms

```bash
# CPU High Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name roster-api-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:ap-southeast-2:ACCOUNT_ID:roster-alerts

# Memory High Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name roster-api-high-memory \
  --metric-name MEM_USED \
  --namespace RosterAPI \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:ap-southeast-2:ACCOUNT_ID:roster-alerts
```

---

## Sentry Error Tracking

### 1. Setup Sentry Account

1. Create account at [sentry.io](https://sentry.io)
2. Create new project (Node.js/Express)
3. Copy DSN

### 2. Install Sentry SDK

```bash
cd server
npm install @sentry/node @sentry/profiling-node
```

### 3. Initialize Sentry

Create `src/utils/sentry.js`:

```javascript
const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');
const config = require('../config');

if (config.monitoring.sentryDsn) {
  Sentry.init({
    dsn: config.monitoring.sentryDsn,
    environment: config.env,
    release: process.env.npm_package_version,

    // Performance monitoring
    tracesSampleRate: config.isProduction() ? 0.1 : 1.0,

    // Profiling
    profilesSampleRate: config.isProduction() ? 0.1 : 1.0,
    integrations: [
      new ProfilingIntegration(),
    ],

    // Filter sensitive data
    beforeSend(event, hint) {
      // Don't send in development
      if (config.isDevelopment()) {
        return null;
      }

      // Remove sensitive data
      if (event.request?.cookies) {
        delete event.request.cookies;
      }

      return event;
    },
  });
}

module.exports = Sentry;
```

### 4. Add Sentry Middleware

In `src/index.js`:

```javascript
const Sentry = require('./utils/sentry');

// After loading config, before other middleware
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// ... your routes ...

// Before error handler
app.use(Sentry.Handlers.errorHandler());
```

### 5. Sentry Alerts

Configure in Sentry dashboard:

- **Error Rate Alert:** >10 errors in 5 minutes
- **New Issue Alert:** First occurrence of error
- **Regression Alert:** Error reappears after being resolved
- **Performance Alert:** Transaction duration >1s

---

## MongoDB Atlas Monitoring

### 1. Performance Advisor

**Enable:**
1. MongoDB Atlas Dashboard → Performance Advisor
2. Enable automatic index suggestions
3. Review recommendations weekly

**Key Metrics:**
- Query execution time
- Index usage
- Slow query log
- Connection pool usage

### 2. Real-Time Performance Panel

Monitor:
- Operations per second
- Query targeting (efficiency)
- Connections
- Network traffic

### 3. Alerts Configuration

**Critical Alerts:**
```text
- Connection Storm (>80% of max connections)
- Disk Space Low (<20% available)
- Replication Lag (>1 minute)
- Host Down
- Backup Failure
```

**Warning Alerts:**
```text
- CPU Usage (>75%)
- Memory Usage (>75%)
- Slow Queries (>1s)
- Unusual Connection Activity
```

### 4. Query Profiler

Enable for optimization:

```javascript
// Temporarily enable in staging
mongoose.set('debug', true);

// Or in MongoDB Atlas: Profiler tab → Enable
```

---

## Nginx Monitoring

### 1. Access Log Monitoring

```bash
# Real-time access log
tail -f /var/log/nginx/access.log

# Top IPs
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -20

# Request rate per minute
awk '{print $4}' /var/log/nginx/access.log | cut -d: -f1,2 | sort | uniq -c

# Status code distribution
awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn
```

### 2. Error Log Monitoring

```bash
# Real-time error log
tail -f /var/log/nginx/error.log

# Count errors by type
grep -oE '\[error\]|\[crit\]|\[alert\]|\[emerg\]' /var/log/nginx/error.log | sort | uniq -c
```

### 3. Nginx Status Module

Add to Nginx config:

```nginx
server {
    listen 127.0.0.1:8080;
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
}
```

Check status:
```bash
curl http://127.0.0.1:8080/nginx_status
```

---

## Custom Alerts

### 1. Health Check Monitoring (UptimeRobot)

1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add monitor:
   - Type: HTTP(S)
   - URL: https://api.yourdomain.ca/health
   - Interval: 5 minutes
   - Alert Contacts: Your email/phone

### 2. Custom Shell Script

Create `/home/ubuntu/scripts/health-check.sh`:

```bash
#!/bin/bash

# Health check script
URL="https://api.yourdomain.ca/health"
EMAIL="admin@yourdomain.ca"

# Check health endpoint
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $URL)

if [ $RESPONSE -ne 200 ]; then
    # Send alert
    echo "Health check failed! Status: $RESPONSE" | mail -s "ALERT: Roster API Down" $EMAIL

    # Log
    echo "$(date): Health check failed - Status $RESPONSE" >> /var/log/roster/health-check.log

    # Try to restart
    pm2 restart roster-api
fi
```

Add to cron (every 5 minutes):
```bash
crontab -e
*/5 * * * * /home/ubuntu/scripts/health-check.sh
```

---

## Performance Metrics

### 1. Application Metrics

Track in your app:

```javascript
// src/middleware/metrics.js
const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.http('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      requestId: req.id,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    // Alert on slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration,
        requestId: req.id,
      });
    }
  });

  next();
};
```

### 2. Database Query Metrics

```javascript
// Monitor slow queries
mongoose.set('debug', (collectionName, method, query, doc) => {
  const start = Date.now();

  // Log slow queries
  if (Date.now() - start > 100) {
    logger.warn('Slow database query', {
      collection: collectionName,
      method,
      duration: Date.now() - start,
    });
  }
});
```

---

## Dashboard Recommendations

### Free Options

1. **Grafana + Prometheus** (self-hosted)
   - Comprehensive metrics
   - Custom dashboards
   - Alerting

2. **PM2 Plus** (free tier)
   - Real-time monitoring
   - Error tracking
   - Transaction tracing

3. **MongoDB Atlas Dashboard** (included)
   - Database performance
   - Query optimization
   - Backup status

### Paid Options (Recommended for Production)

1. **Datadog** (~$15/host/month)
   - All-in-one APM
   - Custom dashboards
   - Excellent alerting

2. **New Relic** (~$25/month)
   - Application monitoring
   - Transaction tracing
   - Error tracking

3. **Sentry (Business Plan)** (~$26/month)
   - Advanced error tracking
   - Performance monitoring
   - Release tracking

---

## Monitoring Checklist

Daily:
- [ ] Check PM2 status
- [ ] Review error logs
- [ ] Monitor resource usage

Weekly:
- [ ] Review Sentry error trends
- [ ] Analyze MongoDB Performance Advisor
- [ ] Check backup status
- [ ] Review slow query logs

Monthly:
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Cost analysis (AWS, MongoDB)
- [ ] Update monitoring dashboards

---

**Version:** 1.0.0
**Last Updated:** 2026-01-14
