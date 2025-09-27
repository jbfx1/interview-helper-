import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { readQueue } from '../queue';
import { logger } from '../utils/logger';
import { 
  createBackup, 
  listBackups, 
  restoreFromBackup,
  cleanupOldBackups,
  applyDataRetention 
} from '../utils/backup';
import {
  exportSupportRequests,
  generateExportStats,
  listExports,
  cleanupOldExports,
  type ExportOptions
} from '../utils/export';
import { adminRateLimit } from '../middleware/rateLimiting';
import { logSupportRequestEvent } from '../middleware/logging';

const router = express.Router();

// Apply admin rate limiting to all routes
router.use(adminRateLimit);

// Basic auth middleware (simplified for demo - use proper auth in production)
function basicAuth(req: Request, res: Response, next: NextFunction): void {
  // In production, implement proper authentication (JWT, OAuth, etc.)
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"');
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  // For demo purposes only - use secure auth in production
  const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
  const [username, password] = credentials.split(':');
  
  if (username === 'admin' && password === 'admin123') {
    next();
  } else {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"');
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
}

// Apply basic auth to all admin routes
router.use(basicAuth);

// Get all support requests with pagination and filtering
const getRequestsSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  urgency: z.enum(['normal', 'urgent']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'urgency', 'name']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

router.get('/requests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = getRequestsSchema.parse(req.query);
    const allRequests = await readQueue();
    
    // Apply filters
    let filteredRequests = allRequests;
    
    if (query.urgency) {
      filteredRequests = filteredRequests.filter(r => r.urgency === query.urgency);
    }
    
    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      filteredRequests = filteredRequests.filter(r => 
        r.name.toLowerCase().includes(searchTerm) ||
        r.email.toLowerCase().includes(searchTerm) ||
        r.topic.toLowerCase().includes(searchTerm) ||
        r.message.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply sorting
    filteredRequests.sort((a, b) => {
      let aValue, bValue;
      
      switch (query.sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'urgency':
          aValue = a.urgency === 'urgent' ? 1 : 0;
          bValue = b.urgency === 'urgent' ? 1 : 0;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (query.sortOrder === 'desc') {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });
    
    // Apply pagination
    const totalCount = filteredRequests.length;
    const totalPages = Math.ceil(totalCount / query.limit);
    const startIndex = (query.page - 1) * query.limit;
    const paginatedRequests = filteredRequests.slice(startIndex, startIndex + query.limit);
    
    logger.info('Admin: Retrieved support requests', {
      totalCount,
      filteredCount: filteredRequests.length,
      page: query.page,
      limit: query.limit,
      filters: {
        urgency: query.urgency,
        search: query.search,
      },
    });
    
    res.json({
      data: paginatedRequests,
      pagination: {
        page: query.page,
        limit: query.limit,
        totalCount,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrevious: query.page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get request statistics
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await readQueue();
    
    const stats = {
      totalRequests: requests.length,
      urgentRequests: requests.filter(r => r.urgency === 'urgent').length,
      normalRequests: requests.filter(r => r.urgency === 'normal').length,
      recentRequests: requests.filter(r => {
        const requestDate = new Date(r.createdAt);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return requestDate > dayAgo;
      }).length,
    };
    
    logger.info('Admin: Retrieved statistics', stats);
    
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Backup management
router.post('/backup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const backup = await createBackup();
    logSupportRequestEvent('backup_created', backup.filename);
    
    res.status(201).json({
      message: 'Backup created successfully',
      backup,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/backups', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const backups = await listBackups();
    res.json({ backups });
  } catch (error) {
    next(error);
  }
});

const restoreSchema = z.object({
  filename: z.string().min(1, 'Backup filename is required'),
});

router.post('/backup/restore', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = restoreSchema.parse(req.body);
    
    await restoreFromBackup(filename);
    logSupportRequestEvent('backup_restored', filename);
    
    res.json({
      message: 'Data restored successfully',
      restoredFrom: filename,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/backups/cleanup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keepCount = req.query.keep ? parseInt(req.query.keep as string, 10) : 10;
    await cleanupOldBackups(keepCount);
    
    res.json({
      message: 'Backup cleanup completed',
      keptCount: keepCount,
    });
  } catch (error) {
    next(error);
  }
});

// Export functionality
const exportSchema = z.object({
  format: z.enum(['json', 'csv']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  urgency: z.enum(['normal', 'urgent']).optional(),
  includeMetadata: z.boolean().optional().default(true),
});

router.post('/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exportRequest = exportSchema.parse(req.body);
    
    const options: ExportOptions = {
      format: exportRequest.format,
      includeMetadata: exportRequest.includeMetadata,
    };
    
    if (exportRequest.startDate && exportRequest.endDate) {
      options.dateRange = {
        start: new Date(exportRequest.startDate),
        end: new Date(exportRequest.endDate),
      };
    }
    
    if (exportRequest.urgency) {
      options.urgencyFilter = exportRequest.urgency;
    }
    
    const result = await exportSupportRequests(options);
    logSupportRequestEvent('data_exported', result.filename);
    
    res.json({
      message: 'Export completed successfully',
      export: result,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/export/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await generateExportStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

router.get('/exports', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exports = await listExports();
    res.json({ exports });
  } catch (error) {
    next(error);
  }
});

// Data retention
router.post('/retention/apply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await applyDataRetention();
    logSupportRequestEvent('retention_applied', 'data_retention');
    
    res.json({
      message: 'Data retention policy applied successfully',
    });
  } catch (error) {
    next(error);
  }
});

// System health check
router.get('/health', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await readQueue();
    const backups = await listBackups();
    const exports = await listExports();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      data: {
        totalRequests: requests.length,
        totalBackups: backups.length,
        totalExports: exports.length,
        latestBackup: backups[0]?.metadata.timestamp || null,
      },
    };
    
    res.json(health);
  } catch (error) {
    next(error);
  }
});

export { router as adminRouter };