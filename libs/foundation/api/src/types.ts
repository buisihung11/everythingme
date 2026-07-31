export interface ApiMetadata {
  feature?: string;
  action?: string;
  [key: string]: unknown;
}

export interface ApiExecutionContext {
  signal?: AbortSignal;
  [key: string]: unknown;
}

export interface ApiMiddlewareRequest<
  TInput,
  TOutput,
  TContext extends ApiExecutionContext = ApiExecutionContext,
> {
  input: TInput;
  ctx: TContext;
  metadata: Readonly<ApiMetadata>;
  next(options?: {
    ctx?: Partial<TContext>;
    input?: TInput;
  }): Promise<TOutput>;
}

export type ApiMiddleware<
  TInput = unknown,
  TOutput = unknown,
  TContext extends ApiExecutionContext = ApiExecutionContext,
> = (request: ApiMiddlewareRequest<TInput, TOutput, TContext>) => Promise<TOutput>;

export type ApiHandler<
  TInput = unknown,
  TOutput = unknown,
  TContext extends ApiExecutionContext = ApiExecutionContext,
> = (request: { input: TInput; ctx: TContext }) => Promise<TOutput>;
