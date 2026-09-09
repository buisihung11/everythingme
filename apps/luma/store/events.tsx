import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createEvent as createEventAction,
  listEvents,
  toggleRsvp as toggleRsvpAction,
} from '@/api/events';
import type { EventDto } from '@/api/schemas';

// ── Types ──────────────────────────────────────────────────────────────────

export interface EventCover {
  color: string;
  emoji: string;
  themeId?: string;
  imageUri?: string;
}

export interface Event {
  id: string;
  name: string;
  cover: EventCover;
  startAt: Date;
  endAt: Date;
  location: string;
  host: string;
  description: string;
  capacity: number;
  going: boolean;
  attendeeCount: number;
}

export type NewEventInput = Omit<Event, 'id' | 'going' | 'attendeeCount'>;

function fromDto(dto: EventDto): Event {
  return {
    ...dto,
    startAt: new Date(dto.startAt),
    endAt: new Date(dto.endAt),
  };
}

function toDtoInput(input: NewEventInput) {
  return {
    name: input.name,
    cover: input.cover,
    startAt: input.startAt.toISOString(),
    endAt: input.endAt.toISOString(),
    location: input.location,
    host: input.host,
    description: input.description,
    capacity: input.capacity,
  };
}

// ── Context ────────────────────────────────────────────────────────────────

interface EventsContextValue {
  events: Event[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getEvent: (id: string) => Event | undefined;
  addEvent: (input: NewEventInput) => Promise<void>;
  toggleRsvp: (id: string) => Promise<void>;
}

const EventsContext = createContext<EventsContextValue | null>(null);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listEvents({});
      setEvents(data.map(fromDto));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const getEvent = useCallback(
    (id: string) => events.find((e) => e.id === id),
    [events],
  );

  const addEvent = useCallback(async (input: NewEventInput) => {
    const created = await createEventAction(toDtoInput(input));
    setEvents((current) => [fromDto(created), ...current]);
  }, []);

  const toggleRsvp = useCallback(async (id: string) => {
    const updated = await toggleRsvpAction({ id });
    setEvents((current) =>
      current.map((event) => (event.id === id ? fromDto(updated) : event)),
    );
  }, []);

  const value = useMemo(
    () => ({
      events,
      loading,
      error,
      refresh,
      getEvent,
      addEvent,
      toggleRsvp,
    }),
    [events, loading, error, refresh, getEvent, addEvent, toggleRsvp],
  );

  return (
    <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
  );
}

export function useEvents(): EventsContextValue {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error('useEvents must be used within EventsProvider');
  return ctx;
}
