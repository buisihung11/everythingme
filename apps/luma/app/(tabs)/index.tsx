import { useRef } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EventCard } from '@/components/EventCard';
import {
  ENTRANCE_TRANSLATE_Y,
  STAGGER_DELAY,
  STAGGER_MAX_ITEMS,
  useReducedMotion,
} from '@/lib/motion';
import { useEvents, type Event } from '@/store/events';

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-8 py-24 gap-4">
      <Text style={{ fontSize: 48 }}>📅</Text>
      <Text className="text-text-primary text-xl font-semibold text-center tracking-tight">
        No events yet
      </Text>
      <Text className="text-text-secondary text-base text-center leading-relaxed">
        Create your first event using the Create tab below.
      </Text>
    </View>
  );
}

interface AnimatedCardProps {
  event: Event;
  index: number;
  reduceMotion: boolean;
}

function AnimatedCard({ event, index, reduceMotion }: AnimatedCardProps) {
  const delay = reduceMotion
    ? 0
    : Math.min(index, STAGGER_MAX_ITEMS) * STAGGER_DELAY;

  return (
    <Animated.View
      entering={
        reduceMotion
          ? FadeInDown.duration(150)
          : FadeInDown.delay(delay)
              .duration(280)
              .springify()
              .dampingRatio(0.9)
              .withInitialValues({
                transform: [{ translateY: ENTRANCE_TRANSLATE_Y }],
                opacity: 0,
              })
      }
    >
      <EventCard event={event} />
    </Animated.View>
  );
}

export default function FeedScreen() {
  const { events, loading, error, refresh } = useEvents();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const listRef = useRef<FlatList<Event>>(null);

  if (loading && events.length === 0) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#FF6B35" />
      </View>
    );
  }

  if (error && events.length === 0) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8 gap-4">
        <Text className="text-text-primary text-lg font-semibold text-center">
          Couldn't load events
        </Text>
        <Text className="text-text-secondary text-base text-center">{error}</Text>
        <Pressable onPress={() => void refresh()}>
          <Text className="text-accent text-base font-medium">Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        ref={listRef}
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AnimatedCard event={item} index={index} reduceMotion={!!reduceMotion} />
        )}
        ListHeaderComponent={
          <View
            className="px-4 pb-4 pt-2"
            style={{ paddingTop: insets.top + 16 }}
          >
            <Text className="text-text-primary text-3xl font-bold tracking-tight">
              Events
            </Text>
          </View>
        }
        ListEmptyComponent={<EmptyState />}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
