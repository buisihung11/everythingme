import { z } from 'zod';

export const eventCoverSchema = z.object({
  color: z.string(),
  emoji: z.string(),
  themeId: z.string().optional(),
  imageUri: z.string().optional(),
});

export const eventSchema = z.object({
  id: z.string(),
  name: z.string(),
  cover: eventCoverSchema,
  startAt: z.string(),
  endAt: z.string(),
  location: z.string(),
  host: z.string(),
  description: z.string(),
  capacity: z.number(),
  going: z.boolean(),
  attendeeCount: z.number(),
});

export const eventListSchema = z.array(eventSchema);

export const createEventInputSchema = z.object({
  name: z.string().min(1),
  cover: eventCoverSchema,
  startAt: z.string(),
  endAt: z.string(),
  location: z.string().min(1),
  host: z.string().min(1),
  description: z.string(),
  capacity: z.number().int().nonnegative(),
});

export const getEventInputSchema = z.object({
  id: z.string().min(1),
});

export const toggleRsvpInputSchema = z.object({
  id: z.string().min(1),
});

export type EventDto = z.infer<typeof eventSchema>;
export type CreateEventInputDto = z.infer<typeof createEventInputSchema>;
