import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { EventTheme } from '@/lib/themes';

interface CoverPreviewProps {
  theme: EventTheme;
  imageUri?: string | null;
  picking?: boolean;
  onPickImage?: () => void;
}

export function CoverPreview({
  theme,
  imageUri,
  picking = false,
  onPickImage,
}: CoverPreviewProps) {
  const { cover } = theme;
  const photoUri = imageUri ?? cover.imageUri;
  const hasPhoto = Boolean(photoUri);

  return (
    <View className="mx-4 mb-3 rounded-3xl overflow-hidden relative">
      <View style={{ width: '100%', aspectRatio: 1 }}>
        {hasPhoto && photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <LinearGradient
            colors={cover.gradient}
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
            {cover.headline ? (
              <Text
                className="text-[28px] font-extrabold text-white text-center tracking-wide"
                style={{
                  textShadowColor: 'rgba(0,0,0,0.25)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 8,
                }}
              >
                {cover.headline}
              </Text>
            ) : (
              <Text className="text-[72px]">{cover.emoji}</Text>
            )}
          </LinearGradient>
        )}
      </View>

      {picking ? (
        <View className="absolute inset-0 bg-black/40 items-center justify-center">
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : null}

      <Pressable
        onPress={onPickImage}
        disabled={picking}
        className="absolute bottom-3.5 right-3.5 w-10 h-10 rounded-full bg-black/45 items-center justify-center border border-white/25"
        accessibilityLabel="Choose photo from gallery"
        accessibilityRole="button"
      >
        <Text className="text-lg">📷</Text>
      </Pressable>
    </View>
  );
}
