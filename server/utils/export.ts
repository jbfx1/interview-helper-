import { promises as fs } from 'fs';
import path from 'path';
import { readQueue, type StoredSupportRequest } from '../queue';
import { logger } from './logger';

export type ExportFormat = 'json' | 'csv';

export interface ExportOptions {
  format: ExportFormat;
  dateRange?: {
    start: Date;
    end: Date;
  };
  urgencyFilter?: 'normal' | 'urgent';
  includeMetadata?: boolean;
}

export interface ExportResult {
  filename: string;
  path: string;
  recordCount: number;
  fileSize: number;
  format: ExportFormat;
}

// Ensure export directory exists
async function ensureExportDir(): Promise<string> {
  const exportDir = path.resolve(process.cwd(), 'data', 'exports');
  await fs.mkdir(exportDir, { recursive: true });
  return exportDir;
}

// Generate export filename
function generateExportFilename(format: ExportFormat, options?: ExportOptions): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  let filename = `support-requests-export-${timestamp}`;
  
  if (options?.dateRange) {
    const startDate = options.dateRange.start.toISOString().split('T')[0];
    const endDate = options.dateRange.end.toISOString().split('T')[0];
    filename += `-${startDate}-to-${endDate}`;
  }
  
  if (options?.urgencyFilter) {
    filename += `-${options.urgencyFilter}`;
  }
  
  return `${filename}.${format}`;
}

// Filter support requests based on criteria
function filterRequests(requests: StoredSupportRequest[], options?: ExportOptions): StoredSupportRequest[] {
  let filtered = [...requests];
  
  // Date range filter
  if (options?.dateRange) {
    const { start, end } = options.dateRange;
    filtered = filtered.filter(request => {
      const requestDate = new Date(request.createdAt);
      return requestDate >= start && requestDate <= end;
    });
  }
  
  // Urgency filter
  if (options?.urgencyFilter) {
    filtered = filtered.filter(request => request.urgency === options.urgencyFilter);
  }
  
  return filtered;
}

// Export to JSON format
async function exportToJson(
  requests: StoredSupportRequest[],
  exportPath: string,
  options?: ExportOptions
): Promise<void> {
  const exportData = {
    metadata: options?.includeMetadata ? {
      exportDate: new Date().toISOString(),
      totalRecords: requests.length,
      format: 'json',
      version: '1.0',
      filters: {
        dateRange: options?.dateRange ? {
          start: options.dateRange.start.toISOString(),
          end: options.dateRange.end.toISOString(),
        } : null,
        urgency: options?.urgencyFilter || null,
      },
    } : undefined,
    data: requests,
  };
  
  await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2), 'utf-8');
}

// Export to CSV format
async function exportToCsv(
  requests: StoredSupportRequest[],
  exportPath: string
): Promise<void> {
  if (requests.length === 0) {
    await fs.writeFile(exportPath, '', 'utf-8');
    return;
  }
  
  // CSV headers
  const headers = ['ID', 'Name', 'Email', 'Topic', 'Message', 'Urgency', 'Created At'];
  
  // Generate CSV rows
  const rows = requests.map(request => [
    request.id,
    `"${request.name.replace(/"/g, '""')}"`, // Escape quotes
    request.email,
    `"${request.topic.replace(/"/g, '""')}"`,
    `"${request.message.replace(/"/g, '""')}"`,
    request.urgency,
    request.createdAt,
  ]);
  
  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');
  
  await fs.writeFile(exportPath, csvContent, 'utf-8');
}

// Main export function
export async function exportSupportRequests(options: ExportOptions): Promise<ExportResult> {
  try {
    const exportDir = await ensureExportDir();
    const allRequests = await readQueue();
    const filteredRequests = filterRequests(allRequests, options);
    
    const filename = generateExportFilename(options.format, options);
    const exportPath = path.join(exportDir, filename);
    
    // Export based on format
    if (options.format === 'json') {
      await exportToJson(filteredRequests, exportPath, options);
    } else if (options.format === 'csv') {
      await exportToCsv(filteredRequests, exportPath);
    } else {
      throw new Error(`Unsupported export format: ${options.format}`);
    }
    
    // Get file stats
    const stats = await fs.stat(exportPath);
    
    const result: ExportResult = {
      filename,
      path: exportPath,
      recordCount: filteredRequests.length,
      fileSize: stats.size,
      format: options.format,
    };
    
    logger.info('Export completed successfully', {
      filename,
      format: options.format,
      recordCount: filteredRequests.length,
      fileSize: stats.size,
      filters: {
        dateRange: options.dateRange,
        urgency: options.urgencyFilter,
      },
    });
    
    return result;
  } catch (error) {
    logger.error('Export failed', {
      format: options.format,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// Export statistics/summary
export interface ExportStats {
  totalRequests: number;
  urgentRequests: number;
  normalRequests: number;
  dateRange: {
    earliest: string | null;
    latest: string | null;
  };
  topTopics: Array<{
    topic: string;
    count: number;
  }>;
  requestsByMonth: Array<{
    month: string;
    count: number;
  }>;
}

export async function generateExportStats(): Promise<ExportStats> {
  try {
    const requests = await readQueue();
    
    if (requests.length === 0) {
      return {
        totalRequests: 0,
        urgentRequests: 0,
        normalRequests: 0,
        dateRange: { earliest: null, latest: null },
        topTopics: [],
        requestsByMonth: [],
      };
    }
    
    // Basic counts
    const urgentRequests = requests.filter(r => r.urgency === 'urgent').length;
    const normalRequests = requests.filter(r => r.urgency === 'normal').length;
    
    // Date range
    const dates = requests.map(r => new Date(r.createdAt)).sort((a, b) => a.getTime() - b.getTime());
    const earliest = dates[0]?.toISOString() || null;
    const latest = dates[dates.length - 1]?.toISOString() || null;
    
    // Topic analysis
    const topicCounts: Record<string, number> = {};
    requests.forEach(request => {
      const topic = request.topic.toLowerCase().trim();
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
    
    const topTopics = Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Requests by month
    const monthCounts: Record<string, number> = {};
    requests.forEach(request => {
      const date = new Date(request.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });
    
    const requestsByMonth = Object.entries(monthCounts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
    
    return {
      totalRequests: requests.length,
      urgentRequests,
      normalRequests,
      dateRange: { earliest, latest },
      topTopics,
      requestsByMonth,
    };
  } catch (error) {
    logger.error('Failed to generate export stats', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// List all export files
export async function listExports(): Promise<Array<{
  filename: string;
  path: string;
  size: number;
  created: Date;
  format: ExportFormat;
}>> {
  try {
    const exportDir = await ensureExportDir();
    const files = await fs.readdir(exportDir);
    const exportFiles = files.filter(file => 
      file.includes('support-requests-export-') && (file.endsWith('.json') || file.endsWith('.csv'))
    );
    
    const exports = [];
    
    for (const filename of exportFiles) {
      const filePath = path.join(exportDir, filename);
      const stats = await fs.stat(filePath);
      const format = filename.endsWith('.json') ? 'json' : 'csv';
      
      exports.push({
        filename,
        path: filePath,
        size: stats.size,
        created: stats.birthtime,
        format: format as ExportFormat,
      });
    }
    
    // Sort by creation date (newest first)
    return exports.sort((a, b) => b.created.getTime() - a.created.getTime());
  } catch (error) {
    logger.error('Failed to list exports', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// Clean up old export files
export async function cleanupOldExports(keepCount: number = 20): Promise<void> {
  try {
    const exports = await listExports();
    
    if (exports.length <= keepCount) {
      return;
    }
    
    const exportsToDelete = exports.slice(keepCount);
    let deletedCount = 0;
    
    for (const exportFile of exportsToDelete) {
      try {
        await fs.unlink(exportFile.path);
        deletedCount++;
      } catch (error) {
        logger.warn('Failed to delete export file', {
          filename: exportFile.filename,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    logger.info('Export cleanup completed', {
      totalExports: exports.length,
      deletedCount,
      remainingCount: exports.length - deletedCount,
    });
  } catch (error) {
    logger.error('Failed to cleanup old exports', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}