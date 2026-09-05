import { ActivityIndicator, Text, type PressableProps, type ViewStyle } from 'react-native';
import { PressableScale } from './PressableScale';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-accent active:bg-accent/80',
  secondary: 'bg-surface-elevated border border-white/10 active:bg-white/10',
  ghost: 'active:bg-white/8',
};

const textStyles: Record<ButtonVariant, string> = {
  primary: 'text-white font-semibold',
  secondary: 'text-text-primary font-medium',
  ghost: 'text-text-secondary font-medium',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 rounded-xl',
  md: 'px-5 py-3 rounded-2xl',
  lg: 'px-6 py-4 rounded-2xl',
};

const textSizeStyles: Record<ButtonSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <PressableScale
      {...props}
      disabled={isDisabled}
      style={style}
      className={[
        'flex-row items-center justify-center gap-2',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        isDisabled && 'opacity-50',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : '#FF6B35'}
        />
      ) : (
        <Text
          className={`${textStyles[variant]} ${textSizeStyles[size]} tracking-tight`}
        >
          {children}
        </Text>
      )}
    </PressableScale>
  );
}
