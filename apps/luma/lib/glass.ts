import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Async check — resolves true when "reduce transparency" accessibility setting is on.
 * When true, GlassSurface should render as a solid surface.
 */
export async function isReduceTransparencyEnabled(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  return AccessibilityInfo.isReduceTransparencyEnabled();
}
