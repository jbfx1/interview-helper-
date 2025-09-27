import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { appendToQueue } from './queue';
import { 
  serverConfig, 
  getCorsOptions, 
  getSecurityConfig, 
  isProduction 
} from './config';
import { logger } from './utils/logger';
import { 
  startAutomaticBackups, 
  stopAutomaticBackups 
} from './utils/backup';
import {
  sanitizeInput,
  securityHeaders,
  requestSizeLimit,
  ipFilter,
  configureProxy,
  securityErrorHandler,
} from './middleware/security';
import {
  generalRateLimit,
  supportRequestRateLimit,
  cleanupRateLimit,
} from './middleware/rateLimiting';
import {
  loggingMiddleware,
  errorLogger,
  logSupportRequestEvent,
} from './middleware/logging';
import { adminRouter } from './routes/admin';
import { healthRouter } from './routes/health';

const bodySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  topic: z.string().min(3),
  message: z.string().min(10),
  urgency: z.enum(['normal', 'urgent'])
});

export type SupportRequestBody = z.infer<typeof bodySchema>;

export function createApp() {
  const app = express();
  const securityConfig = getSecurityConfig();
  
  // Configure proxy settings
  configureProxy(app);
  
  // Security middleware (applied first)
  app.use(securityHeaders);
  
  // Request size limiting
  app.use(requestSizeLimit());
  
  // CORS configuration
  app.use(cors(getCorsOptions()));
  
  // General security middleware
  app.use(sanitizeInput);
  app.use(ipFilter);
  
  // Logging middleware
  app.use(loggingMiddleware);
  
  // General rate limiting
  app.use(generalRateLimit);
  
  // Health check routes (mounted before other routes)
  app.use('/health', healthRouter);
  
  // Admin routes (with authentication)
  app.use('/admin', adminRouter);

  // Support endpoint with specific rate limiting
  app.post('/support', supportRequestRateLimit, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) {
        logger.warn('Invalid support request payload', {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          errors: parsed.error.format(),
        });
        
        return res.status(400).json({ 
          error: 'Invalid payload', 
          details: parsed.error.format() 
        });
      }

      const entry = {
        ...parsed.data,
        id: randomUUID(),
        createdAt: new Date().toISOString()
      };

      await appendToQueue(entry);
      
      // Log successful support request
      logger.logSupportRequest(entry.id, entry.urgency, entry.email);
      logSupportRequestEvent('created', entry.id, {
        urgency: entry.urgency,
        topic: entry.topic,
      });

      return res.status(201).json({ status: 'ok', id: entry.id });
    } catch (error) {
      logger.logSupportRequestError(
        error instanceof Error ? error : new Error('Unknown error'),
        req.body
      );
      return next(error);
    }
  });

  // 404 handler for unknown routes
  app.use((req: Request, res: Response) => {
    logger.warn('Route not found', {
      method: req.method,
      path: req.originalUrl || req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    
    res.status(404).json({
      error: 'Route not found',
      message: 'The requested resource was not found on this server',
    });
  });

  // Security error handler
  app.use(securityErrorHandler);

  // Request error logger
  app.use(errorLogger);

  // Global error handler (must be last)
  app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('Unhandled application error', {
      error: errorMessage,
      stack: errorStack,
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: isProduction() 
          ? 'An unexpected error occurred' 
          : errorMessage,
      });
    }
  });

  return app;
}

// Graceful shutdown handling
export function setupGracefulShutdown(server: any) {
  const gracefulShutdown = (signal: string) => {
    logger.logShutdown(signal);
    
    server.close(() => {
      logger.info('HTTP server closed');
      
      // Clean up resources
      cleanupRateLimit();
      stopAutomaticBackups();
      
      process.exit(0);
    });

    // Force close after timeout
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  // Listen for termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', { 
      reason: reason instanceof Error ? reason.message : String(reason),
      promise: String(promise),
    });
  });
}

// Initialize automatic backups
export function initializeServices() {
  if (isProduction()) {
    startAutomaticBackups();
    logger.info('Production services initialized', {
      automaticBackups: true,
    });
  } else {
    logger.info('Development mode - skipping automatic backups');
  }
}
