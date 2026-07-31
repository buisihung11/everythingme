import type { StandardSchemaV1 } from './standard-schema.js';
import type {
  ApiMetadata,
  ApiMiddleware,
  ApiHandler,
  ApiExecutionContext,
} from './types.js';
import { composePipeline } from './pipeline.js';

export interface ApiActionConfig<
  TContext extends ApiExecutionContext,
  TInput,
  TOutput,
> {
  metadata: ApiMetadata;
  middleware: ReadonlyArray<ApiMiddleware<TInput, TOutput, TContext>>;
  /** Stored for PR3 validation middleware wiring via input(). */
  inputSchema?: StandardSchemaV1<unknown, TInput>;
  /** Stored for PR3 validation middleware wiring via output(). */
  outputSchema?: StandardSchemaV1<unknown, TOutput>;
}

/** A built, callable action. Carries readonly metadata for introspection. */
export interface ApiAction<TInput, TOutput> {
  (input: TInput): Promise<TOutput>;
  readonly metadata: Readonly<ApiMetadata>;
}

/**
 * Immutable action builder. Every method returns a new instance.
 *
 * Typical usage:
 * ```ts
 * const myAction = api
 *   .metadata({ feature: 'users', action: 'get' })
 *   .input(schema)
 *   .use(retry({ attempts: 3 }))
 *   .handler(async ({ input }) => fetchUser(input.id));
 * ```
 */
export class ApiActionClient<
  TContext extends ApiExecutionContext = ApiExecutionContext,
  TInput = unknown,
  TOutput = unknown,
> {
  /** @internal */
  readonly _config: ApiActionConfig<TContext, TInput, TOutput>;

  constructor(config: ApiActionConfig<TContext, TInput, TOutput>) {
    this._config = config;
  }

  metadata(meta: Partial<ApiMetadata>): ApiActionClient<TContext, TInput, TOutput> {
    return new ApiActionClient<TContext, TInput, TOutput>({
      ...this._config,
      metadata: { ...this._config.metadata, ...meta },
    });
  }

  /**
   * Append middleware. Preserves TInput/TOutput types.
   * Use `.input(schema)` to narrow TInput via validation.
   */
  use(
    mw: ApiMiddleware<TInput, TOutput, TContext>,
  ): ApiActionClient<TContext, TInput, TOutput> {
    return new ApiActionClient<TContext, TInput, TOutput>({
      ...this._config,
      middleware: [...this._config.middleware, mw],
    });
  }

  /**
   * Declares the input schema and narrows TInput.
   * In PR3 this becomes sugar for `use(validate(schema))`;
   * for now it stores the schema in config for downstream wiring.
   */
  input<TNewInput>(
    schema: StandardSchemaV1<unknown, TNewInput>,
  ): ApiActionClient<TContext, TNewInput, TOutput> {
    return new ApiActionClient<TContext, TNewInput, TOutput>({
      ...(this._config as unknown as ApiActionConfig<TContext, TNewInput, TOutput>),
      inputSchema: schema,
    });
  }

  /**
   * Declares the output schema and narrows TOutput.
   * In PR3 this becomes sugar for `use(validateOutput(schema))`.
   */
  output<TNewOutput>(
    schema: StandardSchemaV1<unknown, TNewOutput>,
  ): ApiActionClient<TContext, TInput, TNewOutput> {
    return new ApiActionClient<TContext, TInput, TNewOutput>({
      ...(this._config as unknown as ApiActionConfig<TContext, TInput, TNewOutput>),
      outputSchema: schema,
    });
  }

  /**
   * Finalise the builder. Composes the middleware pipeline once and
   * returns a callable ApiAction.
   */
  handler(
    fn: ApiHandler<TInput, TOutput, TContext>,
  ): ApiAction<TInput, TOutput> {
    const pipeline = composePipeline(
      this._config.middleware,
      fn,
      this._config.metadata,
    );
    const frozenMeta = Object.freeze({ ...this._config.metadata });

    const action = (input: TInput) => pipeline(input, {} as TContext);
    Object.defineProperty(action, 'metadata', {
      value: frozenMeta,
      writable: false,
      enumerable: true,
      configurable: false,
    });
    return action as ApiAction<TInput, TOutput>;
  }
}

/**
 * Create a fresh ApiActionClient with an optional context type parameter.
 *
 * ```ts
 * const api = createApiClient<AppContext>();
 * ```
 */
export function createApiClient<
  TContext extends ApiExecutionContext = ApiExecutionContext,
>(): ApiActionClient<TContext, unknown, unknown> {
  return new ApiActionClient<TContext, unknown, unknown>({
    metadata: {},
    middleware: [],
  });
}
