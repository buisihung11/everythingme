import { BlurView } from 'expo-blur';
import { Platform, View, type ViewStyle } from 'react-native';
import type { EventTheme } from '@/lib/themes';

interface GlassCardProps {
  children: React.ReactNode;
  theme: EventTheme;
  style?: ViewStyle;
  className?: string;
  compact?: boolean;
}

export function GlassCard({
  children,
  theme,
  style,
  className = '',
  compact = false,
}: GlassCardProps) {
  const borderColor =
    theme.displayMode === 'light'
      ? 'rgba(255,255,255,0.45)'
      : 'rgba(255,255,255,0.12)';

  const fallbackBg =
    theme.displayMode === 'light'
      ? 'rgba(255,255,255,0.35)'
      : 'rgba(28,28,30,0.55)';

  const cardClassName = [
    'rounded-[20px] border overflow-hidden',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const contentClassName = compact
    ? 'flex-1 items-center justify-center'
    : 'p-4';

  if (Platform.OS === 'web') {
    return (
      <View
        className={cardClassName}
        style={[{ borderColor, backgroundColor: fallbackBg }, style]}
      >
        <View className={contentClassName}>{children}</View>
      </View>
    );
  }

  return (
    <View className={cardClassName} style={[{ borderColor }, style]}>
      <BlurView
        intensity={theme.displayMode === 'light' ? 40 : 55}
        tint={theme.glassTint}
        className="absolute inset-0"
        style={{ backgroundColor: fallbackBg }}
      />
      <View className={contentClassName}>{children}</View>
    </View>
  );
}
