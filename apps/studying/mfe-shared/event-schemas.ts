import { z } from 'zod';

/**
 * Single source of truth for the shape of every cross-remote event payload.
 * `MfeEventType` and `EventPayloadMap` are both derived from this record, so
 * adding a new event only means adding one entry here.
 */
export const eventPayloadSchemas = {
  'dashboard:refresh': z.object({
    source: z.string(),
  }),
  'analytics:track': z.object({
    action: z.string(),
  }),
  'user:selected': z.object({
    id: z.string(),
    name: z.string(),
  }),
  'product:viewed': z.object({
    id: z.string(),
    name: z.string(),
  }),
  'auth:changed': z.object({
    action: z.enum(['login', 'logout', 'role-switch']),
    role: z.enum(['admin', 'editor', 'viewer']).optional(),
  }),
  'api:event': z.object({
    kind: z.enum(['span:start', 'span:end', 'log:info', 'log:error']),
    label: z.string(),
    feature: z.string().optional(),
    action: z.string().optional(),
    durationMs: z.number().optional(),
    error: z.string().optional(),
  }),
} as const satisfies Record<string, z.ZodTypeAny>;

export type MfeEventType = keyof typeof eventPayloadSchemas;

export type EventPayloadMap = {
  [K in MfeEventType]: z.infer<(typeof eventPayloadSchemas)[K]>;
};

/** Human-readable summary of a zod error, e.g. "name: Required; id: Expected string, received number". */
export function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join('.') || 'payload'}: ${issue.message}`).join('; ');
}
