import type { ApiMiddleware, ApiExecutionContext } from './types';

/**
 * Identity helper that constrains and infers middleware types.
 * Wrap your middleware function with this to get full type inference
 * without having to spell out the generics manually.
 */
export function createMiddleware<
  TInput = unknown,
  TOutput = unknown,
  TContext extends ApiExecutionContext = ApiExecutionContext,
>(fn: ApiMiddleware<TInput, TOutput, TContext>): ApiMiddleware<TInput, TOutput, TContext> {
  return fn;
}
