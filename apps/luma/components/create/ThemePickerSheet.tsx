import { LinearGradient } from 'expo-linear-gradient';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '@/components/create/GlassCard';
import { EVENT_THEMES, type EventTheme } from '@/lib/themes';

interface ThemePickerSheetProps {
  visible: boolean;
  selectedId: string;
  onSelect: (theme: EventTheme) => void;
  onClose: () => void;
}

function ThemePreviewCard({
  theme,
  selected,
  onPress,
}: {
  theme: EventTheme;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={[
        'w-[100px] items-center gap-2 p-1 rounded-2xl border-2',
        selected ? 'border-[#2D1B4E]' : 'border-transparent',
      ].join(' ')}
    >
      <LinearGradient
        colors={theme.cover.gradient}
        className="w-[88px] h-[110px] rounded-xl items-center justify-center"
      >
        <Text className="text-[32px]">{theme.cover.emoji}</Text>
      </LinearGradient>
      <Text className="text-[13px] font-semibold text-[#2D1B4E]">{theme.name}</Text>
    </Pressable>
  );
}

export function ThemePickerSheet({
  visible,
  selectedId,
  onSelect,
  onClose,
}: ThemePickerSheetProps) {
  const insets = useSafeAreaInsets();
  const active = EVENT_THEMES.find((t) => t.id === selectedId) ?? EVENT_THEMES[0];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View
        className="bg-[#F5F0FA] rounded-t-3xl pt-3 px-4 max-h-[70%]"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <View className="w-9 h-1 rounded-sm bg-black/15 self-center mb-4" />

        <Text className="text-lg font-bold text-[#2D1B4E] mb-4">Theme</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <View className="flex-row gap-3 pb-5">
            {EVENT_THEMES.map((theme) => (
              <ThemePreviewCard
                key={theme.id}
                theme={theme}
                selected={theme.id === selectedId}
                onPress={() => onSelect(theme)}
              />
            ))}
          </View>
        </ScrollView>

        <View className="flex-row gap-2.5 mb-4">
          <GlassCard theme={active} className="flex-1">
            <Text className="text-xs mb-1.5" style={{ color: active.textSecondary }}>
              Color
            </Text>
            <View className="flex-row items-center gap-2">
              <LinearGradient
                colors={active.palette}
                className="w-[22px] h-[22px] rounded-full"
              />
              <Text className="text-[15px] font-semibold" style={{ color: active.textPrimary }}>
                {active.name}
              </Text>
            </View>
          </GlassCard>

          <GlassCard theme={active} className="flex-1">
            <Text className="text-xs mb-1.5" style={{ color: active.textSecondary }}>
              Display
            </Text>
            <Text className="text-[15px] font-semibold" style={{ color: active.textPrimary }}>
              {active.displayMode === 'light' ? '☀️ Light' : '🌙 Dark'}
            </Text>
          </GlassCard>
        </View>

        <Pressable
          onPress={onClose}
          className="bg-[#2D1B4E] rounded-[14px] py-3.5 items-center"
        >
          <Text className="text-white text-base font-semibold">Apply theme</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
