import { createMiddleware } from '../create-middleware.js';
import { ApiTimeoutError } from '../errors.js';
import type { ApiExecutionContext } from '../types.js';

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
      const work = Promise.resolve(
        next({
          ctx: { ...ctx, signal: controller.signal } as Partial<TContext>,
        }),
      );

      let settled = false;
      const timer = setTimeout(() => controller.abort(), ms);

      return new Promise<TOutput>((resolve, reject) => {
        const failTimeout = () => {
          if (settled) return;
          settled = true;
          reject(
            new ApiTimeoutError(
              ms,
              metadata.feature as string | undefined,
              metadata.action as string | undefined,
            ),
          );
        };

        controller.signal.addEventListener('abort', failTimeout, { once: true });

        // Always attach fulfillment/rejection handlers so a late abort from
        // the handler cannot become an unhandledRejection after timeout wins.
        work.then(
          (value) => {
            if (settled) return;
            if (controller.signal.aborted) {
              failTimeout();
              return;
            }
            settled = true;
            resolve(value);
          },
          (err) => {
            if (settled) return;
            // Handler rejected because we aborted — keep the documented
            // ApiTimeoutError rather than leaking AbortError/DOMException.
            if (controller.signal.aborted) {
              failTimeout();
              return;
            }
            settled = true;
            reject(err);
          },
        );
      }).finally(() => clearTimeout(timer));
    },
  );
}
