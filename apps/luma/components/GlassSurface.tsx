import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { Platform, View, type ViewStyle } from 'react-native';
import { isReduceTransparencyEnabled } from '@/lib/glass';

interface GlassSurfaceProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  intensity?: number;
}

/**
 * Adaptive glass surface:
 * - iOS / Android (Expo Go): BlurView
 * - Web / reduced transparency: solid surface
 */
export function GlassSurface({
  children,
  className = '',
  style,
  intensity = 60,
}: GlassSurfaceProps) {
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    isReduceTransparencyEnabled().then(setReduceTransparency);
  }, []);

  const baseClassName = ['overflow-hidden', className].filter(Boolean).join(' ');

  if (Platform.OS === 'web' || reduceTransparency) {
    return (
      <View className={`${baseClassName} bg-[rgba(20,20,21,0.92)]`} style={style}>
        {children}
      </View>
    );
  }

  return (
    <BlurView
      intensity={intensity}
      tint="dark"
      className={baseClassName}
      style={style}
    >
      {children}
    </BlurView>
  );
}
