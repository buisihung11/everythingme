import { createMiddleware } from '../create-middleware.js';
import type { ApiExecutionContext } from '../types.js';

/** Logger port — defaults to console. */
export interface ApiLogger {
  info(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

const defaultLogger: ApiLogger = {
  info: (message, data) => console.info(message, data ?? ''),
  error: (message, data) => console.error(message, data ?? ''),
};

export interface LoggingOptions {
  logger?: ApiLogger;
}

/**
 * Logs action start, success (with duration), and error.
 */
export function logging<TInput, TOutput, TContext extends ApiExecutionContext>({
  logger = defaultLogger,
}: LoggingOptions = {}) {
  return createMiddleware<TInput, TOutput, TContext>(
    async ({ metadata, next }) => {
      const label = `${metadata.feature ?? 'api'}/${metadata.action ?? 'action'}`;
      const start = Date.now();
      logger.info(`[api] ${label} start`);
      try {
        const result = await next();
        logger.info(`[api] ${label} success`, { durationMs: Date.now() - start });
        return result;
      } catch (err) {
        logger.error(`[api] ${label} error`, {
          durationMs: Date.now() - start,
          message: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }
    },
  );
}
