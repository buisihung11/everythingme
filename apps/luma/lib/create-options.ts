import type { PickerOption } from '@/components/create/OptionPickerSheet';

export type CalendarId = 'personal' | 'work' | 'social';
export type VisibilityId = 'public' | 'private' | 'members';

export const CALENDAR_OPTIONS: PickerOption<CalendarId>[] = [
  {
    id: 'personal',
    icon: '👤',
    label: 'Personal Calendar',
    description: 'Only visible on your personal calendar',
  },
  {
    id: 'work',
    icon: '💼',
    label: 'Work',
    description: 'Sync to your work calendar',
  },
  {
    id: 'social',
    icon: '🎉',
    label: 'Social',
    description: 'For parties and hangouts',
  },
];

export const VISIBILITY_OPTIONS: PickerOption<VisibilityId>[] = [
  {
    id: 'public',
    icon: '🌐',
    label: 'Public',
    description: 'Anyone with the link can see this event',
  },
  {
    id: 'private',
    icon: '🔒',
    label: 'Private',
    description: 'Only people you invite can see it',
  },
  {
    id: 'members',
    icon: '👥',
    label: 'Members Only',
    description: 'Visible to your community members',
  },
];

export function getCalendarOption(id: CalendarId) {
  return CALENDAR_OPTIONS.find((o) => o.id === id) ?? CALENDAR_OPTIONS[0];
}

export function getVisibilityOption(id: VisibilityId) {
  return VISIBILITY_OPTIONS.find((o) => o.id === id) ?? VISIBILITY_OPTIONS[0];
}
