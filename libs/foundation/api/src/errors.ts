export class ApiError extends Error {
  readonly feature: string | undefined;
  readonly action: string | undefined;
  readonly originalCause: unknown;

  constructor(
    message: string,
    feature?: string,
    action?: string,
    cause?: unknown,
  ) {
    super(message, cause instanceof Error ? { cause } : undefined);
    this.name = 'ApiError';
    this.feature = feature;
    this.action = action;
    this.originalCause = cause;
  }
}

export class ApiValidationError extends ApiError {
  readonly issues: ReadonlyArray<{
    message: string;
    path?: ReadonlyArray<PropertyKey | { key: PropertyKey }>;
  }>;

  constructor(
    message: string,
    issues: ReadonlyArray<{
      message: string;
      path?: ReadonlyArray<PropertyKey | { key: PropertyKey }>;
    }>,
    feature?: string,
    action?: string,
  ) {
    super(message, feature, action);
    this.name = 'ApiValidationError';
    this.issues = issues;
  }
}

export class ApiTimeoutError extends ApiError {
  constructor(ms: number, feature?: string, action?: string) {
    super(`Action timed out after ${ms}ms`, feature, action);
    this.name = 'ApiTimeoutError';
  }
}

export function normalizeError(
  error: unknown,
  feature?: string,
  action?: string,
): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof Error) {
    return new ApiError(error.message, feature, action, error);
  }
  return new ApiError(String(error), feature, action, error);
}
