import express, { Request, Response } from 'express';
import { promises as fs } from 'fs';
import { readQueue, queueFilePath } from '../queue';
import { serverConfig } from '../config';
import { logger } from '../utils/logger';
import { healthCheckRateLimit } from '../middleware/rateLimiting';
import { healthCheckLogger } from '../middleware/logging';

const router = express.Router();

// Apply rate limiting and logging to health check routes
router.use(healthCheckRateLimit);
router.use(healthCheckLogger);

// Basic health check
router.get('/', async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
    
    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Detailed health check
router.get('/detailed', async (req: Request, res: Response) => {
  const checks: Record<string, any> = {};
  let overallStatus = 'healthy';
  
  try {
    // Check queue file accessibility
    try {
      const queueFile = queueFilePath();
      await fs.access(queueFile);
      const stats = await fs.stat(queueFile);
      checks.queueFile = {
        status: 'healthy',
        path: queueFile,
        size: stats.size,
        modified: stats.mtime.toISOString(),
      };
    } catch (error) {
      checks.queueFile = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      overallStatus = 'degraded';
    }
    
    // Check data integrity
    try {
      const queue = await readQueue();
      const validRequests = queue.filter(request => 
        request.id && 
        request.name && 
        request.email && 
        request.topic && 
        request.message &&
        request.createdAt &&
        ['normal', 'urgent'].includes(request.urgency)
      );
      
      checks.dataIntegrity = {
        status: validRequests.length === queue.length ? 'healthy' : 'degraded',
        totalRequests: queue.length,
        validRequests: validRequests.length,
        invalidRequests: queue.length - validRequests.length,
      };
      
      if (validRequests.length !== queue.length) {
        overallStatus = 'degraded';
      }
    } catch (error) {
      checks.dataIntegrity = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      overallStatus = 'unhealthy';
    }
    
    // Check system resources
    const memUsage = process.memoryUsage();
    checks.systemResources = {
      status: 'healthy',
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(memUsage.external / 1024 / 1024) + ' MB',
      },
      uptime: Math.round(process.uptime()) + ' seconds',
      nodeVersion: process.version,
    };
    
    // Check disk space (simplified check)
    try {
      const queueFile = queueFilePath();
      const stats = await fs.stat(queueFile);
      checks.diskSpace = {
        status: 'healthy',
        queueFileSize: stats.size,
      };
    } catch (error) {
      checks.diskSpace = {
        status: 'warning',
        error: 'Could not check disk space',
      };
    }
    
    // Configuration check
    checks.configuration = {
      status: 'healthy',
      environment: serverConfig.NODE_ENV,
      logLevel: serverConfig.LOG_LEVEL,
      rateLimiting: {
        windowMs: serverConfig.RATE_LIMIT_WINDOW_MS,
        maxRequests: serverConfig.RATE_LIMIT_MAX_REQUESTS,
      },
    };
    
    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: serverConfig.NODE_ENV,
      checks,
    };
    
    // Return appropriate HTTP status
    if (overallStatus === 'unhealthy') {
      return res.status(503).json(response);
    } else if (overallStatus === 'degraded') {
      return res.status(200).json(response);
    } else {
      return res.status(200).json(response);
    }
  } catch (error) {
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      checks,
    });
  }
});

// Readiness check (for container orchestration)
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if we can read from the queue file
    await readQueue();
    
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Liveness check (for container orchestration)
router.get('/live', (req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Performance metrics
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const queue = await readQueue();
    const memUsage = process.memoryUsage();
    
    // Calculate some basic metrics
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentRequests = queue.filter(r => new Date(r.createdAt) > dayAgo);
    const weeklyRequests = queue.filter(r => new Date(r.createdAt) > weekAgo);
    
    const metrics = {
      timestamp: now.toISOString(),
      application: {
        totalRequests: queue.length,
        requestsLast24h: recentRequests.length,
        requestsLast7d: weeklyRequests.length,
        urgentRequestsLast24h: recentRequests.filter(r => r.urgency === 'urgent').length,
      },
      system: {
        uptime: process.uptime(),
        memory: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          heapUsedPercentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
        },
        node: {
          version: process.version,
          platform: process.platform,
          arch: process.arch,
        },
      },
    };
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to collect metrics',
      timestamp: new Date().toISOString(),
    });
  }
});

export { router as healthRouter };