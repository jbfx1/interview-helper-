import { z } from 'zod';

// Server environment configuration schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000').transform(Number),
  SUPPORT_QUEUE_FILE: z.string().default('data/support-queue.json'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
  REQUEST_TIMEOUT_MS: z.string().default('30000').transform(Number), // 30 seconds
  MAX_REQUEST_SIZE: z.string().default('10mb'),
  ENABLE_REQUEST_LOGGING: z.string().default('true').transform(val => val === 'true'),
  BACKUP_INTERVAL_HOURS: z.string().default('24').transform(Number),
  DATA_RETENTION_DAYS: z.string().default('365').transform(Number),
});

export type ServerConfig = z.infer<typeof envSchema>;

// Validate server environment variables
export function validateServerEnv(): ServerConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid server environment configuration:', error);
    process.exit(1);
  }
}

// Get server configuration
export const serverConfig = validateServerEnv();

// Export environment utilities
export const isProduction = () => serverConfig.NODE_ENV === 'production';
export const isDevelopment = () => serverConfig.NODE_ENV === 'development';
export const isTest = () => serverConfig.NODE_ENV === 'test';

// CORS configuration
export const getCorsOptions = () => ({
  origin: isProduction() 
    ? serverConfig.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : true, // Allow all origins in development
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 24 hours
});

// Rate limiting configuration
export const getRateLimitOptions = () => ({
  windowMs: serverConfig.RATE_LIMIT_WINDOW_MS,
  max: serverConfig.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(serverConfig.RATE_LIMIT_WINDOW_MS / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Database/Storage configuration
export const getStorageConfig = () => ({
  queueFile: serverConfig.SUPPORT_QUEUE_FILE,
  backupInterval: serverConfig.BACKUP_INTERVAL_HOURS * 60 * 60 * 1000, // Convert to ms
  retentionPeriod: serverConfig.DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000, // Convert to ms
});

// Logging configuration
export const getLoggingConfig = () => ({
  level: serverConfig.LOG_LEVEL,
  enableRequestLogging: serverConfig.ENABLE_REQUEST_LOGGING,
  format: isProduction() ? 'json' : 'pretty',
});

// Security configuration
export const getSecurityConfig = () => ({
  trustProxy: isProduction(),
  requestTimeout: serverConfig.REQUEST_TIMEOUT_MS,
  maxRequestSize: serverConfig.MAX_REQUEST_SIZE,
  enableHelmet: isProduction(),
});

export default {
  server: serverConfig,
  cors: getCorsOptions(),
  rateLimit: getRateLimitOptions(),
  storage: getStorageConfig(),
  logging: getLoggingConfig(),
  security: getSecurityConfig(),
};