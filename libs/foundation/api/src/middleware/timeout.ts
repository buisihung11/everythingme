import { createMiddleware } from '../create-middleware';
import { ApiTimeoutError } from '../errors';
import type { ApiExecutionContext } from '../types';

export interface TimeoutOptions {
  /** Milliseconds before the action is considered timed out. */
  ms: number;
}

/**
 * Races the downstream pipeline against a timer.
 * On timeout, throws ApiTimeoutError and injects ctx.signal (AbortSignal)
 * so handlers can cancel in-flight fetches rather than being silently abandoned.
 */
export function timeout<TInput, TOutput, TContext extends ApiExecutionContext>({
  ms,
}: TimeoutOptions) {
  return createMiddleware<TInput, TOutput, TContext>(
    ({ ctx, metadata, next }) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), ms);

      const race = Promise.race([
        next({ ctx: { ...ctx, signal: controller.signal } as Partial<TContext> }),
        new Promise<never>((_, reject) =>
          controller.signal.addEventListener('abort', () =>
            reject(
              new ApiTimeoutError(
                ms,
                metadata.feature as string | undefined,
                metadata.action as string | undefined,
              ),
            ),
          ),
        ),
      ]);

      return race.finally(() => clearTimeout(timer));
    },
  );
}
