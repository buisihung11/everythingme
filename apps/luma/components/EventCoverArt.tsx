import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import type { EventCover } from '@/store/events';

interface EventCoverArtProps {
  cover: EventCover;
  className?: string;
  emojiClassName?: string;
}

export function EventCoverArt({
  cover,
  className = 'h-36',
  emojiClassName = 'text-[48px]',
}: EventCoverArtProps) {
  if (cover.imageUri) {
    return (
      <Image
        source={{ uri: cover.imageUri }}
        className={className}
        contentFit="cover"
        transition={200}
      />
    );
  }

  return (
    <View
      className={`${className} items-center justify-center`}
      style={{ backgroundColor: cover.color }}
    >
      <Text className={emojiClassName}>{cover.emoji}</Text>
    </View>
  );
}

interface EventHeroCoverProps {
  cover: EventCover;
  gradient: [string, string, string, string];
  headline?: string;
  style?: { marginTop?: number; aspectRatio?: number };
}

export function EventHeroCover({
  cover,
  gradient,
  headline,
  style,
}: EventHeroCoverProps) {
  const aspectRatio = style?.aspectRatio ?? 1.15;

  return (
    <View
      className="mx-4 rounded-3xl overflow-hidden relative mb-4"
      style={{ marginTop: style?.marginTop }}
    >
      <View style={{ width: '100%', aspectRatio }}>
        {cover.imageUri ? (
          <Image
            source={{ uri: cover.imageUri }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            {headline ? (
              <Text
                className="text-[26px] font-extrabold text-white text-center tracking-wide"
                style={{
                  textShadowColor: 'rgba(0,0,0,0.3)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 8,
                }}
              >
                {headline}
              </Text>
            ) : (
              <Text className="text-[80px]">{cover.emoji}</Text>
            )}
          </LinearGradient>
        )}
      </View>
    </View>
  );
}
