import { describe, it, expect, vi, afterEach } from 'vitest';
import { z } from 'zod';
import { formatZodError } from './event-schemas';

describe('formatZodError', () => {
  it('joins multiple issues with semicolons', () => {
    const schema = z.object({
      id: z.string(),
      name: z.string(),
    });

    const result = schema.safeParse({ id: 1, name: 42 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(formatted).toContain('id:');
      expect(formatted).toContain('name:');
      expect(formatted).toContain(';');
    }
  });

  it('uses "payload" when the issue has no path', () => {
    const schema = z.string();
    const result = schema.safeParse(123);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatZodError(result.error)).toMatch(/^payload:/);
    }
  });
});
