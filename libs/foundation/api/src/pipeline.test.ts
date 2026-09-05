import { describe, it, expect, vi } from 'vitest';
import { createApiClient } from './client.js';
import { createMiddleware } from './create-middleware.js';
import { composePipeline } from './pipeline.js';
import type { ApiExecutionContext } from './types.js';

// ---------------------------------------------------------------------------
// Builder immutability
// ---------------------------------------------------------------------------

describe('ApiActionClient immutability', () => {
  it('use() returns a new instance and does not mutate the original', () => {
    const api = createApiClient();
    const mw = createMiddleware(async ({ next }) => next());
    const api2 = api.use(mw);

    expect(api2).not.toBe(api);
    expect(api._config.middleware).toHaveLength(0);
    expect(api2._config.middleware).toHaveLength(1);
  });

  it('metadata() returns a new instance without mutating the original', () => {
    const api = createApiClient();
    const api2 = api.metadata({ feature: 'users' });

    expect(api2).not.toBe(api);
    expect(api._config.metadata.feature).toBeUndefined();
    expect(api2._config.metadata.feature).toBe('users');
  });

  it('chaining multiple use() calls builds an immutable stack', () => {
    const api = createApiClient();
    const mw1 = createMiddleware(async ({ next }) => next());
    const mw2 = createMiddleware(async ({ next }) => next());
    const api2 = api.use(mw1).use(mw2);

    expect(api._config.middleware).toHaveLength(0);
    expect(api2._config.middleware).toHaveLength(2);
  });

  it('handler().metadata is frozen', async () => {
    const action = createApiClient()
      .metadata({ feature: 'test', action: 'run' })
      .handler(async () => 'ok');

    expect(Object.isFrozen(action.metadata)).toBe(true);
    expect(action.metadata.feature).toBe('test');
  });
});

// ---------------------------------------------------------------------------
// Middleware execution order
// ---------------------------------------------------------------------------

describe('middleware execution order', () => {
  it('executes middleware left-to-right before the handler', async () => {
    const order: string[] = [];

    const mw1 = createMiddleware(async ({ next }) => {
      order.push('mw1:before');
      const result = await next();
      order.push('mw1:after');
      return result;
    });

    const mw2 = createMiddleware(async ({ next }) => {
      order.push('mw2:before');
      const result = await next();
      order.push('mw2:after');
      return result;
    });

    const action = createApiClient()
      .use(mw1)
      .use(mw2)
      .handler(async () => {
        order.push('handler');
        return 'done';
      });

    await action({});
    expect(order).toEqual(['mw1:before', 'mw2:before', 'handler', 'mw2:after', 'mw1:after']);
  });

  it('passes metadata to each middleware', async () => {
    const seenMeta: string[] = [];
    const mw = createMiddleware(async ({ metadata, next }) => {
      seenMeta.push(`${metadata.feature}/${metadata.action}`);
      return next();
    });

    const action = createApiClient()
      .metadata({ feature: 'x', action: 'y' })
      .use(mw)
      .handler(async () => 'ok');

    await action({});
    expect(seenMeta).toEqual(['x/y']);
  });
});

// ---------------------------------------------------------------------------
// next({ ctx }) context merging
// ---------------------------------------------------------------------------

describe('next({ ctx }) context merging', () => {
  interface AppCtx extends ApiExecutionContext {
    userId?: string;
    role?: string;
  }

  it('next({ ctx }) merges partial context for downstream middleware', async () => {
    let receivedCtx: AppCtx | undefined;

    const inject = createMiddleware<unknown, unknown, AppCtx>(async ({ next }) =>
      next({ ctx: { userId: 'u1' } }),
    );

    const capture = createMiddleware<unknown, unknown, AppCtx>(async ({ ctx, next }) => {
      receivedCtx = ctx;
      return next();
    });

    const action = createApiClient<AppCtx>()
      .use(inject)
      .use(capture)
      .handler(async () => 'ok');

    await action({});
    expect(receivedCtx?.userId).toBe('u1');
  });

  it('next({ ctx }) does not mutate upstream context', async () => {
    const ctxSnapshots: Array<AppCtx> = [];

    const upper = createMiddleware<unknown, unknown, AppCtx>(async ({ ctx, next }) => {
      ctxSnapshots.push({ ...ctx });
      const result = await next({ ctx: { userId: 'injected' } });
      ctxSnapshots.push({ ...ctx });
      return result;
    });

    const action = createApiClient<AppCtx>()
      .use(upper)
      .handler(async () => 'ok');

    await action({});
    expect(ctxSnapshots[0].userId).toBeUndefined();
    expect(ctxSnapshots[1].userId).toBeUndefined();
  });

  it('multiple middlewares can accumulate ctx fields', async () => {
    let finalCtx: AppCtx | undefined;

    const addUser = createMiddleware<unknown, unknown, AppCtx>(({ next }) =>
      next({ ctx: { userId: 'u42' } }),
    );
    const addRole = createMiddleware<unknown, unknown, AppCtx>(({ next }) =>
      next({ ctx: { role: 'admin' } }),
    );
    const capture = createMiddleware<unknown, unknown, AppCtx>(async ({ ctx, next }) => {
      finalCtx = ctx;
      return next();
    });

    const action = createApiClient<AppCtx>()
      .use(addUser)
      .use(addRole)
      .use(capture)
      .handler(async () => 'ok');

    await action({});
    expect(finalCtx?.userId).toBe('u42');
    expect(finalCtx?.role).toBe('admin');
  });
});

// ---------------------------------------------------------------------------
// next({ input }) input forwarding
// ---------------------------------------------------------------------------

describe('next({ input }) input forwarding', () => {
  it('next({ input }) replaces the input seen by downstream', async () => {
    let handlerInput: unknown;

    const transform = createMiddleware<{ raw: string }, string>(({ next }) =>
      next({ input: { raw: 'transformed' } }),
    );

    const action = createApiClient()
      .use(transform as ReturnType<typeof createMiddleware>)
      .handler(async ({ input }) => {
        handlerInput = input;
        return 'ok';
      });

    await action({ raw: 'original' });
    expect((handlerInput as { raw: string }).raw).toBe('transformed');
  });

  it('omitting next({ input }) passes original input through', async () => {
    let handlerInput: unknown;

    const passThrough = createMiddleware(async ({ next }) => next());

    const action = createApiClient()
      .use(passThrough)
      .handler(async ({ input }) => {
        handlerInput = input;
        return 'ok';
      });

    await action({ value: 42 });
    expect((handlerInput as { value: number }).value).toBe(42);
  });

  it('forwards null when next({ input: null }) — does not fall back to the raw input', async () => {
    let handlerInput: unknown = 'sentinel';

    const clear = createMiddleware(({ next }) => next({ input: null }));
    const pipeline = composePipeline(
      [clear],
      async ({ input }) => {
        handlerInput = input;
        return input;
      },
      {},
    );

    const result = await pipeline('original', {});
    expect(handlerInput).toBeNull();
    expect(result).toBeNull();
  });

  it('forwards undefined when next({ input: undefined }) — does not fall back to the raw input', async () => {
    let handlerInput: unknown = 'sentinel';

    const clear = createMiddleware(({ next }) => next({ input: undefined }));
    const pipeline = composePipeline(
      [clear],
      async ({ input }) => {
        handlerInput = input;
        return input;
      },
      {},
    );

    await pipeline('original', {});
    expect(handlerInput).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// composePipeline directly
// ---------------------------------------------------------------------------

describe('composePipeline', () => {
  it('with zero middleware calls the handler directly', async () => {
    const handler = vi.fn(async ({ input }: { input: number }) => input * 2);
    const pipeline = composePipeline([], handler, {});

    const result = await pipeline(5, {});
    expect(result).toBe(10);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('metadata is passed to every middleware unchanged', async () => {
    const meta = { feature: 'billing', action: 'charge' } as const;
    const seen: Array<typeof meta> = [];

    const mw = createMiddleware(async ({ metadata, next }) => {
      seen.push(metadata as typeof meta);
      return next();
    });

    const pipeline = composePipeline([mw], async () => 'ok', meta);
    await pipeline({}, {});
    expect(seen[0]).toEqual(meta);
  });
});
