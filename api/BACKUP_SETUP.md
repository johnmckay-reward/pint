# Database Backup Setup Guide

This guide explains how to set up automated database backups for the Pint? API.

## Overview

The backup system creates regular backups of your database and optionally uploads them to cloud storage (AWS S3 or Google Cloud Storage).

## Manual Backup

To create a backup manually:

```bash
cd /path/to/pint/api
node backup.js
```

## Automated Backup Setup

### 1. Environment Configuration

Add these variables to your production `.env` file:

```bash
# Database connection (required)
DATABASE_URL=postgresql://username:password@localhost:5432/pint_production

# Backup configuration
BACKUP_DIR=/var/backups/pint
CLOUD_BACKUP_BUCKET=your-backup-bucket-name
CLOUD_BACKUP_PROVIDER=aws  # or 'gcp'
```

### 2. Create Backup Directory

```bash
sudo mkdir -p /var/backups/pint
sudo chown your-app-user:your-app-group /var/backups/pint
```

### 3. Set Up Cron Job

Edit the crontab for your application user:

```bash
crontab -e
```

Add one of these lines for automated backups:

```bash
# Daily backup at 2:00 AM
0 2 * * * /usr/bin/node /path/to/pint/api/backup.js >> /var/log/pint-backup.log 2>&1

# Weekly backup (Sunday at 3:00 AM)
0 3 * * 0 /usr/bin/node /path/to/pint/api/backup.js >> /var/log/pint-backup.log 2>&1

# Multiple times per day (every 6 hours)
0 */6 * * * /usr/bin/node /path/to/pint/api/backup.js >> /var/log/pint-backup.log 2>&1
```

### 4. Cloud Storage Setup (Optional)

#### AWS S3 Setup

1. Install AWS CLI:
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

2. Configure AWS credentials:
```bash
aws configure
```

3. Create S3 bucket:
```bash
aws s3 mb s3://your-backup-bucket-name
```

4. Set bucket policy for lifecycle management (optional):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR-ACCOUNT:user/backup-user"
      },
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-backup-bucket-name/*"
    }
  ]
}
```

#### Google Cloud Storage Setup

1. Install Google Cloud SDK:
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

2. Create GCS bucket:
```bash
gcloud storage buckets create gs://your-backup-bucket-name
```

3. Authenticate:
```bash
gcloud auth application-default login
```

### 5. Log Rotation

Set up log rotation for backup logs:

Create `/etc/logrotate.d/pint-backup`:

```
/var/log/pint-backup.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 your-app-user your-app-group
}
```

### 6. Monitoring

To monitor backup status, you can:

1. Check the log file:
```bash
tail -f /var/log/pint-backup.log
```

2. Set up alerts for backup failures:
```bash
# Add to cron job to email on failure:
0 2 * * * /usr/bin/node /path/to/pint/api/backup.js >> /var/log/pint-backup.log 2>&1 || echo "Backup failed" | mail -s "Pint Backup Failed" admin@yourcompany.com
```

3. Use monitoring services like UptimeRobot or Pingdom to check backup file timestamps.

## Backup Retention

- Local backups: Kept for 7 days
- Cloud backups: Configure lifecycle policies in your cloud provider for long-term retention

## Restoration

To restore from a backup:

### PostgreSQL
```bash
# Stop your application first
sudo systemctl stop pint-api

# Restore database
psql "postgresql://username:password@localhost:5432/pint_production" < /path/to/backup.sql

# Restart application
sudo systemctl start pint-api
```

### SQLite
```bash
# Stop your application first
sudo systemctl stop pint-api

# Copy backup file
cp /path/to/backup.db /path/to/production.db

# Restart application
sudo systemctl start pint-api
```

## Security Notes

- Ensure backup files have restricted permissions (600 or 640)
- Use encrypted storage for cloud backups
- Regularly test your backup restoration process
- Consider encrypting backup files before uploading to cloud storage

## Troubleshooting

### Common Issues

1. **Permission denied**: Ensure the app user can write to the backup directory
2. **Database connection failed**: Check DATABASE_URL environment variable
3. **Cloud upload failed**: Verify cloud provider CLI is installed and configured
4. **Disk space**: Monitor backup directory disk usage

### Debug Mode

Run backup with verbose output:
```bash
NODE_ENV=development node backup.js
```