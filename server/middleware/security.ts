import express, { Request, Response, NextFunction } from 'express';
import { getSecurityConfig, isProduction } from '../config';
import { logger } from '../utils/logger';

const securityConfig = getSecurityConfig();

// Input sanitization middleware
export function sanitizeInput(req: Request, res: Response, next: NextFunction): void {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    // Only sanitize query if it's writable (not in test mode)
    if (req.query && typeof req.query === 'object') {
      try {
        const sanitized = sanitizeObject(req.query);
        Object.assign(req.query, sanitized);
      } catch (error) {
        // Skip query sanitization if not writable (test environment)
      }
    }
    
    if (req.params && typeof req.params === 'object') {
      try {
        const sanitized = sanitizeObject(req.params);
        Object.assign(req.params, sanitized);
      } catch (error) {
        // Skip params sanitization if not writable
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Basic XSS prevention - remove script tags and dangerous attributes
      sanitized[key] = value
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/javascript:/gi, '')
        .trim();
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Request timeout middleware
export function requestTimeout(req: Request, res: Response, next: NextFunction): void {
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      logger.warn('Request timeout', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        timeout: securityConfig.requestTimeout,
      });
      
      res.status(408).json({
        error: 'Request timeout',
        message: 'The request took too long to process',
      });
    }
  }, securityConfig.requestTimeout);

  // Clear timeout when response is finished
  res.on('finish', () => clearTimeout(timeout));
  res.on('close', () => clearTimeout(timeout));
  
  next();
}

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (isProduction()) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '));
  }
  
  // Remove server identification
  res.removeHeader('X-Powered-By');
  
  next();
}

// Request size limiting middleware
export function requestSizeLimit(): express.RequestHandler {
  return express.json({
    limit: securityConfig.maxRequestSize,
    strict: true,
  });
}

// IP filtering middleware (can be extended for production use)
export function ipFilter(req: Request, res: Response, next: NextFunction): void {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Log suspicious activity
  if (req.path.includes('..') || req.path.includes('%2e%2e')) {
    logger.warn('Suspicious path traversal attempt', {
      ip: clientIP,
      path: req.path,
      userAgent: req.get('user-agent'),
    });
    
    res.status(400).json({
      error: 'Invalid request path',
    });
    return;
  }
  
  next();
}

// CSRF protection middleware (simple token-based approach)
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Skip CSRF protection for GET requests and in development
  if (req.method === 'GET' || !isProduction()) {
    return next();
  }
  
  // const token = req.headers['x-csrf-token'] || req.body._csrf;
  // const sessionToken = req.session?.csrfToken;
  
  // For now, we'll implement a simple origin check
  const origin = req.get('origin');
  const referer = req.get('referer');
  
  if (!origin && !referer) {
    logger.warn('Request without origin or referer header', {
      ip: req.ip,
      method: req.method,
      path: req.path,
    });
    
    res.status(403).json({
      error: 'Invalid request origin',
    });
    return;
  }
  
  next();
}

// Error handling middleware for security-related errors
export function securityErrorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error.name === 'PayloadTooLargeError') {
    logger.warn('Request payload too large', {
      ip: req.ip,
      method: req.method,
      path: req.path,
      contentLength: req.get('content-length'),
    });
    
    res.status(413).json({
      error: 'Payload too large',
      message: `Request body cannot exceed ${securityConfig.maxRequestSize}`,
    });
    return;
  }
  
  if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
    res.status(400).json({
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON',
    });
    return;
  }
  
  next(error);
}

// Trust proxy configuration
export function configureProxy(app: express.Application): void {
  if (securityConfig.trustProxy) {
    app.set('trust proxy', 1);
  }
}