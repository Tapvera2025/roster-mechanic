# Production Deployment Checklist

Complete pre-launch checklist for Australian client production deployment.

---

## Pre-Deployment Checklist

### Infrastructure Setup

- [ ] AWS EC2 instance provisioned (ap-southeast-2 region)
- [ ] Security groups configured (ports 22, 80, 443 only)
- [ ] Elastic IP allocated and associated
- [ ] Domain DNS configured (A record pointing to EC2)
- [ ] SSH key pair generated and secured
- [ ] IAM roles configured for EC2 (if using AWS services)

### Database Setup

- [ ] MongoDB Atlas cluster created (ap-southeast-2)
- [ ] Production database created (`roster_prod`)
- [ ] Database user created with minimum required permissions
- [ ] IP whitelist configured (EC2 IP only)
- [ ] Automated backups enabled (point-in-time recovery)
- [ ] Performance alerts configured
- [ ] 7-year retention policy enabled (Privacy Act compliance)

### Environment Configuration

- [ ] `.env.production` created with all required variables
- [ ] JWT secret generated (64+ characters)
- [ ] MongoDB connection string tested
- [ ] All AWS credentials (SES, S3) configured
- [ ] CORS origin set to production client URL
- [ ] Timezone set to appropriate Australian zone
- [ ] Log level set to `error` for production

### Security Configuration

- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Nginx configured with security headers
- [ ] Rate limiting enabled and tested
- [ ] Helmet CSP configured
- [ ] Trust proxy enabled for AWS load balancer
- [ ] MongoDB injection protection active
- [ ] XSS protection middleware installed
- [ ] HPP protection enabled
- [ ] Firewall (UFW) configured and enabled
- [ ] SSH password authentication disabled
- [ ] Fail2ban installed and configured

### Application Setup

- [ ] Repository cloned to `/home/ubuntu/roster-api`
- [ ] Dependencies installed (`npm ci --production`)
- [ ] PM2 ecosystem config file configured
- [ ] Application starts without errors
- [ ] Graceful shutdown tested
- [ ] Log files created and writable (`/var/log/roster`)
- [ ] Log rotation configured (pm2-logrotate)

### Nginx Configuration

- [ ] Nginx installed and running
- [ ] Site configuration created in `/etc/nginx/sites-available/`
- [ ] Symlink created in `/etc/nginx/sites-enabled/`
- [ ] Configuration tested (`nginx -t`)
- [ ] Upstream backend configured
- [ ] SSL/TLS configured (TLS 1.2+)
- [ ] HTTP to HTTPS redirect enabled
- [ ] Security headers configured
- [ ] Rate limiting configured
- [ ] Nginx restarted successfully

### Monitoring & Logging

- [ ] Winston logging configured
- [ ] PM2 monitoring active
- [ ] Sentry error tracking configured
- [ ] AWS CloudWatch agent installed (optional)
- [ ] MongoDB Atlas alerts configured
- [ ] Health check endpoint responding
- [ ] Log aggregation configured (optional)
- [ ] Uptime monitoring configured (UptimeRobot, etc.)

### CI/CD Setup

- [ ] GitHub repository configured
- [ ] GitHub Actions workflows created
- [ ] GitHub Secrets configured (all required secrets)
- [ ] SSH deployment key added to EC2
- [ ] Test deployment successful
- [ ] Rollback procedure documented and tested

### Testing & Validation

- [ ] Health check endpoint returns 200 OK
- [ ] Database connection verified
- [ ] API endpoints responding correctly
- [ ] Authentication flow tested
- [ ] Rate limiting tested (should return 429)
- [ ] CORS tested from client domain
- [ ] SSL certificate valid (no browser warnings)
- [ ] Request ID tracking verified in logs
- [ ] Error handling tested (500 errors logged)
- [ ] Soft delete functionality tested
- [ ] Audit logging verified
- [ ] Timezone handling tested (Australian timezones)

### Performance & Optimization

- [ ] Compression enabled (gzip)
- [ ] Database indexes created and verified
- [ ] Connection pooling configured
- [ ] PM2 cluster mode enabled (multiple instances)
- [ ] Memory limits configured (`max_memory_restart`)
- [ ] Response times acceptable (<500ms for simple queries)
- [ ] Load testing performed (optional)

### Compliance & Legal

- [ ] Privacy Act compliance features enabled
  - [ ] Soft delete implemented
  - [ ] Audit logging active
  - [ ] 7-year data retention configured
  - [ ] PII masking in logs
  - [ ] Right to deletion endpoint (if required)
- [ ] Terms of Service endpoint (if required)
- [ ] Privacy Policy endpoint (if required)
- [ ] Data encryption at rest (MongoDB Atlas)
- [ ] Data encryption in transit (HTTPS)

### Backup & Recovery

- [ ] MongoDB Atlas automated backups enabled
- [ ] EC2 AMI snapshot created
- [ ] Backup restoration tested (at least once)
- [ ] Disaster recovery plan documented
- [ ] RTO/RPO defined and achievable

### Documentation

- [ ] Deployment guide completed (DEPLOYMENT.md)
- [ ] Environment variables documented
- [ ] API documentation available (if ENABLE_API_DOCS=true)
- [ ] Runbook created for common issues
- [ ] Contact information for support documented
- [ ] Architecture diagram created (optional)

---

## Post-Deployment Checklist

### Immediate (Within 1 Hour)

- [ ] Health check verified
- [ ] Logs monitored for errors
- [ ] Database connections stable
- [ ] Memory usage normal (<80%)
- [ ] CPU usage normal (<50% average)
- [ ] Response times acceptable
- [ ] SSL certificate valid

### First 24 Hours

- [ ] No critical errors in Sentry
- [ ] No database connection issues
- [ ] No memory leaks detected
- [ ] Rate limiting working correctly
- [ ] CORS working from client
- [ ] Email delivery working (if enabled)
- [ ] File uploads working (if enabled)
- [ ] PM2 restarts (if any) investigated

### First Week

- [ ] Performance metrics reviewed
- [ ] Log rotation working correctly
- [ ] Backup verification performed
- [ ] SSL certificate auto-renewal tested
- [ ] Security audit performed (optional)
- [ ] Load patterns analyzed
- [ ] Optimization opportunities identified

### Monthly

- [ ] Security updates applied (`sudo apt update && sudo apt upgrade`)
- [ ] MongoDB Atlas performance reviewed
- [ ] EC2 AMI snapshot created
- [ ] Quarterly backup downloaded (for Privacy Act compliance)
- [ ] Disk space checked
- [ ] Log files reviewed for anomalies
- [ ] Access logs reviewed for suspicious activity

---

## Critical Alerts Setup

Configure alerts for:

### Application
- [ ] Application down (health check fails)
- [ ] Error rate >1% (Sentry)
- [ ] Response time >1s (p95)
- [ ] Memory usage >80%
- [ ] CPU usage >80%
- [ ] PM2 process restart

### Database
- [ ] Connection failures
- [ ] Query time >1s
- [ ] CPU usage >80%
- [ ] Disk space <20%
- [ ] Backup failure

### Infrastructure
- [ ] EC2 instance down
- [ ] Disk space <20%
- [ ] SSL certificate expires in <30 days
- [ ] Unusual traffic patterns
- [ ] DDoS attempt detected

---

## Emergency Contacts

```
Client Contact: [Name] - [Email] - [Phone]
AWS Support: [Account ID]
MongoDB Support: [Support Plan]
Domain Registrar: [Company]
SSL Provider: Let's Encrypt
```

---

## Rollback Plan

If deployment fails:

1. **Check logs immediately**
   ```bash
   pm2 logs roster-api --err
   ```

2. **Rollback to previous version**
   ```bash
   cd /home/ubuntu/roster-api
   git log --oneline
   git reset --hard [previous-commit]
   cd server
   npm ci --production
   pm2 reload roster-api
   ```

3. **Verify health**
   ```bash
   curl https://api.yourdomain.ca/health
   ```

4. **Restore database (if needed)**
   - MongoDB Atlas → Backups → Restore to previous point-in-time

5. **Notify stakeholders**
   - Email client
   - Update status page (if available)

---

## Success Criteria

Deployment is successful when:

- ✅ Health check returns 200 OK
- ✅ No errors in PM2 logs for 15 minutes
- ✅ Database queries executing normally
- ✅ SSL certificate valid
- ✅ API responses <500ms (p95)
- ✅ Memory usage <60%
- ✅ CPU usage <40%
- ✅ No Sentry errors
- ✅ Client application connecting successfully

---

## Sign-off

```
Deployment Date: _______________
Deployed By: _______________
Client Approved: _______________
Production URL: https://api.yourdomain.ca
```

---

**Version:** 1.0.0
**Last Updated:** 2026-01-14
