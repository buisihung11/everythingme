import type { StandardSchemaV1 } from './standard-schema';
import type {
  ApiMetadata,
  ApiMiddleware,
  ApiHandler,
  ApiExecutionContext,
} from './types';
import { composePipeline } from './pipeline';
import { validate, validateOutput } from './middleware/validation';

export interface ApiActionConfig<
  TContext extends ApiExecutionContext,
  TInput,
  TOutput,
> {
  metadata: ApiMetadata;
  middleware: ReadonlyArray<ApiMiddleware<TInput, TOutput, TContext>>;
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
   * Sugar for `.use(validate(schema))`. Narrows TInput to the schema's output type.
   */
  input<TNewInput>(
    schema: StandardSchemaV1<unknown, TNewInput>,
  ): ApiActionClient<TContext, TNewInput, TOutput> {
    const base = this as unknown as ApiActionClient<TContext, TNewInput, TOutput>;
    return base.use(validate<TNewInput, TOutput, TContext>(schema));
  }

  /**
   * Sugar for `.use(validateOutput(schema))`. Narrows TOutput to the schema's output type.
   */
  output<TNewOutput>(
    schema: StandardSchemaV1<unknown, TNewOutput>,
  ): ApiActionClient<TContext, TInput, TNewOutput> {
    const base = this as unknown as ApiActionClient<TContext, TInput, TNewOutput>;
    return base.use(validateOutput<TInput, TNewOutput, TContext>(schema));
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
