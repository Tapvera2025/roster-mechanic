# GitHub Secrets Setup Guide

This document lists every secret required by the CI/CD workflows.
Add them at: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

---

## AWS Credentials (shared by both workflows)

| Secret Name | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user access key ID |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret access key |
| `AWS_REGION` | e.g. `ap-southeast-2` |

> **IAM permissions needed** (least-privilege):
> - `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket` on your S3 bucket
> - `cloudfront:CreateInvalidation` on your CloudFront distribution
> - No EC2 IAM access needed (SSH key handles EC2 auth)

---

## Frontend Secrets

| Secret Name | Value |
|---|---|
| `S3_BUCKET_NAME` | e.g. `roster-mechanics-frontend` |
| `CLOUDFRONT_DISTRIBUTION_ID` | e.g. `E1A2B3C4D5E6F7` (found in CloudFront console) |
| `BACKEND_URL` | Your API URL e.g. `https://api.yourdomain.com` |

---

## Backend / EC2 Secrets

| Secret Name | Value |
|---|---|
| `EC2_HOST` | EC2 public IP or DNS e.g. `54.123.45.67` |
| `EC2_USER` | `ubuntu` (default for Ubuntu AMI) |
| `EC2_SSH_PRIVATE_KEY` | Full contents of your `.pem` file (see below) |

### How to add the PEM key as a secret

```bash
# On your local machine, print the key contents:
cat rm_node_backend.pem
```

Copy the **entire output** (including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`) and paste it as the value for `EC2_SSH_PRIVATE_KEY`.

---

## Backend Environment Secrets

| Secret Name | Value |
|---|---|
| `CLIENT_URL` | CloudFront URL e.g. `https://d1234abcd.cloudfront.net` |
| `MONGO_URI_PRODUCTION` | Full MongoDB Atlas connection string |
| `JWT_SECRET_PRODUCTION` | Long random string (use `openssl rand -hex 64`) |
| `EMAIL_FROM` | e.g. `noreply@yourdomain.com` |
| `AWS_SES_ACCESS_KEY` | IAM key for SES (can reuse AWS_ACCESS_KEY_ID if same user) |
| `AWS_SES_SECRET_KEY` | IAM secret for SES |
| `AWS_S3_BUCKET` | Bucket name for file uploads (can differ from frontend bucket) |
| `AWS_S3_ACCESS_KEY` | IAM key for S3 file uploads |
| `AWS_S3_SECRET_KEY` | IAM secret for S3 file uploads |
| `SENTRY_DSN` | Sentry project DSN (optional — remove from .env if not using) |

---

## EC2 Prerequisites

Before the workflow can deploy, your EC2 instance must already have:

```bash
# 1. Clone the repo (first time only)
cd /home/ubuntu
git clone https://github.com/Tapvera2025/roster-mechanic roster-website
cd roster-website
git checkout prod   # or create the prod branch

# 2. Install dependencies manually the first time
cd server
npm ci --omit=dev

# 3. Start PM2 the first time
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # follow the printed command to enable auto-start on reboot
```

After this one-time setup, every push to `prod` will automatically pull, reinstall, and reload via PM2.

---

## GitHub Environments (recommended)

Create a `production` environment in **Settings → Environments** and optionally add:
- **Required reviewers** — someone must approve before deploy runs
- **Wait timer** — adds a delay before deployment starts

Both workflows reference `environment: production` so they'll respect these rules.
