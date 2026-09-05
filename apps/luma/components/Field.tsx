import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface FieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
}

export function Field({ label, error, hint, ...props }: FieldProps) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-text-secondary tracking-wide">
        {label}
      </Text>
      <TextInput
        {...props}
        placeholderTextColor="rgba(255,255,255,0.25)"
        className={[
          'bg-surface-elevated rounded-xl px-4 py-3',
          'text-base text-text-primary',
          'border',
          error ? 'border-red-500/60' : 'border-white/8',
        ].join(' ')}
      />
      {error ? (
        <Text className="text-xs text-red-400">{error}</Text>
      ) : hint ? (
        <Text className="text-xs text-text-tertiary">{hint}</Text>
      ) : null}
    </View>
  );
}
