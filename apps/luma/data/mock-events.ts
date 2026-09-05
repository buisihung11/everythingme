import type { Event } from '@/store/events';

export const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    name: 'Design Systems Summit',
    cover: { color: '#1A1A2E', emoji: '🎨', themeId: 'minimal' },
    startAt: new Date('2026-08-15T18:00:00'),
    endAt: new Date('2026-08-15T21:00:00'),
    location: 'San Francisco, CA',
    host: 'Design Collective',
    description:
      'An evening of deep dives into design tokens, component APIs, and the future of cross-platform design systems. Featuring talks from teams at major tech companies.',
    capacity: 120,
    going: false,
    attendeeCount: 87,
  },
  {
    id: '2',
    name: 'AI + Creativity Workshop',
    cover: { color: '#0D1B2A', emoji: '🤖', themeId: 'warp' },
    startAt: new Date('2026-08-20T14:00:00'),
    endAt: new Date('2026-08-20T17:00:00'),
    location: 'New York, NY',
    host: 'Creative AI Lab',
    description:
      'Hands-on workshop exploring generative AI tools for visual artists, musicians, and writers. Bring your laptop and creative curiosity.',
    capacity: 40,
    going: true,
    attendeeCount: 38,
  },
  {
    id: '3',
    name: 'Founder Dinner Series',
    cover: { color: '#1B0033', emoji: '🍽️', themeId: 'sunset' },
    startAt: new Date('2026-08-25T19:30:00'),
    endAt: new Date('2026-08-25T22:30:00'),
    location: 'Austin, TX',
    host: 'Seed Club',
    description:
      'Intimate dinner for early-stage founders. No pitching — just real conversations about building companies, staying sane, and finding the right early team.',
    capacity: 20,
    going: false,
    attendeeCount: 16,
  },
  {
    id: '4',
    name: 'React Native & Expo Deep Dive',
    cover: { color: '#001F3F', emoji: '📱', themeId: 'warp' },
    startAt: new Date('2026-09-03T10:00:00'),
    endAt: new Date('2026-09-03T13:00:00'),
    location: 'Online',
    host: 'Expo Team',
    description:
      'Live session covering Expo SDK 57, New Architecture, NativeWind v4, and building production-grade mobile apps with Expo Router and NativeTabs.',
    capacity: 500,
    going: true,
    attendeeCount: 312,
  },
  {
    id: '5',
    name: 'Liquid Glass UI Showcase',
    cover: { color: '#0A1628', emoji: '✨', themeId: 'quantum' },
    startAt: new Date('2026-09-10T17:00:00'),
    endAt: new Date('2026-09-10T20:00:00'),
    location: 'Cupertino, CA',
    host: 'Apple Developer Relations',
    description:
      'See what iOS 26 Liquid Glass looks like in real apps. Hands-on demo stations with devices running the new OS, plus Q&A with UI engineers.',
    capacity: 200,
    going: false,
    attendeeCount: 145,
  },
];
