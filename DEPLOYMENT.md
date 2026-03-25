# Roster API - Deployment Guide

Complete production deployment guide for Australian client.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS EC2 Setup](#aws-ec2-setup)
3. [MongoDB Atlas Setup](#mongodb-atlas-setup)
4. [Server Configuration](#server-configuration)
5. [SSL Certificate Setup](#ssl-certificate-setup)
6. [Application Deployment](#application-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- ✅ AWS Account (EC2, SES, S3)
- ✅ MongoDB Atlas Account
- ✅ Domain Name (e.g., yourdomain.ca)
- ✅ GitHub Account
- ✅ Sentry Account (optional, for error tracking)

### Local Tools
```bash
# SSH client
# Git
# AWS CLI (optional)
```

---

## AWS EC2 Setup

### 1. Launch EC2 Instance

**Specifications:**
- **Instance Type:** t3.small (minimum) or t3.medium (recommended)
- **OS:** Ubuntu 22.04 LTS
- **Region:** ap-southeast-2 (Sydney, Australia)
- **Storage:** 20 GB SSD (minimum)
- **Security Group:**

```text
Port 22   (SSH)        - Your IP only
Port 80   (HTTP)       - 0.0.0.0/0
Port 443  (HTTPS)      - 0.0.0.0/0
Port 5000 (Node.js)    - 127.0.0.1 only (internal)
```

### 2. Connect to EC2

```bash
# Save your .pem key
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 3. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx

# Install Git
sudo apt install -y git

# Create app directory
sudo mkdir -p /home/ubuntu/roster-api
sudo chown ubuntu:ubuntu /home/ubuntu/roster-api
```

---

## MongoDB Atlas Setup

### 1. Create Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster in **ap-southeast-2** (Sydney)
3. Choose **M10** tier (minimum for production)
4. Enable **Backup** (required for Privacy Act compliance)

### 2. Database Configuration

```bash
# Create databases
roster_prod
roster_staging
roster_dev
```

### 3. Security Setup

**Network Access:**
- Add EC2 instance IP address
- **DO NOT** use 0.0.0.0/0 in production

**Database Users:**
```text
Username: roster_api_prod
Password: [Generate strong password]
Role: readWrite on roster_prod
```

### 4. Connection String

```bash
mongodb+srv://roster_api_prod:<password>@cluster.xxxxx.mongodb.net/roster_prod?retryWrites=true&w=majority
```

---

## Server Configuration

### 1. Clone Repository

```bash
cd /home/ubuntu/roster-api
git clone git@github.com:yourusername/roster-website.git .
cd server
npm ci --production
```

### 2. Create Environment File

```bash
cd /home/ubuntu/roster-api/server
nano .env.production
```

**Paste the following (replace values):**

```bash
NODE_ENV=production
APP_NAME=RosterPro
APP_PORT=5000
APP_URL=https://api.yourdomain.ca
CLIENT_URL=https://app.yourdomain.ca

MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/roster_prod
MONGO_DB_NAME=roster_prod

JWT_SECRET=[Generate 64+ character random string]
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
BCRYPT_SALT_ROUNDS=12

APP_TIMEZONE=Australia/Sydney

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

CORS_ORIGIN=https://app.yourdomain.ca

LOG_LEVEL=error
LOG_FILE_PATH=/var/log/roster

EMAIL_ENABLED=true
EMAIL_FROM=noreply@yourdomain.com.au
AWS_REGION=ap-southeast-2
AWS_SES_ACCESS_KEY=[Your AWS SES key]
AWS_SES_SECRET_KEY=[Your AWS SES secret]

AWS_S3_BUCKET=roster-uploads-prod
AWS_S3_ACCESS_KEY=[Your AWS S3 key]
AWS_S3_SECRET_KEY=[Your AWS S3 secret]

SENTRY_DSN=[Your Sentry DSN]
ENABLE_APM=true

ENABLE_API_DOCS=false
ENABLE_REQUEST_LOGGING=false
ENABLE_COMPRESSION=true

HELMET_CSP_ENABLED=true
TRUST_PROXY=true
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Create Log Directory

```bash
sudo mkdir -p /var/log/roster
sudo chown ubuntu:ubuntu /var/log/roster
```

---

## SSL Certificate Setup

### 1. Configure DNS

Point your domain to EC2 instance:
```text
A Record: api.yourdomain.ca → [EC2 IP Address]
```

### 2. Install SSL Certificate

```bash
# Obtain certificate
sudo certbot --nginx -d api.yourdomain.ca

# Auto-renewal (runs twice daily)
sudo certbot renew --dry-run
```

---

## Nginx Configuration

### 1. Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/roster-api
```

**Copy the content from `server/nginx.conf` in the repository.**

### 2. Enable Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/roster-api /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Application Deployment

### 1. Start with PM2

```bash
cd /home/ubuntu/roster-api/server
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 2. Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs roster-api

# Test health endpoint
curl https://api.yourdomain.ca/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-14T...",
  "environment": "production",
  "uptime": 123.45,
  "database": {
    "status": "healthy",
    "state": "connected"
  }
}
```

---

## CI/CD Setup (GitHub Actions)

### 1. Add GitHub Secrets

Go to: **Repository → Settings → Secrets and variables → Actions**

Add the following secrets:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
EC2_PRODUCTION_HOST
EC2_STAGING_HOST
EC2_USER=ubuntu
SSH_PRIVATE_KEY
MONGO_URI_PRODUCTION
JWT_SECRET_PRODUCTION
CLIENT_URL_PRODUCTION
AWS_SES_ACCESS_KEY
AWS_SES_SECRET_KEY
AWS_S3_ACCESS_KEY
AWS_S3_SECRET_KEY
SENTRY_DSN
```

### 2. SSH Key Setup

```bash
# On your local machine, generate deployment key
ssh-keygen -t ed25519 -C "deploy@roster-api" -f roster-deploy-key

# Add public key to EC2
cat roster-deploy-key.pub | ssh ubuntu@your-ec2-ip "cat >> ~/.ssh/authorized_keys"

# Add private key to GitHub Secrets as SSH_PRIVATE_KEY
cat roster-deploy-key
```

### 3. Test Deployment

```bash
# Push to main branch triggers production deployment
git push origin main

# Monitor in GitHub Actions tab
```

---

## Monitoring & Maintenance

### 1. PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Logs
pm2 logs roster-api --lines 100

# Restart
pm2 restart roster-api

# Zero-downtime reload
pm2 reload roster-api
```

### 2. Log Rotation

```bash
# Configure PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### 3. AWS CloudWatch (Recommended)

**Install CloudWatch Agent:**
```bash
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb
```

### 4. MongoDB Atlas Monitoring

- Enable **Performance Advisor**
- Set up **Alerts** for:
  - High CPU usage (>80%)
  - Low disk space (<20%)
  - Connection spikes
  - Slow queries

---

## Backup Strategy

### 1. MongoDB Backups

MongoDB Atlas provides:
- ✅ Continuous backups (point-in-time recovery)
- ✅ 7-year retention (Privacy Act compliance)

**Configure:**
- Backup frequency: Every 6 hours
- Retention: 7 years
- Download quarterly backups

### 2. EC2 Snapshots

```bash
# Create AMI snapshot weekly
aws ec2 create-image --instance-id i-xxxxx --name "roster-api-backup-$(date +%Y%m%d)"
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs roster-api --err

# Check environment
cat /home/ubuntu/roster-api/server/.env.production

# Test MongoDB connection
mongo "mongodb+srv://..." --eval "db.adminCommand('ping')"

# Check Node version
node --version  # Should be 20.x
```

### High Memory Usage

```bash
# Check PM2 memory
pm2 monit

# Restart if needed
pm2 restart roster-api

# Increase max memory
pm2 delete roster-api
pm2 start ecosystem.config.js --env production --max-memory-restart 1G
```

### SSL Certificate Issues

```bash
# Renew certificate
sudo certbot renew

# Restart Nginx
sudo systemctl restart nginx
```

### Database Connection Errors

1. Check MongoDB Atlas IP whitelist
2. Verify connection string in `.env.production`
3. Check network connectivity: `ping cluster.mongodb.net`

---

## Security Checklist

- ✅ SSH key authentication (disable password login)
- ✅ Firewall configured (only ports 22, 80, 443 open)
- ✅ SSL certificate installed and auto-renewing
- ✅ Environment variables in separate files (not committed)
- ✅ MongoDB IP whitelist configured
- ✅ Rate limiting enabled
- ✅ Helmet security headers configured
- ✅ Regular security updates: `sudo apt update && sudo apt upgrade`

---

## Performance Optimization

### 1. Enable Compression

Already enabled via:
- Nginx gzip compression
- Express compression middleware

### 2. Database Indexes

Indexes are automatically created by Mongoose models.

Verify:
```javascript
// In MongoDB Atlas, check "Performance" → "Indexes"
```

### 3. PM2 Cluster Mode

```bash
# Scale to use all CPU cores
pm2 scale roster-api 4
```

---

## Rollback Procedure

### Quick Rollback

```bash
cd /home/ubuntu/roster-api
git reset --hard [previous-commit-hash]
cd server
npm ci --production
pm2 reload roster-api
```

### From Backup

```bash
# Restore database from MongoDB Atlas backup
# Restore EC2 from AMI snapshot
```

---

## Support & Contacts

- **Server Issues:** Check PM2 logs first
- **Database Issues:** MongoDB Atlas Support
- **SSL Issues:** Let's Encrypt documentation
- **Application Errors:** Check Sentry dashboard

---

**Last Updated:** 2026-01-14
**Version:** 1.0.0
