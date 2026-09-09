import { createMiddleware } from '../create-middleware';
import { ApiValidationError } from '../errors';
import type { ApiExecutionContext } from '../types';

export interface RetryOptions {
  /** Maximum number of attempts (including the first). Default: 3. */
  attempts?: number;
  /** Base delay in milliseconds before the first retry. Default: 100. */
  delayMs?: number;
  /** Backoff multiplier applied after each retry. Default: 2 (exponential). */
  backoff?: number;
  /**
   * Predicate to decide whether an error is retryable.
   * Defaults to retrying everything except ApiValidationError.
   */
  retryOn?: (error: unknown) => boolean;
}

const defaultRetryOn = (err: unknown) => !(err instanceof ApiValidationError);

/**
 * Retries the downstream pipeline on failure with optional exponential backoff.
 */
export function retry<TInput, TOutput, TContext extends ApiExecutionContext>({
  attempts = 3,
  delayMs = 100,
  backoff = 2,
  retryOn = defaultRetryOn,
}: RetryOptions = {}) {
  return createMiddleware<TInput, TOutput, TContext>(
    async ({ next }) => {
      let lastError: unknown;
      let delay = delayMs;

      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          return await next();
        } catch (err) {
          lastError = err;
          if (attempt === attempts || !retryOn(err)) {
            throw err;
          }
          if (delay > 0) {
            await sleep(delay);
          }
          delay *= backoff;
        }
      }
      throw lastError;
    },
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
