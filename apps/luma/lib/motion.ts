import { useReducedMotion } from 'react-native-reanimated';

// Spring presets
export const springs = {
  /** Press feedback: fast, critically damped */
  press: { damping: 20, stiffness: 300 } as const,
  /** State transitions: slightly softer */
  gentle: { damping: 18, stiffness: 220 } as const,
  /** Entrance animations */
  entrance: { damping: 24, stiffness: 260 } as const,
} satisfies Record<string, { damping: number; stiffness: number }>;

// Duration tokens (ms)
export const durations = {
  fast: 150,
  base: 220,
  slow: 300,
} as const;

// Stagger delay between list items (ms)
export const STAGGER_DELAY = 40;
export const STAGGER_MAX_ITEMS = 8;

// Press scale target
export const PRESS_SCALE = 0.97 as const;

// Entrance offsets
export const ENTRANCE_TRANSLATE_Y = 8 as const;

export { useReducedMotion };
