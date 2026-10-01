import { describe, it, expect } from 'vitest';
import {
  ApiError,
  ApiValidationError,
  normalizeError,
} from './errors.js';

describe('normalizeError', () => {
  it('returns ApiError instances unchanged', () => {
    const original = new ApiError('already normalized', 'billing', 'charge');
    expect(normalizeError(original)).toBe(original);
  });

  it('returns ApiValidationError subclasses unchanged', () => {
    const original = new ApiValidationError('bad input', [{ message: 'required' }]);
    expect(normalizeError(original)).toBe(original);
    expect(normalizeError(original)).toBeInstanceOf(ApiValidationError);
  });

  it('wraps plain Error with feature and action metadata', () => {
    const cause = new Error('network down');
    const normalized = normalizeError(cause, 'dashboard', 'fetch-stats');

    expect(normalized).toBeInstanceOf(ApiError);
    expect(normalized.message).toBe('network down');
    expect(normalized.feature).toBe('dashboard');
    expect(normalized.action).toBe('fetch-stats');
    expect(normalized.originalCause).toBe(cause);
  });

  it('wraps non-Error throws as ApiError', () => {
    const normalized = normalizeError('something broke', 'x', 'y');

    expect(normalized).toBeInstanceOf(ApiError);
    expect(normalized.message).toBe('something broke');
    expect(normalized.feature).toBe('x');
    expect(normalized.action).toBe('y');
    expect(normalized.originalCause).toBe('something broke');
  });
});

describe('ApiError', () => {
  it('sets Error cause when wrapping another Error', () => {
    const cause = new Error('root');
    const err = new ApiError('wrapped', undefined, undefined, cause);
    expect(err.cause).toBe(cause);
  });
});

describe('ApiTimeoutError', () => {
  it('includes the timeout duration in the message', async () => {
    const { ApiTimeoutError } = await import('./errors.js');
    const err = new ApiTimeoutError(1500, 'demo', 'slow');
    expect(err.message).toBe('Action timed out after 1500ms');
    expect(err.name).toBe('ApiTimeoutError');
    expect(err.feature).toBe('demo');
    expect(err.action).toBe('slow');
  });
});
