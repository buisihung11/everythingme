import {
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { EventTheme } from '@/lib/themes';

export interface PickerOption<T extends string> {
  id: T;
  label: string;
  icon: string;
  description?: string;
}

interface OptionPickerSheetProps<T extends string> {
  visible: boolean;
  title: string;
  options: PickerOption<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
  onClose: () => void;
  theme: EventTheme;
}

export function OptionPickerSheet<T extends string>({
  visible,
  title,
  options,
  selectedId,
  onSelect,
  onClose,
  theme,
}: OptionPickerSheetProps<T>) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/45" onPress={onClose} />
      <View
        className="bg-surface-elevated rounded-t-3xl pt-3 px-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <View className="w-9 h-1 rounded-sm bg-white/20 self-center mb-4" />
        <Text
          className="text-lg font-bold mb-2"
          style={{ color: theme.textPrimary }}
        >
          {title}
        </Text>

        <View className="gap-1">
          {options.map((option) => {
            const selected = option.id === selectedId;
            return (
              <Pressable
                key={option.id}
                onPress={() => {
                  onSelect(option.id);
                  onClose();
                }}
                className="flex-row items-center gap-3.5 py-3.5 px-3 rounded-[14px]"
                style={
                  selected
                    ? {
                        backgroundColor:
                          theme.displayMode === 'light'
                            ? 'rgba(0,0,0,0.06)'
                            : 'rgba(255,255,255,0.1)',
                      }
                    : undefined
                }
              >
                <Text className="text-[22px] w-7 text-center">{option.icon}</Text>
                <View className="flex-1 gap-0.5">
                  <Text
                    className="text-base font-semibold"
                    style={{ color: theme.textPrimary }}
                  >
                    {option.label}
                  </Text>
                  {option.description ? (
                    <Text
                      className="text-[13px] leading-[18px]"
                      style={{ color: theme.textSecondary }}
                    >
                      {option.description}
                    </Text>
                  ) : null}
                </View>
                {selected ? (
                  <Text className="text-lg font-bold" style={{ color: theme.accent }}>
                    ✓
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}
