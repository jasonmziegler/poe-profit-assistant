import winston from 'winston';
import path from 'path';

const logDir = path.resolve('data/logs');

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'poe-profit-assistant' },
  transports: [
    // Write all logs to files
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Development logging to console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export interface ApiCallMetrics {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  rateLimitRemaining?: number;
  retryCount?: number;
}

export interface CharacterFetchMetrics {
  league: string;
  requested: number;
  successful: number;
  failed: number;
  duration: number;
  fromCache: boolean;
  cacheHit?: boolean;
}

export class ApiLogger {
  static logApiCall(metrics: ApiCallMetrics): void {
    logger.info('API call completed', {
      category: 'api_call',
      endpoint: metrics.endpoint,
      method: metrics.method,
      duration_ms: metrics.duration,
      status_code: metrics.statusCode,
      rate_limit_remaining: metrics.rateLimitRemaining,
      retry_count: metrics.retryCount || 0
    });
  }

  static logRateLimit(endpoint: string, tokensRemaining: number, waitTime?: number): void {
    logger.info('Rate limit check', {
      category: 'rate_limit',
      endpoint,
      tokens_remaining: tokensRemaining,
      wait_time_ms: waitTime
    });
  }

  static logCharacterFetch(metrics: CharacterFetchMetrics): void {
    logger.info('Character fetch completed', {
      category: 'character_fetch',
      league: metrics.league,
      requested_count: metrics.requested,
      successful_count: metrics.successful,
      failed_count: metrics.failed,
      duration_ms: metrics.duration,
      from_cache: metrics.fromCache,
      cache_hit: metrics.cacheHit
    });
  }

  static logCacheOperation(operation: 'read' | 'write' | 'cleanup' | 'info_request' | 'trigger_start', details: Record<string, any>): void {
    logger.info('Cache operation', {
      category: 'cache',
      operation,
      ...details
    });
  }

  static logError(context: string, error: Error, metadata?: Record<string, any>): void {
    logger.error('Error occurred', {
      category: 'error',
      context,
      error_message: error.message,
      error_stack: error.stack,
      ...metadata
    });
  }

  static logApiFailure(endpoint: string, statusCode: number, errorMessage: string): void {
    logger.error('API call failed', {
      category: 'api_failure',
      endpoint,
      status_code: statusCode,
      error_message: errorMessage
    });
  }

  static logValidationFailure(context: string, validationError: string, data?: any): void {
    logger.error('Data validation failed', {
      category: 'validation_failure',
      context,
      validation_error: validationError,
      invalid_data: data
    });
  }
}