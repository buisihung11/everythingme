import { BlurView } from 'expo-blur';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { EventTheme } from '@/lib/themes';

interface AnimatedThemeBackgroundProps {
  theme: EventTheme;
}

function Blob({
  color,
  size,
  top,
  left,
  animatedStyle,
}: {
  color: string;
  size: number;
  top: number;
  left: number;
  animatedStyle: object;
}) {
  return (
    <Animated.View
      className="absolute opacity-75"
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top,
          left,
        },
        animatedStyle,
      ]}
    />
  );
}

export function AnimatedThemeBackground({ theme }: AnimatedThemeBackgroundProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [theme.id, progress]);

  const blob1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-50, 40]) },
      { translateY: interpolate(progress.value, [0, 1], [0, 90]) },
      { scale: interpolate(progress.value, [0, 1], [1, 1.25]) },
    ],
  }));

  const blob2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [30, -60]) },
      { translateY: interpolate(progress.value, [0, 1], [40, -30]) },
      { scale: interpolate(progress.value, [0, 1], [1.1, 0.95]) },
    ],
  }));

  const blob3Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-20, 50]) },
      { translateY: interpolate(progress.value, [0, 1], [80, 20]) },
      { scale: interpolate(progress.value, [0, 1], [0.9, 1.15]) },
    ],
  }));

  const [c1, c2, c3] = theme.palette;

  return (
    <View className="absolute inset-0" pointerEvents="none">
      <View className="absolute inset-0" style={{ backgroundColor: c1 }} />
      <Blob color={c2} size={320} top={-40} left={-60} animatedStyle={blob1Style} />
      <Blob color={c3} size={280} top={120} left={80} animatedStyle={blob2Style} />
      <Blob color={c2} size={240} top={400} left={-30} animatedStyle={blob3Style} />

      {Platform.OS === 'web' ? (
        <View
          className="absolute inset-0 bg-white/[0.08]"
          style={{ backdropFilter: 'blur(40px)' } as object}
        />
      ) : (
        <BlurView intensity={90} tint={theme.glassTint} className="absolute inset-0" />
      )}

      <View
        className="absolute inset-0"
        style={{
          backgroundColor:
            theme.displayMode === 'light'
              ? 'rgba(255,255,255,0.15)'
              : 'rgba(0,0,0,0.25)',
        }}
      />
    </View>
  );
}
