import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { GlassCard } from '@/components/create/GlassCard';
import type { EventTheme } from '@/lib/themes';

type PickerTarget = 'startDate' | 'startTime' | 'endDate' | 'endTime' | null;

interface ScheduleCardProps {
  theme: EventTheme;
  startAt: Date | null;
  endAt: Date | null;
  onStartChange: (date: Date) => void;
  onEndChange: (date: Date) => void;
  startError?: string;
  endError?: string;
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function mergeDatePart(base: Date, from: Date) {
  const next = new Date(base);
  next.setFullYear(from.getFullYear(), from.getMonth(), from.getDate());
  return next;
}

function mergeTimePart(base: Date, from: Date) {
  const next = new Date(base);
  next.setHours(from.getHours(), from.getMinutes(), 0, 0);
  return next;
}

function ScheduleRow({
  label,
  value,
  filled,
  isEnd,
  theme,
  onPressDate,
  onPressTime,
}: {
  label: string;
  value: Date | null;
  filled: boolean;
  isEnd?: boolean;
  theme: EventTheme;
  onPressDate: () => void;
  onPressTime: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between gap-2">
      <View className="flex-row items-center gap-2.5 w-[72px]">
        <View
          className="w-3.5 h-3.5 rounded-full border-2"
          style={{
            borderColor: theme.textSecondary,
            backgroundColor: filled && !isEnd ? theme.accent : 'transparent',
          }}
        />
        <Text className="text-[15px] font-medium" style={{ color: theme.textSecondary }}>
          {label}
        </Text>
      </View>
      <View className="flex-row gap-2 flex-1 justify-end">
        <Pressable
          onPress={onPressDate}
          className="px-3 py-2 rounded-[10px] bg-white/10"
        >
          <Text className="text-sm font-medium" style={{ color: theme.textPrimary }}>
            {value ? formatDate(value) : 'Date'}
          </Text>
        </Pressable>
        <Pressable
          onPress={onPressTime}
          className="px-3 py-2 rounded-[10px] bg-white/10"
        >
          <Text className="text-sm font-medium" style={{ color: theme.textPrimary }}>
            {value ? formatTime(value) : 'Time'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ScheduleCard({
  theme,
  startAt,
  endAt,
  onStartChange,
  onEndChange,
  startError,
  endError,
}: ScheduleCardProps) {
  const [picker, setPicker] = useState<PickerTarget>(null);

  function handlePickerChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setPicker(null);
    if (event.type === 'dismissed' || !selected) {
      setPicker(null);
      return;
    }

    if (picker === 'startDate') {
      onStartChange(mergeDatePart(startAt ?? new Date(), selected));
    } else if (picker === 'startTime') {
      onStartChange(mergeTimePart(startAt ?? new Date(), selected));
    } else if (picker === 'endDate') {
      onEndChange(mergeDatePart(endAt ?? startAt ?? new Date(), selected));
    } else if (picker === 'endTime') {
      onEndChange(mergeTimePart(endAt ?? startAt ?? new Date(), selected));
    }
  }

  const pickerMode =
    picker === 'startDate' || picker === 'endDate' ? 'date' : 'time';

  const pickerValue =
    picker === 'startDate' || picker === 'startTime'
      ? (startAt ?? new Date())
      : (endAt ?? startAt ?? new Date());

  const tz =
    Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, ' ');

  return (
    <GlassCard theme={theme} className="mx-4">
      <View className="flex-row gap-3">
        <View
          className="w-0.5 ml-[7px] my-[18px] opacity-35 rounded-sm"
          style={{ backgroundColor: theme.textSecondary }}
        />
        <View className="flex-1 gap-5">
          <ScheduleRow
            label="Start"
            value={startAt}
            filled={!!startAt}
            theme={theme}
            onPressDate={() => setPicker('startDate')}
            onPressTime={() => setPicker('startTime')}
          />
          <ScheduleRow
            label="End"
            value={endAt}
            filled={!!endAt}
            isEnd
            theme={theme}
            onPressDate={() => setPicker('endDate')}
            onPressTime={() => setPicker('endTime')}
          />
        </View>
      </View>

      <View className="flex-row items-center gap-1.5 mt-4 pt-3 border-t border-white/15">
        <Text className="text-[13px]" style={{ color: theme.textSecondary }}>
          🌐
        </Text>
        <Text className="text-[13px]" style={{ color: theme.textSecondary }}>
          {tz}
        </Text>
      </View>

      {(startError || endError) && (
        <Text className="text-red-400 text-xs mt-2">{startError ?? endError}</Text>
      )}

      {picker && (
        <>
          <DateTimePicker
            value={pickerValue}
            mode={pickerMode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handlePickerChange}
            themeVariant={theme.displayMode}
          />
          {Platform.OS === 'ios' && (
            <Pressable onPress={() => setPicker(null)} className="self-end pt-2">
              <Text className="font-semibold" style={{ color: theme.accent }}>
                Done
              </Text>
            </Pressable>
          )}
        </>
      )}
    </GlassCard>
  );
}
