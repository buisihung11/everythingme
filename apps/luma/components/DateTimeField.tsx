import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

interface DateTimeFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  error?: string;
  hint?: string;
  minimumDate?: Date;
}

function formatDateTime(date: Date): string {
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function DateTimeField({
  label,
  value,
  onChange,
  error,
  hint,
  minimumDate,
}: DateTimeFieldProps) {
  const [showPicker, setShowPicker] = useState(false);

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }
    if (selected) {
      onChange(selected);
    }
  }

  const borderClass = error ? 'border-red-500/60' : 'border-white/8';

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-text-secondary tracking-wide">
        {label}
      </Text>

      <Pressable
        onPress={() => setShowPicker(true)}
        className={[
          'bg-surface-elevated rounded-xl px-4 py-3 border',
          borderClass,
        ].join(' ')}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Opens date and time picker"
      >
        <Text
          className={
            value
              ? 'text-base text-text-primary'
              : 'text-base text-text-tertiary'
          }
        >
          {value ? formatDateTime(value) : 'Select date & time'}
        </Text>
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={value ?? new Date()}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={minimumDate}
          onChange={handleChange}
          themeVariant="dark"
        />
      )}

      {Platform.OS === 'ios' && showPicker && (
        <Pressable
          onPress={() => setShowPicker(false)}
          className="self-end py-1"
        >
          <Text className="text-accent text-base font-semibold">Done</Text>
        </Pressable>
      )}

      {error ? (
        <Text className="text-xs text-red-400">{error}</Text>
      ) : hint ? (
        <Text className="text-xs text-text-tertiary">{hint}</Text>
      ) : null}
    </View>
  );
}
