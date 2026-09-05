import { Pressable, type PressableProps, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { PRESS_SCALE, springs, useReducedMotion } from '@/lib/motion';

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Drop-in Pressable replacement that scales to 0.97 on press
 * via a reanimated spring for tactile press feedback.
 */
export function PressableScale({
  children,
  style,
  className,
  onPressIn,
  onPressOut,
  ...props
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn(e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) {
    if (!reduceMotion) {
      scale.value = withSpring(PRESS_SCALE, springs.press);
    }
    onPressIn?.(e);
  }

  function handlePressOut(e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) {
    if (!reduceMotion) {
      scale.value = withSpring(1, springs.press);
    }
    onPressOut?.(e);
  }

  return (
    <AnimatedPressable
      {...props}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, ...(Array.isArray(style) ? style : style ? [style] : [])]}
      className={className}
    >
      {children}
    </AnimatedPressable>
  );
}
