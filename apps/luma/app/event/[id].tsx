import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedThemeBackground } from '@/components/create/AnimatedThemeBackground';
import { EventHeroCover } from '@/components/EventCoverArt';
import { GlassCard } from '@/components/create/GlassCard';
import { PressableScale } from '@/components/PressableScale';
import { springs } from '@/lib/motion';
import { resolveEventTheme } from '@/lib/themes';
import { useEvents } from '@/store/events';

function formatDateRange(start: Date, end: Date): string {
  const dateStr = start.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const startTime = start.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const endTime = end.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${dateStr} · ${startTime} – ${endTime}`;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getEvent, toggleRsvp } = useEvents();

  const event = getEvent(id);
  const countScale = useSharedValue(1);

  const countAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countScale.value }],
  }));

  async function handleRsvp() {
    if (!event) return;
    await toggleRsvp(event.id);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    countScale.value = withSequence(
      withSpring(1.18, springs.gentle),
      withSpring(1, springs.gentle),
    );
  }

  async function handleShare() {
    if (!event) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const dateLine = formatDateRange(event.startAt, event.endAt);
    await Share.share({
      title: event.name,
      message: `${event.name}\n${dateLine}\n${event.location}`,
    });
  }

  if (!event) {
    return (
      <View className="flex-1 bg-background items-center justify-center gap-4">
        <Text className="text-[40px]">🔍</Text>
        <Text className="text-text-secondary text-base">Event not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text className="text-accent text-base font-semibold">Go back</Text>
        </Pressable>
      </View>
    );
  }

  const theme = resolveEventTheme(event.cover);
  const capacityFull =
    event.capacity > 0 && event.attendeeCount >= event.capacity && !event.going;
  const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

  const attendeeLabel =
    event.capacity > 0
      ? `${event.attendeeCount} / ${event.capacity} going`
      : `${event.attendeeCount} going`;

  return (
    <View className="flex-1 bg-background">
      <AnimatedThemeBackground theme={theme} />

      <View
        className="absolute top-0 left-0 right-0 z-10 flex-row items-center justify-between px-4"
        style={{ paddingTop: insets.top + 8 }}
        pointerEvents="box-none"
      >
        <GlassCard theme={theme} compact className="w-11 h-11 rounded-full">
          <PressableScale
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <Text
              className="text-[28px] font-light leading-[30px] -mt-0.5"
              style={{ color: theme.textPrimary }}
            >
              ‹
            </Text>
          </PressableScale>
        </GlassCard>

        <GlassCard theme={theme} compact className="w-11 h-11 rounded-full">
          <PressableScale onPress={handleShare} accessibilityLabel="Share event">
            <ShareIcon color={theme.textPrimary} />
          </PressableScale>
        </GlassCard>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
      >
        <EventHeroCover
          cover={event.cover}
          gradient={theme.cover.gradient}
          headline={theme.cover.headline}
          style={{ marginTop: insets.top + 64, aspectRatio: 1.15 }}
        />

        <View className="px-4 gap-4">
          <GlassCard theme={theme} className="self-start">
            <Text
              className="text-[13px] font-semibold"
              style={{ color: theme.textSecondary }}
            >
              {theme.name} theme
            </Text>
          </GlassCard>

          <Text
            className="text-[32px] font-normal tracking-tight leading-[38px] mb-1"
            style={{ color: theme.textPrimary, fontFamily: serifFont }}
          >
            {event.name}
          </Text>

          <GlassCard theme={theme}>
            <MetaRow
              icon="📅"
              value={formatDateRange(event.startAt, event.endAt)}
              theme={theme}
            />
            <View className="h-px bg-white/10 my-3" />
            <MetaRow icon="📍" value={event.location} theme={theme} />
            <View className="h-px bg-white/10 my-3" />
            <MetaRow icon="👤" value={`Hosted by ${event.host}`} theme={theme} />
            <View className="h-px bg-white/10 my-3" />
            <View className="flex-row items-center justify-between gap-3">
              <MetaRow icon="🎫" value={attendeeLabel} theme={theme} />
              <Animated.Text
                className="text-xl font-bold"
                style={[countAnimStyle, { color: theme.accent }]}
              >
                {event.attendeeCount}
              </Animated.Text>
            </View>
          </GlassCard>

          {event.description ? (
            <GlassCard theme={theme}>
              <Text
                className="text-[11px] font-bold tracking-[1.5px] mb-2.5"
                style={{ color: theme.textSecondary }}
              >
                ABOUT
              </Text>
              <Text
                className="text-base leading-6"
                style={{ color: theme.textPrimary }}
              >
                {event.description}
              </Text>
            </GlassCard>
          ) : null}
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 px-4 pt-2"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <GlassCard theme={theme} className="rounded-3xl">
          <PressableScale
            onPress={handleRsvp}
            disabled={capacityFull}
            className={[
              'rounded-2xl py-4 items-center justify-center',
              event.going
                ? 'bg-white/10 border border-white/15'
                : capacityFull
                  ? 'bg-white/[0.08] opacity-50'
                  : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={
              !event.going && !capacityFull
                ? { backgroundColor: theme.accent }
                : undefined
            }
          >
            <Text
              className="text-[17px] font-semibold tracking-tight text-white"
              style={event.going ? { color: theme.textPrimary } : undefined}
            >
              {capacityFull
                ? 'Sold Out'
                : event.going
                  ? '✓ Going — tap to cancel'
                  : 'Register'}
            </Text>
          </PressableScale>
        </GlassCard>
      </View>
    </View>
  );
}

function ShareIcon({ color }: { color: string }) {
  return (
    <View className="w-[18px] h-[18px] items-center justify-center">
      <View
        className="absolute bottom-0 w-3.5 h-3.5 rounded-[3px] border-[1.75px]"
        style={{ borderColor: color }}
      />
      <View
        className="absolute top-px w-[1.75px] h-[9px] rounded-sm"
        style={{ backgroundColor: color }}
      />
      <View
        className="absolute top-0 w-0 h-0 border-l-4 border-r-4 border-t-[5px] border-l-transparent border-r-transparent"
        style={{ borderTopColor: color }}
      />
    </View>
  );
}

function MetaRow({
  icon,
  value,
  theme,
}: {
  icon: string;
  value: string;
  theme: ReturnType<typeof resolveEventTheme>;
}) {
  return (
    <View className="flex-row items-start gap-2.5">
      <Text className="text-base mt-px">{icon}</Text>
      <Text
        className="flex-1 text-[15px] leading-[22px] font-medium"
        style={{ color: theme.textPrimary }}
      >
        {value}
      </Text>
    </View>
  );
}
