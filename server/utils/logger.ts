import { getLoggingConfig, isProduction } from '../config';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  metadata?: Record<string, any>;
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

class Logger {
  private config = getLoggingConfig();
  private minLevel = this.getLogLevelValue(this.config.level);

  private getLogLevelValue(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warn': return LogLevel.WARN;
      case 'error': return LogLevel.ERROR;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatMessage(level: string, message: string, metadata?: Record<string, any>): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      metadata,
    };

    if (this.config.format === 'json' || isProduction()) {
      return JSON.stringify(entry);
    } else {
      const time = new Date().toLocaleTimeString();
      const meta = metadata ? ` ${JSON.stringify(metadata)}` : '';
      return `[${time}] ${level.toUpperCase()}: ${message}${meta}`;
    }
  }

  private log(level: LogLevel, levelName: string, message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;

    const formatted = this.formatMessage(levelName, message, metadata);
    
    if (level >= LogLevel.ERROR) {
      console.error(formatted);
    } else if (level >= LogLevel.WARN) {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, 'debug', message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, 'info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, 'warn', message, metadata);
  }

  error(message: string, metadata?: Record<string, any>): void;
  error(error: Error, metadata?: Record<string, any>): void;
  error(messageOrError: string | Error, metadata?: Record<string, any>): void {
    if (messageOrError instanceof Error) {
      this.log(LogLevel.ERROR, 'error', messageOrError.message, {
        ...metadata,
        stack: messageOrError.stack,
        name: messageOrError.name,
      });
    } else {
      this.log(LogLevel.ERROR, 'error', messageOrError, metadata);
    }
  }

  // Request logging utilities
  logRequest(method: string, url: string, statusCode: number, responseTime: number, ip?: string, userAgent?: string): void {
    if (!this.config.enableRequestLogging) return;
    
    this.info('HTTP Request', {
      method,
      url,
      statusCode,
      responseTime,
      ip,
      userAgent,
    });
  }

  logError(error: Error, request?: { method?: string; url?: string; ip?: string }): void {
    this.error(error, {
      request: request ? {
        method: request.method,
        url: request.url,
        ip: request.ip,
      } : undefined,
    });
  }

  // Application lifecycle logging
  logStartup(port: number, env: string): void {
    this.info('Application started', {
      port,
      environment: env,
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    });
  }

  logShutdown(signal?: string): void {
    this.info('Application shutting down', {
      signal,
      timestamp: new Date().toISOString(),
    });
  }

  // Support request logging
  logSupportRequest(id: string, urgency: string, email: string): void {
    this.info('Support request created', {
      requestId: id,
      urgency,
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email for privacy
    });
  }

  logSupportRequestError(error: Error, payload?: Record<string, any>): void {
    this.error('Support request failed', {
      error: error.message,
      payload: payload ? {
        ...payload,
        email: payload.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
      } : undefined,
    });
  }
}

// Export singleton logger instance
export const logger = new Logger();

// Export logger class for testing
export { Logger };