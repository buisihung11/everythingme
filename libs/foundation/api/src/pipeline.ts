import type {
  ApiMetadata,
  ApiMiddleware,
  ApiHandler,
  ApiExecutionContext,
} from './types';

type Step<TInput, TOutput, TContext extends ApiExecutionContext> = (
  input: TInput,
  ctx: TContext,
) => Promise<TOutput>;

/**
 * Folds middleware right-to-left into a single function at handler() time.
 * No per-call rebuilding: the pipeline is composed once and reused.
 *
 * Execution order: middleware[0] → middleware[1] → ... → handler
 */
export function composePipeline<
  TInput,
  TOutput,
  TContext extends ApiExecutionContext = ApiExecutionContext,
>(
  middleware: ReadonlyArray<ApiMiddleware<TInput, TOutput, TContext>>,
  handler: ApiHandler<TInput, TOutput, TContext>,
  metadata: Readonly<ApiMetadata>,
): (input: TInput, ctx: TContext) => Promise<TOutput> {
  let current: Step<TInput, TOutput, TContext> = (input, ctx) =>
    handler({ input, ctx });

  for (let i = middleware.length - 1; i >= 0; i--) {
    const mw = middleware[i];
    const downstream = current;
    current = (input, ctx) =>
      mw({
        input,
        ctx,
        metadata,
        next: (options) =>
          downstream(
            options?.input ?? input,
            options?.ctx ? { ...ctx, ...options.ctx } : ctx,
          ),
      });
  }

  return current;
}
