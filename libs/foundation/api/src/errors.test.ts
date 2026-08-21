import { describe, expect, it } from 'vitest';
import {
  ApiError,
  ApiTimeoutError,
  ApiValidationError,
  normalizeError,
} from './errors.js';

describe('normalizeError', () => {
  it('returns ApiError subclasses unchanged', () => {
    const validation = new ApiValidationError('bad input', [{ message: 'required' }]);
    const timeout = new ApiTimeoutError(500, 'billing', 'charge');

    expect(normalizeError(validation)).toBe(validation);
    expect(normalizeError(timeout)).toBe(timeout);
  });

  it('wraps plain Error instances with feature/action metadata', () => {
    const cause = new Error('network down');
    const normalized = normalizeError(cause, 'users', 'fetch');

    expect(normalized).toBeInstanceOf(ApiError);
    expect(normalized.message).toBe('network down');
    expect(normalized.feature).toBe('users');
    expect(normalized.action).toBe('fetch');
    expect(normalized.originalCause).toBe(cause);
  });

  it('wraps non-Error throws in ApiError', () => {
    const normalized = normalizeError({ code: 'E_FAIL' }, 'reports', 'export');

    expect(normalized).toBeInstanceOf(ApiError);
    expect(normalized.message).toBe('[object Object]');
    expect(normalized.feature).toBe('reports');
    expect(normalized.action).toBe('export');
    expect(normalized.originalCause).toEqual({ code: 'E_FAIL' });
  });
});

describe('ApiError constructors', () => {
  it('preserves Error cause when wrapping another Error', () => {
    const cause = new Error('upstream');
    const error = new ApiError('wrapped', 'x', 'y', cause);

    expect(error.cause).toBe(cause);
  });

  it('stores validation issues on ApiValidationError', () => {
    const issues = [{ message: 'too short', path: ['name'] }];
    const error = new ApiValidationError('invalid', issues, 'users', 'create');

    expect(error.issues).toEqual(issues);
    expect(error.name).toBe('ApiValidationError');
  });

  it('formats timeout messages with the configured deadline', () => {
    const error = new ApiTimeoutError(1500, 'pipeline', 'run');

    expect(error.message).toBe('Action timed out after 1500ms');
    expect(error.name).toBe('ApiTimeoutError');
    expect(error.feature).toBe('pipeline');
    expect(error.action).toBe('run');
  });
});
