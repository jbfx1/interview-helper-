import { promises as fs } from 'fs';
import path from 'path';
import { readQueue, queueFilePath, type StoredSupportRequest } from '../queue';
import { getStorageConfig } from '../config';
import { logger } from './logger';

export interface BackupMetadata {
  timestamp: string;
  totalRequests: number;
  fileSize: number;
  version: string;
}

export interface BackupInfo {
  filename: string;
  path: string;
  metadata: BackupMetadata;
}

const storageConfig = getStorageConfig();

// Create backup directory if it doesn't exist
async function ensureBackupDir(): Promise<string> {
  const backupDir = path.resolve(process.cwd(), 'data', 'backups');
  await fs.mkdir(backupDir, { recursive: true });
  return backupDir;
}

// Generate backup filename with timestamp
function generateBackupFilename(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `support-queue-backup-${timestamp}.json`;
}

// Create a backup of the current support queue
export async function createBackup(): Promise<BackupInfo> {
  try {
    const backupDir = await ensureBackupDir();
    const queue = await readQueue();
    const queueFile = queueFilePath();
    const stats = await fs.stat(queueFile);
    
    const metadata: BackupMetadata = {
      timestamp: new Date().toISOString(),
      totalRequests: queue.length,
      fileSize: stats.size,
      version: '1.0',
    };

    const backupData = {
      metadata,
      data: queue,
    };

    const filename = generateBackupFilename();
    const backupPath = path.join(backupDir, filename);
    
    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');
    
    const backupInfo: BackupInfo = {
      filename,
      path: backupPath,
      metadata,
    };

    logger.info('Backup created successfully', {
      filename,
      path: backupPath,
      totalRequests: metadata.totalRequests,
      fileSize: metadata.fileSize,
    });

    return backupInfo;
  } catch (error) {
    logger.error('Failed to create backup', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}

// List all available backups
export async function listBackups(): Promise<BackupInfo[]> {
  try {
    const backupDir = await ensureBackupDir();
    const files = await fs.readdir(backupDir);
    const backupFiles = files.filter(file => 
      file.startsWith('support-queue-backup-') && file.endsWith('.json')
    );

    const backups: BackupInfo[] = [];

    for (const filename of backupFiles) {
      try {
        const filePath = path.join(backupDir, filename);
        const content = await fs.readFile(filePath, 'utf-8');
        const backupData = JSON.parse(content);
        
        backups.push({
          filename,
          path: filePath,
          metadata: backupData.metadata,
        });
      } catch (error) {
        logger.warn('Failed to read backup file', {
          filename,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Sort by timestamp (newest first)
    return backups.sort((a, b) => 
      new Date(b.metadata.timestamp).getTime() - new Date(a.metadata.timestamp).getTime()
    );
  } catch (error) {
    logger.error('Failed to list backups', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}

// Restore from a backup file
export async function restoreFromBackup(backupFilename: string): Promise<void> {
  try {
    const backupDir = await ensureBackupDir();
    const backupPath = path.join(backupDir, backupFilename);
    
    // Verify backup file exists
    await fs.access(backupPath);
    
    const content = await fs.readFile(backupPath, 'utf-8');
    const backupData = JSON.parse(content);
    
    if (!backupData.data || !Array.isArray(backupData.data)) {
      throw new Error('Invalid backup format: data array not found');
    }

    // Validate backup data structure
    for (const item of backupData.data) {
      if (!item.id || !item.name || !item.email || !item.topic || !item.message) {
        throw new Error('Invalid backup format: missing required fields');
      }
    }

    // Create backup of current data before restoring
    const currentBackup = await createBackup();
    logger.info('Created backup of current data before restore', {
      backupFile: currentBackup.filename,
    });

    // Write restored data to queue file
    const queueFile = queueFilePath();
    await fs.writeFile(queueFile, JSON.stringify(backupData.data, null, 2), 'utf-8');

    logger.info('Successfully restored from backup', {
      backupFile: backupFilename,
      restoredRequests: backupData.data.length,
      backupTimestamp: backupData.metadata?.timestamp,
    });
  } catch (error) {
    logger.error('Failed to restore from backup', {
      backupFile: backupFilename,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// Clean up old backups (keep only specified number)
export async function cleanupOldBackups(keepCount: number = 10): Promise<void> {
  try {
    const backups = await listBackups();
    
    if (backups.length <= keepCount) {
      logger.debug('No old backups to clean up', {
        totalBackups: backups.length,
        keepCount,
      });
      return;
    }

    const backupsToDelete = backups.slice(keepCount);
    let deletedCount = 0;

    for (const backup of backupsToDelete) {
      try {
        await fs.unlink(backup.path);
        deletedCount++;
        logger.debug('Deleted old backup', {
          filename: backup.filename,
          timestamp: backup.metadata.timestamp,
        });
      } catch (error) {
        logger.warn('Failed to delete backup', {
          filename: backup.filename,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info('Cleanup completed', {
      totalBackups: backups.length,
      deletedCount,
      remainingCount: backups.length - deletedCount,
    });
  } catch (error) {
    logger.error('Failed to cleanup old backups', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// Data retention - remove old support requests
export async function applyDataRetention(): Promise<void> {
  try {
    const queue = await readQueue();
    const cutoffDate = new Date();
    cutoffDate.setTime(cutoffDate.getTime() - storageConfig.retentionPeriod);

    const originalCount = queue.length;
    const filteredQueue = queue.filter(request => {
      const requestDate = new Date(request.createdAt);
      return requestDate > cutoffDate;
    });

    const removedCount = originalCount - filteredQueue.length;

    if (removedCount > 0) {
      // Create backup before applying retention
      await createBackup();
      
      // Write filtered queue back to file
      const queueFile = queueFilePath();
      await fs.writeFile(queueFile, JSON.stringify(filteredQueue, null, 2), 'utf-8');

      logger.info('Applied data retention policy', {
        originalCount,
        removedCount,
        remainingCount: filteredQueue.length,
        cutoffDate: cutoffDate.toISOString(),
      });
    } else {
      logger.debug('No data to remove for retention policy', {
        totalRequests: originalCount,
        cutoffDate: cutoffDate.toISOString(),
      });
    }
  } catch (error) {
    logger.error('Failed to apply data retention', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// Automated backup scheduler
let backupInterval: NodeJS.Timeout | null = null;

export function startAutomaticBackups(): void {
  if (backupInterval) {
    logger.warn('Automatic backups already running');
    return;
  }

  const intervalMs = storageConfig.backupInterval;
  
  backupInterval = setInterval(async () => {
    try {
      await createBackup();
      await cleanupOldBackups(30); // Keep last 30 backups
      await applyDataRetention();
    } catch (error) {
      logger.error('Scheduled backup failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, intervalMs);

  logger.info('Automatic backups started', {
    intervalHours: storageConfig.backupInterval / (1000 * 60 * 60),
  });
}

export function stopAutomaticBackups(): void {
  if (backupInterval) {
    clearInterval(backupInterval);
    backupInterval = null;
    logger.info('Automatic backups stopped');
  }
}

// Graceful shutdown
export function shutdown(): void {
  stopAutomaticBackups();
}