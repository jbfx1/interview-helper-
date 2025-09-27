import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { getLoggingConfig } from '../config';

// Enhanced request interface to track timing
interface TimedRequest extends Request {
  startTime?: number;
  requestId?: string;
}

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Request ID middleware - adds unique ID to each request
export function requestId(req: TimedRequest, res: Response, next: NextFunction): void {
  req.requestId = generateRequestId();
  res.setHeader('X-Request-ID', req.requestId);
  next();
}

// Request timing middleware
export function requestTiming(req: TimedRequest, res: Response, next: NextFunction): void {
  req.startTime = Date.now();
  next();
}

// Request logging middleware
export function requestLogger(req: TimedRequest, res: Response, next: NextFunction): void {
  const config = getLoggingConfig();
  
  if (!config.enableRequestLogging) {
    return next();
  }

  const startTime = req.startTime || Date.now();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const userAgent = req.get('user-agent') || 'unknown';
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const requestId = req.requestId;

  // Log request start (only in debug mode)
  if (config.level === 'debug') {
    logger.debug('HTTP Request started', {
      requestId,
      method,
      url,
      ip,
      userAgent,
      contentType: req.get('content-type'),
      contentLength: req.get('content-length'),
    });
  }

  // Intercept response to log completion
  const originalSend = res.send;
  const originalJson = res.json;
  let responseBody: any;

  // Override res.send to capture response
  res.send = function(body: any) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  // Override res.json to capture response
  res.json = function(obj: any) {
    responseBody = obj;
    return originalJson.call(this, obj);
  };

  // Log when response finishes
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;
    const responseSize = res.get('content-length') || '0';

    // Log request completion
    logger.logRequest(method, url, statusCode, responseTime, ip, userAgent);

    // Log additional details for errors
    if (statusCode >= 400) {
      logger.warn('HTTP Request failed', {
        requestId,
        method,
        url,
        statusCode,
        responseTime,
        ip,
        userAgent,
        responseBody: config.level === 'debug' ? responseBody : undefined,
      });
    }

    // Log slow requests
    if (responseTime > 1000) {
      logger.warn('Slow HTTP Request', {
        requestId,
        method,
        url,
        statusCode,
        responseTime,
        ip,
        userAgent,
      });
    }

    // Performance metrics logging
    if (config.level === 'debug') {
      logger.debug('HTTP Request completed', {
        requestId,
        method,
        url,
        statusCode,
        responseTime,
        responseSize,
        ip,
        userAgent,
      });
    }
  });

  // Log when client disconnects
  res.on('close', () => {
    if (!res.finished) {
      const responseTime = Date.now() - startTime;
      logger.warn('HTTP Request interrupted', {
        requestId,
        method,
        url,
        responseTime,
        ip,
        userAgent,
      });
    }
  });

  next();
}

// Error logging middleware
export function errorLogger(
  error: Error,
  req: TimedRequest,
  res: Response,
  next: NextFunction
): void {
  const requestInfo = {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    body: req.body,
  };

  logger.logError(error, requestInfo);
  next(error);
}

// Health check logging (minimal)
export function healthCheckLogger(req: Request, res: Response, next: NextFunction): void {
  const config = getLoggingConfig();
  
  // Only log health checks in debug mode to avoid noise
  if (config.level === 'debug') {
    logger.debug('Health check requested', {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }
  
  next();
}

// Security event logger
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high',
  req: Request,
  details?: Record<string, any>
): void {
  const logData = {
    event,
    severity,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    method: req.method,
    url: req.originalUrl || req.url,
    timestamp: new Date().toISOString(),
    ...details,
  };

  if (severity === 'high') {
    logger.error('Security Event', logData);
  } else if (severity === 'medium') {
    logger.warn('Security Event', logData);
  } else {
    logger.info('Security Event', logData);
  }
}

// Business logic event logger for support requests
export function logSupportRequestEvent(
  event: 'created' | 'failed' | 'validated' | 'backup_created' | 'backup_restored' | 'data_exported' | 'retention_applied',
  requestId: string,
  details?: Record<string, any>
): void {
  logger.info('Support Request Event', {
    event,
    supportRequestId: requestId,
    timestamp: new Date().toISOString(),
    ...details,
  });
}

// Export middleware chain for easy setup
export const loggingMiddleware = [
  requestId,
  requestTiming,
  requestLogger,
];

// Export all middleware
export {
  generateRequestId,
};