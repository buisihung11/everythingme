import {
  createApiClient,
  errorNormalization,
  logging,
  timeout,
} from '@everythingme/api';
import { MOCK_EVENTS } from '@/data/mock-events';
import type { EventDto } from './schemas';
import { createMockTransport } from './transport';

function toDto(event: (typeof MOCK_EVENTS)[number]): EventDto {
  return {
    id: event.id,
    name: event.name,
    cover: event.cover,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt.toISOString(),
    location: event.location,
    host: event.host,
    description: event.description,
    capacity: event.capacity,
    going: event.going,
    attendeeCount: event.attendeeCount,
  };
}

export const transport = createMockTransport(MOCK_EVENTS.map(toDto));

export const api = createApiClient()
  .use(logging())
  .use(errorNormalization())
  .use(timeout({ ms: 5000 }));
