import * as ImagePicker from 'expo-image-picker';
import { buildThemeFromColor } from '@/lib/build-theme-from-color';
import { extractDominantColor } from '@/lib/extract-image-color';
import type { EventTheme } from '@/lib/themes';

export async function pickCoverImage(): Promise<{
  imageUri: string;
  theme: EventTheme;
} | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const imageUri = result.assets[0].uri;
  const dominantColor = await extractDominantColor(imageUri);
  const theme = buildThemeFromColor(dominantColor, imageUri);

  return { imageUri, theme };
}
