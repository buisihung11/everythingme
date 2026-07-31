import { createMiddleware } from '../create-middleware.js';
import { ApiValidationError } from '../errors.js';
import type { StandardSchemaV1 } from '../standard-schema.js';
import type { ApiExecutionContext } from '../types.js';

/**
 * Validates the incoming input against a Standard Schema.
 * Forwards the *parsed* value (with coercions and transforms applied)
 * to the next step via next({ input }).
 * Throws ApiValidationError on failure.
 */
export function validate<TInput, TOutput, TContext extends ApiExecutionContext>(
  schema: StandardSchemaV1<unknown, TInput>,
) {
  return createMiddleware<TInput, TOutput, TContext>(
    async ({ input, ctx: _ctx, metadata, next }) => {
      const result = await schema['~standard'].validate(input);
      if (result.issues) {
        throw new ApiValidationError(
          `Validation failed: ${result.issues.map((i) => i.message).join(', ')}`,
          result.issues,
          metadata.feature as string | undefined,
          metadata.action as string | undefined,
        );
      }
      return next({ input: result.value });
    },
  );
}

/**
 * Validates the *output* of the downstream pipeline.
 * Useful for asserting API contracts at runtime.
 */
export function validateOutput<TInput, TOutput, TContext extends ApiExecutionContext>(
  schema: StandardSchemaV1<unknown, TOutput>,
) {
  return createMiddleware<TInput, TOutput, TContext>(
    async ({ next, metadata }) => {
      const output = await next();
      const result = await schema['~standard'].validate(output);
      if (result.issues) {
        throw new ApiValidationError(
          `Output validation failed: ${result.issues.map((i) => i.message).join(', ')}`,
          result.issues,
          metadata.feature as string | undefined,
          metadata.action as string | undefined,
        );
      }
      return result.value;
    },
  );
}
