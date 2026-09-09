import { createMiddleware } from '../create-middleware';
import { normalizeError } from '../errors';
import type { ApiExecutionContext } from '../types';

/**
 * Catches anything thrown by the downstream pipeline and wraps it in an
 * ApiError tagged with the action's feature/action metadata.
 * ApiError subclasses (ApiValidationError, ApiTimeoutError) pass through unchanged.
 */
export function errorNormalization<TInput, TOutput, TContext extends ApiExecutionContext>() {
  return createMiddleware<TInput, TOutput, TContext>(
    async ({ metadata, next }) => {
      try {
        return await next();
      } catch (err) {
        throw normalizeError(
          err,
          metadata.feature as string | undefined,
          metadata.action as string | undefined,
        );
      }
    },
  );
}
