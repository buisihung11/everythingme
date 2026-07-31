# Lesson: API Middleware Pipeline

**Study area:** Cross-cutting concerns, action builders, middleware composition  
**Related PR:** `feat/api-mfe-example` (PR 4 of the api-lib stack)

---

## What was built

`@everythingme/api` — a zero-dependency, immutable action builder where
*everything* is middleware: validation, telemetry, logging, retry, timeout,
and error normalisation.

```
telemetry → logging → errorNormalization → validate → retry → timeout → handler
```

The "everything is middleware" design means:

- Adding a new cross-cutting concern never touches handler code
- Testing each layer is trivial (mock next())
- Composition order is explicit and readable at the call site

---

## Key design decisions

### Immutable builder

`ApiActionClient` never mutates. Every `.use()`, `.metadata()`, `.input()`,
`.output()` returns a new instance.

This means you can fork configurations:

```ts
const base = api.metadata({ feature: 'users' }).use(retry({ attempts: 3 }));
const fast = base.use(timeout({ ms: 500 }));
const slow = base.use(timeout({ ms: 5000 }));
```

### `next()` can override input

The plan's `next(options?: { ctx? })` spec was deliberately extended to
`next(options?: { ctx?; input? })`. Without `input` override, `validate()`
can't forward the *parsed* value (Zod coercions, transforms) to the handler —
the handler would receive raw, un-coerced input. This is what keeps
"everything is middleware" honest.

### Standard Schema v1

The lib declares the Standard Schema interface inline (~40 lines). Zod,
Valibot, Yup — anything that implements `~standard.validate` works.
No lock-in, no bundled schema library.

### `timeout` injects `AbortSignal`

Timeout doesn't just race the promise — it sets `controller.abort()` and
passes the signal into `ctx.signal`. Handlers that respect the signal
(e.g., `fetch(url, { signal: ctx.signal })`) actually cancel the request
rather than letting the network transfer continue silently.

---

## Live demo

Visit `/api-pipeline` in the MFE shell. Four scenarios:

| Button | What it exercises |
|---|---|
| Success | Happy path — telemetry + logging fire; ~400 ms mock latency |
| Validation Failure | `validate()` rejects invalid input; retries never run |
| Retry → Succeed | 70% flakiness; `retry(3)` loops until success |
| Timeout | Handler hangs; `timeout(1500ms)` fires `ApiTimeoutError`; `AbortSignal` is aborted |

The Event Bus column shows that `api:event` messages arrive even in the
shell, because the shared API client publishes all telemetry and log events
onto `window.__MFE_EVENT_BUS__`.

---

## What I'd do differently

- **Backpressure** — retry's `delayMs` accumulates on the event loop;
  a jitter option would prevent thundering herds in production.
- **Span nesting** — the current telemetry port only creates root spans.
  For deep call chains, a context carrier (e.g., passing the parent span
  through `ctx`) would be needed.
- **Output validation in a pipeline** — `validateOutput` runs *after* the
  handler. If middleware above the handler transforms the output (unusual but
  possible), the result it sees is already transformed. Document this order
  clearly in the README.
