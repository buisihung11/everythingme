import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import type { Event } from '@/store/events';
import { EventCoverArt } from './EventCoverArt';
import { PressableScale } from './PressableScale';

interface EventCardProps {
  event: Event;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function EventCard({ event }: EventCardProps) {
  const router = useRouter();

  return (
    <PressableScale
      onPress={() => router.push(`/event/${event.id}`)}
      className="mx-4 mb-3 rounded-2xl overflow-hidden border border-white/8"
    >
      {/* Cover */}
      <View className="relative">
        <EventCoverArt cover={event.cover} />
        {event.going && (
          <View className="absolute top-3 right-3 bg-accent/90 px-2.5 py-1 rounded-full">
            <Text className="text-white text-xs font-semibold">Going</Text>
          </View>
        )}
      </View>

      {/* Body */}
      <View className="bg-surface p-4 gap-2">
        <Text
          className="text-text-primary text-lg font-semibold tracking-tight"
          numberOfLines={2}
        >
          {event.name}
        </Text>

        {/* Date / time row */}
        <View className="flex-row items-center gap-1.5">
          <Text className="text-text-secondary text-sm">
            {formatDate(event.startAt)} · {formatTime(event.startAt)}
          </Text>
        </View>

        {/* Location row */}
        <Text className="text-text-tertiary text-sm" numberOfLines={1}>
          {event.location}
        </Text>

        {/* Footer */}
        <View className="flex-row items-center justify-between mt-1 pt-3 border-t border-white/5">
          <Text className="text-text-tertiary text-xs">
            Hosted by{' '}
            <Text className="text-text-secondary font-medium">{event.host}</Text>
          </Text>
          <Text className="text-text-tertiary text-xs">
            {event.attendeeCount}
            {event.capacity ? `/${event.capacity}` : ''} going
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}
