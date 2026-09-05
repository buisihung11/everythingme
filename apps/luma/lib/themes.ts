import { buildThemeFromColor } from '@/lib/build-theme-from-color';

export type ThemeDisplayMode = 'light' | 'dark';

export interface EventTheme {
  id: string;
  name: string;
  displayMode: ThemeDisplayMode;
  /** Animated gradient blob colors */
  palette: [string, string, string];
  cover: {
    color: string;
    emoji: string;
    /** Multi-stop gradient for cover art */
    gradient: [string, string, string, string];
    headline?: string;
    imageUri?: string;
  };
  accent: string;
  glassTint: 'light' | 'dark';
  textPrimary: string;
  textSecondary: string;
}

export const EVENT_THEMES: EventTheme[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    displayMode: 'dark',
    palette: ['#1a1520', '#2d2438', '#3a3048'],
    cover: {
      color: '#2A2435',
      emoji: '✦',
      gradient: ['#2A2435', '#3D3548', '#2A2435', '#1E1A26'],
      headline: 'YOUR EVENT',
    },
    accent: '#FFFFFF',
    glassTint: 'dark',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.55)',
  },
  {
    id: 'quantum',
    name: 'Quantum',
    displayMode: 'light',
    palette: ['#E8B4F8', '#C4A1FF', '#9B8CFF'],
    cover: {
      color: '#D4A5F5',
      emoji: '🎉',
      gradient: ['#FFE566', '#FF6B6B', '#C44DFF', '#4ECDC4'],
      headline: 'JOIN ME AT THE PARTY',
    },
    accent: '#5B21B6',
    glassTint: 'light',
    textPrimary: '#2D1B4E',
    textSecondary: 'rgba(45,27,78,0.55)',
  },
  {
    id: 'warp',
    name: 'Warp',
    displayMode: 'dark',
    palette: ['#0F2847', '#1B4D6E', '#2E86AB'],
    cover: {
      color: '#0F2847',
      emoji: '🌊',
      gradient: ['#0F2847', '#1B6CA8', '#48CAE4', '#023E8A'],
      headline: 'DIVE IN',
    },
    accent: '#48CAE4',
    glassTint: 'dark',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.6)',
  },
  {
    id: 'emoji',
    name: 'Emoji',
    displayMode: 'light',
    palette: ['#FFD93D', '#FF9A3C', '#FF6B6B'],
    cover: {
      color: '#FFD93D',
      emoji: '🎈',
      gradient: ['#FFD93D', '#FF9A3C', '#FF6B6B', '#C9F364'],
      headline: 'LET\'S CELEBRATE',
    },
    accent: '#E85D04',
    glassTint: 'light',
    textPrimary: '#3D2000',
    textSecondary: 'rgba(61,32,0,0.55)',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    displayMode: 'dark',
    palette: ['#2D132C', '#801336', '#C72C41'],
    cover: {
      color: '#801336',
      emoji: '🌅',
      gradient: ['#2D132C', '#C72C41', '#EE4540', '#801336'],
      headline: 'GOLDEN HOUR',
    },
    accent: '#EE4540',
    glassTint: 'dark',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.6)',
  },
];

export const DEFAULT_THEME = EVENT_THEMES[1]; // Quantum — matches mockup

export function getThemeById(id: string): EventTheme {
  return EVENT_THEMES.find((t) => t.id === id) ?? DEFAULT_THEME;
}

export function randomTheme(excludeId?: string): EventTheme {
  const pool = excludeId
    ? EVENT_THEMES.filter((t) => t.id !== excludeId)
    : EVENT_THEMES;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export function resolveEventTheme(cover: {
  color: string;
  emoji: string;
  themeId?: string;
  imageUri?: string;
}): EventTheme {
  if (cover.imageUri) {
    return buildThemeFromColor(cover.color, cover.imageUri);
  }
  if (cover.themeId && cover.themeId !== 'custom') {
    return getThemeById(cover.themeId);
  }
  const exact = EVENT_THEMES.find(
    (t) => t.cover.color === cover.color && t.cover.emoji === cover.emoji,
  );
  if (exact) return exact;
  const byColor = EVENT_THEMES.find((t) => t.cover.color === cover.color);
  return byColor ?? DEFAULT_THEME;
}
