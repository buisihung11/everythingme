import { z } from 'zod';
import { api } from './client';
import { transport } from './client';
import {
  createEventInputSchema,
  eventListSchema,
  eventSchema,
  getEventInputSchema,
  toggleRsvpInputSchema,
} from './schemas';

export const listEvents = api
  .metadata({ feature: 'events', action: 'list' })
  .input(z.object({}))
  .output(eventListSchema)
  .handler(async ({ ctx }) => transport.get('/events', { signal: ctx.signal }));

export const getEvent = api
  .metadata({ feature: 'events', action: 'get' })
  .input(getEventInputSchema)
  .output(eventSchema)
  .handler(async ({ input, ctx }) =>
    transport.get(`/events/${input.id}`, { signal: ctx.signal }),
  );

export const createEvent = api
  .metadata({ feature: 'events', action: 'create' })
  .input(createEventInputSchema)
  .output(eventSchema)
  .handler(async ({ input, ctx }) =>
    transport.post('/events', input, { signal: ctx.signal }),
  );

export const toggleRsvp = api
  .metadata({ feature: 'events', action: 'toggle-rsvp' })
  .input(toggleRsvpInputSchema)
  .output(eventSchema)
  .handler(async ({ input, ctx }) =>
    transport.patch(`/events/${input.id}/rsvp`, undefined, { signal: ctx.signal }),
  );

// Re-export for consumers that need the DTO type
export type { EventDto } from './schemas';
