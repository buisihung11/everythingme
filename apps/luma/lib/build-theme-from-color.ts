import { darken, getLuminance, lighten } from '@/lib/color-utils';
import type { EventTheme } from '@/lib/themes';

export function buildThemeFromColor(
  dominantColor: string,
  imageUri: string,
): EventTheme {
  const isLight = getLuminance(dominantColor) > 0.45;

  const palette: [string, string, string] = [
    darken(dominantColor, 0.35),
    dominantColor,
    lighten(dominantColor, 0.18),
  ];

  const gradient: [string, string, string, string] = [
    darken(dominantColor, 0.28),
    dominantColor,
    lighten(dominantColor, 0.12),
    darken(dominantColor, 0.4),
  ];

  return {
    id: 'custom',
    name: 'Photo',
    displayMode: isLight ? 'light' : 'dark',
    palette,
    cover: {
      color: dominantColor,
      emoji: '',
      gradient,
      imageUri,
    },
    accent: isLight ? darken(dominantColor, 0.45) : lighten(dominantColor, 0.35),
    glassTint: isLight ? 'light' : 'dark',
    textPrimary: isLight ? '#1A1A1A' : '#FFFFFF',
    textSecondary: isLight ? 'rgba(26,26,26,0.55)' : 'rgba(255,255,255,0.6)',
  };
}
