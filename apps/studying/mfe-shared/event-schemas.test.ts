import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { eventPayloadSchemas, formatZodError } from './event-schemas';

describe('formatZodError', () => {
  it('joins path and message for each issue', () => {
    const error = z
      .object({ id: z.string(), count: z.number() })
      .safeParse({ id: 1, count: 'nope' }).error!;

    expect(formatZodError(error)).toBe(
      'id: Invalid input: expected string, received number; count: Invalid input: expected number, received string',
    );
  });

  it('uses "payload" when the issue has no path', () => {
    const error = z.string().safeParse(123).error!;

    expect(formatZodError(error)).toContain('payload:');
  });
});

describe('eventPayloadSchemas', () => {
  it('accepts api:event payloads used by the pipeline demo', () => {
    const result = eventPayloadSchemas['api:event'].safeParse({
      kind: 'span:end',
      label: 'dashboard/fetch-stats',
      durationMs: 42,
    });

    expect(result.success).toBe(true);
  });

  it('rejects unknown api:event kinds', () => {
    const result = eventPayloadSchemas['api:event'].safeParse({
      kind: 'unknown',
      label: 'bad',
    });

    expect(result.success).toBe(false);
  });
});
