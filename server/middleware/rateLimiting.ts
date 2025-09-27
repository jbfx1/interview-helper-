import { Request, Response, NextFunction } from 'express';
import { getRateLimitOptions } from '../config';
import { logger } from '../utils/logger';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class MemoryRateLimitStore {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of Object.entries(this.store)) {
      if (now >= value.resetTime) {
        delete this.store[key];
      }
    }
  }

  get(key: string): { count: number; resetTime: number } | undefined {
    const entry = this.store[key];
    if (entry && Date.now() < entry.resetTime) {
      return entry;
    }
    return undefined;
  }

  set(key: string, count: number, resetTime: number): void {
    this.store[key] = { count, resetTime };
  }

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now();
    const resetTime = now + windowMs;
    const existing = this.get(key);

    if (existing) {
      existing.count++;
      this.store[key] = existing;
      return existing;
    } else {
      const newEntry = { count: 1, resetTime };
      this.store[key] = newEntry;
      return newEntry;
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store = {};
  }
}

// Global rate limit store
const rateLimitStore = new MemoryRateLimitStore();

// Rate limiting middleware factory
export function createRateLimiter(options?: Partial<ReturnType<typeof getRateLimitOptions>>) {
  const rateLimitOptions = getRateLimitOptions();
  const config = { ...rateLimitOptions, ...options };

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = generateKey(req);
    const result = rateLimitStore.increment(key, config.windowMs);

    // Set standard rate limit headers
    res.setHeader('X-RateLimit-Limit', config.max.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.max - result.count).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());

    if (result.count > config.max) {
      // Log rate limit exceeded
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        method: req.method,
        path: req.path,
        userAgent: req.get('user-agent'),
        count: result.count,
        limit: config.max,
      });

      res.setHeader('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000).toString());
      
      res.status(429).json({
        error: 'Too Many Requests',
        message: config.message.error,
        retryAfter: config.message.retryAfter,
      });
      return;
    }

    next();
  };
}

// Generate rate limit key based on IP and optionally user ID
function generateKey(req: Request): string {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  // In the future, you could include user ID for authenticated requests
  // const userId = req.user?.id;
  // return userId ? `user:${userId}` : `ip:${ip}`;
  return `ip:${ip}`;
}

// Specific rate limiters for different endpoints
export const generalRateLimit = createRateLimiter();

export const supportRequestRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit support requests to 5 per 15 minutes
  message: {
    error: 'Too many support requests. Please wait before submitting another request.',
    retryAfter: 15 * 60, // 15 minutes in seconds
  },
});

export const healthCheckRateLimit = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Allow more frequent health checks
  message: {
    error: 'Too many health check requests.',
    retryAfter: 60,
  },
});

// Admin endpoints rate limiter (stricter)
export const adminRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Fewer requests for admin operations
  message: {
    error: 'Too many admin requests. Please wait before trying again.',
    retryAfter: 5 * 60,
  },
});

// Cleanup function for graceful shutdown
export function cleanupRateLimit(): void {
  rateLimitStore.destroy();
}

// Export store for testing
export { rateLimitStore };