import pino from 'pino';

/**
 * Structured logging configuration using Pino
 * Follows observability requirements from constitution
 */

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export default logger;

/**
 * Log content operation
 */
export function logContentOperation(
  action: string,
  details: {
    userId?: number;
    seriesId?: number;
    contentId?: number;
    versionNumber?: number;
    [key: string]: any;
  }
): void {
  logger.info({
    operation: 'content',
    action,
    ...details,
  }, `Content operation: ${action}`);
}

/**
 * Log error with context
 */
export function logError(
  error: Error,
  context?: Record<string, any>
): void {
  logger.error({
    err: error,
    ...context,
  }, error.message);
}
