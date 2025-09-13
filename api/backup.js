#!/usr/bin/env node

/**
 * Pint? Database Backup Script
 * 
 * This script can be run manually or scheduled as a cron job.
 * It creates a backup of the database and optionally uploads it to cloud storage.
 * 
 * Usage:
 *   node backup.js
 * 
 * Environment Variables:
 *   DATABASE_URL - Database connection string
 *   BACKUP_DIR - Directory to store backups (default: /tmp/backups)
 *   CLOUD_BACKUP_BUCKET - S3 bucket or GCS bucket name for cloud storage
 *   CLOUD_BACKUP_PROVIDER - 'aws' or 'gcp' (default: aws)
 * 
 * Cron job example (daily at 2 AM):
 *   0 2 * * * /usr/bin/node /path/to/pint/api/backup.js >> /var/log/pint-backup.log 2>&1
 */

require('dotenv').config();
const backupService = require('./services/backupService');

async function main() {
  console.log('='.repeat(50));
  console.log('Pint? Database Backup - ' + new Date().toISOString());
  console.log('='.repeat(50));

  try {
    const result = await backupService.createBackup();
    
    if (result.success) {
      console.log('✅ Backup completed successfully');
      console.log(`📁 File: ${result.fileName}`);
      console.log(`📍 Path: ${result.path}`);
      process.exit(0);
    } else {
      console.error('❌ Backup failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Backup script error:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Backup interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Backup terminated');
  process.exit(1);
});

// Only run if this script is called directly
if (require.main === module) {
  main();
}