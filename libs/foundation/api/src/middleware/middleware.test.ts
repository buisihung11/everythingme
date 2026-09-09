import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { createApiClient } from '../client';
import {
  ApiError,
  ApiValidationError,
  ApiTimeoutError,
} from '../errors';
import { validate, validateOutput } from './validation';
import { telemetry } from './telemetry';
import type { ApiSpan, ApiTracer } from './telemetry';
import { logging } from './logging';
import type { ApiLogger } from './logging';
import { retry } from './retry';
import { timeout } from './timeout';
import { errorNormalization } from './error-normalization';

// ---------------------------------------------------------------------------
// validate
// ---------------------------------------------------------------------------

describe('validate middleware', () => {
  const schema = z.object({ name: z.string().min(1) });

  it('passes valid input to the handler unchanged', async () => {
    const action = createApiClient()
      .input(schema)
      .handler(async ({ input }) => input.name);

    expect(await action({ name: 'Alice' })).toBe('Alice');
  });

  it('throws ApiValidationError on invalid input', async () => {
    const action = createApiClient()
      .input(schema)
      .handler(async () => 'unreachable');

    await expect(action({ name: '' })).rejects.toBeInstanceOf(ApiValidationError);
  });

  it('forwards the parsed (coerced) value from the schema', async () => {
    const coerceSchema = z.object({ count: z.coerce.number() });
    let received: unknown;

    const action = createApiClient()
      .input(coerceSchema)
      .handler(async ({ input }) => {
        received = input;
        return 'ok';
      });

    await action({ count: '42' as unknown as number });
    expect((received as { count: number }).count).toBe(42);
  });

  it('throws ApiValidationError on invalid output', async () => {
    const outputSchema = z.object({ id: z.number() });
    const action = createApiClient()
      .output(outputSchema)
      .handler(async () => ({ id: 'not-a-number' } as unknown as { id: number }));

    await expect(action({})).rejects.toBeInstanceOf(ApiValidationError);
  });

  it('attaches feature/action to ApiValidationError from metadata', async () => {
    const action = createApiClient()
      .metadata({ feature: 'users', action: 'create' })
      .input(schema)
      .handler(async () => 'unreachable');

    const err = await action({ name: '' }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiValidationError);
    expect(err.feature).toBe('users');
    expect(err.action).toBe('create');
  });
});

// ---------------------------------------------------------------------------
// telemetry
// ---------------------------------------------------------------------------

describe('telemetry middleware', () => {
  function makeTracer() {
    const span: ApiSpan = {
      setStatus: vi.fn(),
      recordException: vi.fn(),
      end: vi.fn(),
    };
    const tracer: ApiTracer = { startSpan: vi.fn(() => span) };
    return { tracer, span };
  }

  it('starts a span, sets ok status, and ends it on success', async () => {
    const { tracer, span } = makeTracer();
    const action = createApiClient()
      .metadata({ feature: 'billing', action: 'charge' })
      .use(telemetry({ tracer }))
      .handler(async () => 'ok');

    await action({});
    expect(tracer.startSpan).toHaveBeenCalledWith('billing/charge');
    expect(span.setStatus).toHaveBeenCalledWith('ok');
    expect(span.end).toHaveBeenCalledOnce();
  });

  it('records exception and ends span on error', async () => {
    const { tracer, span } = makeTracer();
    const boom = new Error('boom');
    const action = createApiClient()
      .use(telemetry({ tracer }))
      .handler(async () => { throw boom; });

    await expect(action({})).rejects.toThrow('boom');
    expect(span.recordException).toHaveBeenCalledWith(boom);
    expect(span.setStatus).toHaveBeenCalledWith('error', 'boom');
    expect(span.end).toHaveBeenCalledOnce();
  });

  it('always ends the span even when the handler throws', async () => {
    const { tracer, span } = makeTracer();
    const action = createApiClient()
      .use(telemetry({ tracer }))
      .handler(async () => { throw new Error('oops'); });

    await action({}).catch(() => undefined);
    expect(span.end).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// logging
// ---------------------------------------------------------------------------

describe('logging middleware', () => {
  function makeLogger(): ApiLogger {
    return { info: vi.fn(), error: vi.fn() };
  }

  it('logs start and success', async () => {
    const logger = makeLogger();
    const action = createApiClient()
      .metadata({ feature: 'foo', action: 'bar' })
      .use(logging({ logger }))
      .handler(async () => 'ok');

    await action({});
    expect(logger.info).toHaveBeenCalledTimes(2);
    expect((logger.info as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain('start');
    expect((logger.info as ReturnType<typeof vi.fn>).mock.calls[1][0]).toContain('success');
  });

  it('logs error on failure', async () => {
    const logger = makeLogger();
    const action = createApiClient()
      .use(logging({ logger }))
      .handler(async () => { throw new Error('fail'); });

    await action({}).catch(() => undefined);
    expect(logger.error).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// retry
// ---------------------------------------------------------------------------

describe('retry middleware', () => {
  it('succeeds on first attempt without retrying', async () => {
    let calls = 0;
    const action = createApiClient()
      .use(retry({ attempts: 3, delayMs: 0 }))
      .handler(async () => { calls++; return 'ok'; });

    expect(await action({})).toBe('ok');
    expect(calls).toBe(1);
  });

  it('retries up to the configured attempt count', async () => {
    let calls = 0;
    const action = createApiClient()
      .use(retry({ attempts: 3, delayMs: 0 }))
      .handler(async () => { calls++; throw new Error('transient'); });

    await expect(action({})).rejects.toThrow('transient');
    expect(calls).toBe(3);
  });

  it('succeeds after one retry', async () => {
    let calls = 0;
    const action = createApiClient()
      .use(retry({ attempts: 3, delayMs: 0 }))
      .handler(async () => {
        calls++;
        if (calls < 2) throw new Error('retry me');
        return 'recovered';
      });

    expect(await action({})).toBe('recovered');
    expect(calls).toBe(2);
  });

  it('does not retry ApiValidationError by default', async () => {
    let calls = 0;
    const action = createApiClient()
      .use(retry({ attempts: 3, delayMs: 0 }))
      .handler(async () => {
        calls++;
        throw new ApiValidationError('bad input', [{ message: 'required' }]);
      });

    await expect(action({})).rejects.toBeInstanceOf(ApiValidationError);
    expect(calls).toBe(1);
  });

  it('respects custom retryOn predicate', async () => {
    let calls = 0;
    const action = createApiClient()
      .use(retry({ attempts: 3, delayMs: 0, retryOn: (e) => e instanceof TypeError }))
      .handler(async () => {
        calls++;
        throw new Error('non-retryable');
      });

    await expect(action({})).rejects.toThrow('non-retryable');
    expect(calls).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// timeout
// ---------------------------------------------------------------------------

describe('timeout middleware', () => {
  it('resolves when the handler finishes before the deadline', async () => {
    const action = createApiClient()
      .use(timeout({ ms: 500 }))
      .handler(async () => 'fast');

    expect(await action({})).toBe('fast');
  });

  it('rejects with ApiTimeoutError when the handler exceeds the deadline', async () => {
    const action = createApiClient()
      .use(timeout({ ms: 10 }))
      .handler(() => new Promise((resolve) => setTimeout(() => resolve('slow'), 200)));

    await expect(action({})).rejects.toBeInstanceOf(ApiTimeoutError);
  });

  it('injects ctx.signal into the handler', async () => {
    let receivedSignal: AbortSignal | undefined;
    const action = createApiClient()
      .use(timeout({ ms: 500 }))
      .handler(async ({ ctx }) => {
        receivedSignal = ctx.signal;
        return 'ok';
      });

    await action({});
    expect(receivedSignal).toBeInstanceOf(AbortSignal);
  });

  it('aborts ctx.signal on timeout', async () => {
    let capturedSignal: AbortSignal | undefined;
    const action = createApiClient()
      .use(timeout({ ms: 10 }))
      .handler(({ ctx }) => {
        capturedSignal = ctx.signal;
        return new Promise((resolve) => setTimeout(() => resolve('slow'), 200));
      });

    await action({}).catch(() => undefined);
    expect(capturedSignal?.aborted).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// errorNormalization
// ---------------------------------------------------------------------------

describe('errorNormalization middleware', () => {
  it('wraps plain Error into ApiError', async () => {
    const action = createApiClient()
      .metadata({ feature: 'x', action: 'y' })
      .use(errorNormalization())
      .handler(async () => { throw new Error('raw'); });

    const err = await action({}).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe('raw');
    expect(err.feature).toBe('x');
    expect(err.action).toBe('y');
  });

  it('passes ApiError subclasses through unchanged', async () => {
    const validationErr = new ApiValidationError('bad', [{ message: 'required' }]);
    const action = createApiClient()
      .use(errorNormalization())
      .handler(async () => { throw validationErr; });

    const err = await action({}).catch((e) => e);
    expect(err).toBe(validationErr);
    expect(err).toBeInstanceOf(ApiValidationError);
  });

  it('wraps non-Error throws (strings, objects)', async () => {
    const action = createApiClient()
      .use(errorNormalization())
      .handler(async () => { throw 'something went wrong'; });

    const err = await action({}).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toContain('something went wrong');
  });
});
