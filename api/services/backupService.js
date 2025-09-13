const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class BackupService {
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || '/tmp/backups';
    this.dbUrl = process.env.DATABASE_URL;
    this.cloudBucket = process.env.CLOUD_BACKUP_BUCKET;
    this.cloudProvider = process.env.CLOUD_BACKUP_PROVIDER || 'aws'; // aws, gcp, or local
  }

  async createBackup() {
    try {
      console.log('Starting database backup...');
      
      // Ensure backup directory exists
      await this.ensureBackupDirectory();
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `pint-backup-${timestamp}.sql`;
      const localBackupPath = path.join(this.backupDir, backupFileName);
      
      // Create database dump
      await this.createDatabaseDump(localBackupPath);
      
      // Upload to cloud storage if configured
      if (this.cloudBucket) {
        await this.uploadToCloud(localBackupPath, backupFileName);
      }
      
      // Clean up old backups (keep last 7 days)
      await this.cleanupOldBackups();
      
      console.log(`Backup completed successfully: ${backupFileName}`);
      return { success: true, fileName: backupFileName, path: localBackupPath };
      
    } catch (error) {
      console.error('Backup failed:', error);
      return { success: false, error: error.message };
    }
  }

  async ensureBackupDirectory() {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log(`Created backup directory: ${this.backupDir}`);
    }
  }

  async createDatabaseDump(outputPath) {
    return new Promise((resolve, reject) => {
      // Handle different database types
      let command;
      
      if (this.dbUrl && this.dbUrl.includes('postgresql://')) {
        // PostgreSQL backup
        command = `pg_dump "${this.dbUrl}" > "${outputPath}"`;
      } else if (this.dbUrl && this.dbUrl.includes('sqlite:')) {
        // SQLite backup (copy the file)
        const sqliteFile = this.dbUrl.replace('sqlite:', '');
        command = `cp "${sqliteFile}" "${outputPath.replace('.sql', '.db')}"`;
      } else {
        reject(new Error('Unsupported database type or DATABASE_URL not configured'));
        return;
      }

      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Database dump failed: ${error.message}`));
          return;
        }
        if (stderr && !stderr.includes('WARNING')) {
          console.warn('Backup warning:', stderr);
        }
        resolve(stdout);
      });
    });
  }

  async uploadToCloud(localPath, fileName) {
    if (!this.cloudBucket) {
      console.log('No cloud bucket configured, skipping cloud upload');
      return;
    }

    try {
      switch (this.cloudProvider) {
        case 'aws':
          await this.uploadToS3(localPath, fileName);
          break;
        case 'gcp':
          await this.uploadToGCS(localPath, fileName);
          break;
        default:
          console.log('Unknown cloud provider, skipping cloud upload');
      }
    } catch (error) {
      console.error('Cloud upload failed:', error.message);
      // Don't fail the entire backup if cloud upload fails
    }
  }

  async uploadToS3(localPath, fileName) {
    // AWS S3 upload using AWS CLI (requires aws-cli to be installed)
    return new Promise((resolve, reject) => {
      const command = `aws s3 cp "${localPath}" "s3://${this.cloudBucket}/backups/${fileName}"`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`S3 upload failed: ${error.message}`));
          return;
        }
        console.log(`Backup uploaded to S3: s3://${this.cloudBucket}/backups/${fileName}`);
        resolve(stdout);
      });
    });
  }

  async uploadToGCS(localPath, fileName) {
    // Google Cloud Storage upload using gcloud CLI
    return new Promise((resolve, reject) => {
      const command = `gcloud storage cp "${localPath}" "gs://${this.cloudBucket}/backups/${fileName}"`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`GCS upload failed: ${error.message}`));
          return;
        }
        console.log(`Backup uploaded to GCS: gs://${this.cloudBucket}/backups/${fileName}`);
        resolve(stdout);
      });
    });
  }

  async cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(file => file.startsWith('pint-backup-'));
      
      // Sort by creation time and keep only the last 7
      const fileStats = await Promise.all(
        backupFiles.map(async file => {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          return { file, path: filePath, mtime: stats.mtime };
        })
      );
      
      fileStats.sort((a, b) => b.mtime - a.mtime);
      
      // Delete files older than 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const filesToDelete = fileStats.filter(f => f.mtime < sevenDaysAgo);
      
      for (const fileInfo of filesToDelete) {
        await fs.unlink(fileInfo.path);
        console.log(`Deleted old backup: ${fileInfo.file}`);
      }
      
    } catch (error) {
      console.error('Cleanup failed:', error.message);
    }
  }

  // Method to restore from backup (for manual use)
  async restoreFromBackup(backupPath) {
    return new Promise((resolve, reject) => {
      let command;
      
      if (this.dbUrl && this.dbUrl.includes('postgresql://')) {
        command = `psql "${this.dbUrl}" < "${backupPath}"`;
      } else {
        reject(new Error('Restore not implemented for this database type'));
        return;
      }

      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Database restore failed: ${error.message}`));
          return;
        }
        console.log('Database restored successfully');
        resolve(stdout);
      });
    });
  }
}

module.exports = new BackupService();