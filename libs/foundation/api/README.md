# @everythingme/api

An immutable action builder with a composable middleware pipeline.
Every concern (validation, telemetry, logging, retry, timeout, error
normalization) is just middleware — the handler only sees clean,
already-validated input and a predictable context.

## Quick start

```ts
import {
  createApiClient,
  retry,
  timeout,
  logging,
  telemetry,
  errorNormalization,
} from '@everythingme/api';
import { z } from 'zod';

const api = createApiClient()
  .use(telemetry({ tracer }))
  .use(logging())
  .use(errorNormalization());

export const fetchUser = api
  .metadata({ feature: 'users', action: 'get' })
  .input(z.object({ id: z.string() }))
  .use(retry({ attempts: 3 }))
  .use(timeout({ ms: 5000 }))
  .handler(async ({ input, ctx }) =>
    fetch(`/api/users/${input.id}`, { signal: ctx.signal }).then((r) => r.json()),
  );

// Invocation:
const user = await fetchUser({ id: '42' });
```

## Contracts

### `ApiExecutionContext`

```ts
interface ApiExecutionContext {
  signal?: AbortSignal;
  [key: string]: unknown;
}
```

Add custom fields by passing a type parameter to `createApiClient<MyContext>()`.

### `ApiMiddlewareRequest`

```ts
interface ApiMiddlewareRequest<TInput, TOutput, TContext> {
  input: TInput;
  ctx: TContext;
  metadata: Readonly<ApiMetadata>;
  next(options?: { ctx?: Partial<TContext>; input?: TInput }): Promise<TOutput>;
}
```

The `next` signature accepts optional overrides. The `input` override is
how `validate()` forwards the parsed value (with Zod coercions and
transforms applied) to every layer below it.

### Builder methods

| Method | Effect |
|---|---|
| `.metadata(meta)` | Merge metadata into the action config |
| `.use(middleware)` | Append middleware to the pipeline |
| `.input(schema)` | Sugar for `.use(validate(schema))` — narrows TInput |
| `.output(schema)` | Sugar for `.use(validateOutput(schema))` — narrows TOutput |
| `.handler(fn)` | Finalise the builder; returns a callable `ApiAction` |

## Built-in middleware

### `validate(schema)` / `validateOutput(schema)`

Standard Schema v1 compatible (Zod, Valibot, Yup, etc.). Throws
`ApiValidationError` on failure; forwards the *parsed* value through
`next({ input })` so transforms and coercions take effect.

### `telemetry({ tracer })`

Wraps each call in a span using a pluggable `ApiTracer` port — no OpenTelemetry
dependency. Span is always ended in `finally`.

```ts
const tracer: ApiTracer = {
  startSpan(name) {
    const span = otelTracer.startSpan(name);
    return {
      setStatus: (s, msg) => span.setStatus({ code: s === 'ok' ? 1 : 2, message: msg }),
      recordException: (e) => span.recordException(e as Error),
      end: () => span.end(),
    };
  },
};
```

### `logging({ logger? })`

Logs start, success (with duration), and error via a pluggable `ApiLogger`
port (default: `console`).

### `retry({ attempts?, delayMs?, backoff?, retryOn? })`

Retries the downstream pipeline on failure. Defaults:
`attempts = 3`, `delayMs = 100`, `backoff = 2` (exponential).
`retryOn` predicate defaults to retrying everything *except*
`ApiValidationError`.

### `timeout({ ms })`

Races the downstream pipeline against a timer. On timeout throws
`ApiTimeoutError` and the `AbortSignal` injected into `ctx.signal`
is aborted — handlers that accept `signal` can cancel their fetch
instead of being silently abandoned.

### `errorNormalization()`

Catches any thrown value and wraps it in an `ApiError` tagged with
`feature`/`action`. `ApiError` subclasses pass through unchanged.

## Composition order

Recommended composition (outermost → innermost → handler):

```
telemetry → logging → errorNormalization → validate → retry → timeout → handler
```

- `telemetry` and `logging` wrap everything so spans/logs cover the full
  duration including retries.
- `errorNormalization` converts any raw throws into `ApiError` before they
  propagate to callers.
- `validate` runs before retry so invalid input is rejected immediately
  (no wasted retry attempts).
- `timeout` is innermost so it covers only the handler's execution time,
  not retries.

## Writing custom middleware

```ts
import { createMiddleware } from '@everythingme/api';

export const addRequestId = createMiddleware(async ({ ctx, next }) =>
  next({ ctx: { ...ctx, requestId: crypto.randomUUID() } }),
);
```

Use `createMiddleware<TInput, TOutput, TContext>(fn)` for full type inference.
