import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image } from 'expo-image';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedThemeBackground } from '@/components/create/AnimatedThemeBackground';
import { CoverPreview } from '@/components/create/CoverPreview';
import { GlassCard } from '@/components/create/GlassCard';
import { ScheduleCard } from '@/components/create/ScheduleCard';
import { OptionPickerSheet } from '@/components/create/OptionPickerSheet';
import { ThemePickerSheet } from '@/components/create/ThemePickerSheet';
import { Button } from '@/components/Button';
import {
  CALENDAR_OPTIONS,
  getCalendarOption,
  getVisibilityOption,
  VISIBILITY_OPTIONS,
  type CalendarId,
  type VisibilityId,
} from '@/lib/create-options';
import {
  DEFAULT_THEME,
  randomTheme,
  type EventTheme,
} from '@/lib/themes';
import { pickCoverImage } from '@/lib/pick-cover-image';
import { useEvents, type NewEventInput } from '@/store/events';

interface FormErrors {
  name?: string;
  startAt?: string;
  endAt?: string;
  location?: string;
}

export default function CreateScreen() {
  const router = useRouter();
  const { addEvent } = useEvents();
  const insets = useSafeAreaInsets();

  const [theme, setTheme] = useState<EventTheme>(DEFAULT_THEME);
  const [themeSheetOpen, setThemeSheetOpen] = useState(false);
  const [calendarId, setCalendarId] = useState<CalendarId>('personal');
  const [visibilityId, setVisibilityId] = useState<VisibilityId>('public');
  const [calendarSheetOpen, setCalendarSheetOpen] = useState(false);
  const [visibilitySheetOpen, setVisibilitySheetOpen] = useState(false);
  const [name, setName] = useState('');
  const [startAt, setStartAt] = useState<Date | null>(null);
  const [endAt, setEndAt] = useState<Date | null>(null);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [showLocation, setShowLocation] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [coverImageUri, setCoverImageUri] = useState<string | null>(null);
  const [pickingCover, setPickingCover] = useState(false);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!name.trim()) next.name = 'Event name is required';
    if (!startAt) next.startAt = 'Start date/time is required';
    if (startAt && endAt && endAt <= startAt) {
      next.endAt = 'End must be after start';
    }
    if (!location.trim()) next.location = 'Location is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      const input: NewEventInput = {
        name: name.trim(),
        cover: {
          color: theme.cover.color,
          emoji: theme.cover.emoji,
          themeId: coverImageUri ? 'custom' : theme.id,
          imageUri: coverImageUri ?? undefined,
        },
        startAt: startAt!,
        endAt: endAt ?? startAt!,
        location: location.trim(),
        host: 'You',
        description: description.trim() || 'No description provided.',
        capacity: 0,
      };
      await addEvent(input);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }

  function handleShuffleTheme() {
    setCoverImageUri(null);
    setTheme(randomTheme(theme.id));
  }

  async function handlePickImage() {
    setPickingCover(true);
    try {
      const picked = await pickCoverImage();
      if (!picked) return;
      setCoverImageUri(picked.imageUri);
      setTheme(picked.theme);
    } finally {
      setPickingCover(false);
    }
  }

  const calendar = getCalendarOption(calendarId);
  const visibility = getVisibilityOption(visibilityId);
  const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

  return (
    <View className="flex-1 bg-background">
      <AnimatedThemeBackground theme={theme} />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            className="items-center pb-3"
            style={{ paddingTop: insets.top + 8 }}
          >
            <Text
              className="text-[17px] font-semibold tracking-tight"
              style={{ color: theme.textPrimary }}
            >
              Create Event
            </Text>
          </View>

          <CoverPreview
            theme={theme}
            imageUri={coverImageUri}
            picking={pickingCover}
            onPickImage={handlePickImage}
          />

          <View className="flex-row px-4 gap-2.5 mb-3">
            <Pressable
              onPress={() => setThemeSheetOpen(true)}
              className="flex-1"
            >
              <GlassCard theme={theme}>
                <View className="flex-row items-center gap-3">
                  <View
                    className="w-11 h-11 rounded-[10px] items-center justify-center overflow-hidden"
                    style={
                      coverImageUri
                        ? undefined
                        : { backgroundColor: theme.cover.gradient[0] }
                    }
                  >
                    {coverImageUri ? (
                      <Image
                        source={{ uri: coverImageUri }}
                        style={{ width: 44, height: 44 }}
                        contentFit="cover"
                      />
                    ) : (
                      <Text>{theme.cover.emoji}</Text>
                    )}
                  </View>
                  <View>
                    <Text className="text-xs" style={{ color: theme.textSecondary }}>
                      Theme
                    </Text>
                    <Text
                      className="text-base font-semibold"
                      style={{ color: theme.textPrimary }}
                    >
                      {theme.name}
                    </Text>
                  </View>
                  <Text
                    className="ml-auto text-base font-bold"
                    style={{ color: theme.textSecondary }}
                  >
                    ››
                  </Text>
                </View>
              </GlassCard>
            </Pressable>

            <Pressable onPress={handleShuffleTheme} accessibilityLabel="Shuffle theme">
              <GlassCard
                theme={theme}
                className="w-[52px] h-[52px] items-center justify-center"
              >
                <Text className="text-xl">🔀</Text>
              </GlassCard>
            </Pressable>
          </View>

          <View className="flex-row px-4 gap-2.5 mb-5">
            <Pressable
              onPress={() => setCalendarSheetOpen(true)}
              className="flex-1"
            >
              <GlassCard theme={theme}>
                <Text
                  className="text-[13px] font-medium"
                  style={{ color: theme.textPrimary }}
                >
                  {calendar.icon} {calendar.label}
                </Text>
              </GlassCard>
            </Pressable>
            <Pressable
              onPress={() => setVisibilitySheetOpen(true)}
              className="flex-1"
            >
              <GlassCard theme={theme}>
                <Text
                  className="text-[13px] font-medium"
                  style={{ color: theme.textPrimary }}
                >
                  {visibility.icon} {visibility.label}
                </Text>
              </GlassCard>
            </Pressable>
          </View>

          <View className="px-5 mb-5">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Event Name"
              placeholderTextColor={theme.textSecondary}
              className="text-[36px] font-normal tracking-tight py-1"
              style={{ color: theme.textPrimary, fontFamily: serifFont }}
              autoCapitalize="words"
            />
            {errors.name && (
              <Text className="text-red-400 text-xs mt-1.5">{errors.name}</Text>
            )}
          </View>

          <View className="mb-3">
            <ScheduleCard
              theme={theme}
              startAt={startAt}
              endAt={endAt}
              onStartChange={setStartAt}
              onEndChange={setEndAt}
              startError={errors.startAt}
              endError={errors.endAt}
            />
          </View>

          <Pressable
            onPress={() => setShowLocation(true)}
            className="mb-3 mx-4"
          >
            <GlassCard theme={theme}>
              {!showLocation && !location ? (
                <View className="flex-row items-center gap-3.5">
                  <Text className="text-[22px]">📍</Text>
                  <View>
                    <Text
                      className="text-base font-semibold"
                      style={{ color: theme.textPrimary }}
                    >
                      Add Event Location
                    </Text>
                    <Text
                      className="text-[13px] mt-0.5"
                      style={{ color: theme.textSecondary }}
                    >
                      Offline location or virtual link
                    </Text>
                  </View>
                </View>
              ) : (
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="San Francisco, CA or https://..."
                  placeholderTextColor={theme.textSecondary}
                  className="text-base p-0"
                  style={{ color: theme.textPrimary }}
                  autoFocus={showLocation && !location}
                  onBlur={() => !location && setShowLocation(false)}
                />
              )}
              {errors.location && (
                <Text className="text-red-400 text-xs mt-1.5">{errors.location}</Text>
              )}
            </GlassCard>
          </Pressable>

          <Pressable
            onPress={() => setShowDescription(true)}
            className="mb-3 mx-4"
          >
            <GlassCard theme={theme}>
              {!showDescription && !description ? (
                <View className="flex-row items-center gap-3.5">
                  <Text className="text-[22px]">📄</Text>
                  <Text
                    className="text-base font-semibold"
                    style={{ color: theme.textPrimary }}
                  >
                    Add Description
                  </Text>
                </View>
              ) : (
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Tell people what to expect..."
                  placeholderTextColor={theme.textSecondary}
                  className="text-base p-0 min-h-[80px]"
                  style={{ color: theme.textPrimary }}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  autoFocus={showDescription && !description}
                />
              )}
            </GlassCard>
          </Pressable>

          <View className="px-4 mt-2">
            <Button onPress={handleSubmit} fullWidth size="lg" loading={loading}>
              Create Event
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ThemePickerSheet
        visible={themeSheetOpen}
        selectedId={theme.id}
        onSelect={(t) => {
          setCoverImageUri(null);
          setTheme(t);
          setThemeSheetOpen(false);
        }}
        onClose={() => setThemeSheetOpen(false)}
      />

      <OptionPickerSheet
        visible={calendarSheetOpen}
        title="Calendar"
        options={CALENDAR_OPTIONS}
        selectedId={calendarId}
        onSelect={setCalendarId}
        onClose={() => setCalendarSheetOpen(false)}
        theme={theme}
      />

      <OptionPickerSheet
        visible={visibilitySheetOpen}
        title="Visibility"
        options={VISIBILITY_OPTIONS}
        selectedId={visibilityId}
        onSelect={setVisibilityId}
        onClose={() => setVisibilitySheetOpen(false)}
        theme={theme}
      />
    </View>
  );
}
