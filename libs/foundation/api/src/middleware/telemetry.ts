import { createMiddleware } from '../create-middleware.js';
import type { ApiExecutionContext } from '../types.js';

/** OpenTelemetry-shaped span port — no OTel dependency. */
export interface ApiSpan {
  setStatus(status: 'ok' | 'error', message?: string): void;
  recordException(error: unknown): void;
  end(): void;
}

/** Tracer port — provide your own OTel adapter. */
export interface ApiTracer {
  startSpan(name: string): ApiSpan;
}

export interface TelemetryOptions {
  tracer: ApiTracer;
}

/**
 * Wraps each action call in a span. Span is always ended in finally
 * so it never leaks even when the action throws.
 */
export function telemetry<TInput, TOutput, TContext extends ApiExecutionContext>({
  tracer,
}: TelemetryOptions) {
  return createMiddleware<TInput, TOutput, TContext>(
    async ({ metadata, next }) => {
      const spanName = [metadata.feature, metadata.action]
        .filter(Boolean)
        .join('/') || 'api.action';
      const span = tracer.startSpan(spanName);
      try {
        const result = await next();
        span.setStatus('ok');
        return result;
      } catch (err) {
        span.setStatus('error', err instanceof Error ? err.message : String(err));
        span.recordException(err);
        throw err;
      } finally {
        span.end();
      }
    },
  );
}
