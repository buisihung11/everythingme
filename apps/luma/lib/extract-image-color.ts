import { decode } from 'jpeg-js';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { rgbToHex } from '@/lib/color-utils';

const SAMPLE_SIZE = 32;

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function dominantColorFromPixels(data: Uint8Array | Uint8ClampedArray): string {
  let r = 0;
  let g = 0;
  let b = 0;
  let weightSum = 0;

  for (let i = 0; i < data.length; i += 4) {
    const pr = data[i]!;
    const pg = data[i + 1]!;
    const pb = data[i + 2]!;
    const pa = data[i + 3]!;

    if (pa < 128) continue;

    const max = Math.max(pr, pg, pb);
    const min = Math.min(pr, pg, pb);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const weight = 0.25 + saturation * 0.75;

    r += pr * weight;
    g += pg * weight;
    b += pb * weight;
    weightSum += weight;
  }

  if (weightSum === 0) return '#808080';

  return rgbToHex(
    Math.round(r / weightSum),
    Math.round(g / weightSum),
    Math.round(b / weightSum),
  );
}

async function extractDominantColorWeb(imageUri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = SAMPLE_SIZE;
      canvas.height = SAMPLE_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
      const imageData = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
      resolve(dominantColorFromPixels(imageData.data));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUri;
  });
}

async function extractDominantColorNative(imageUri: string): Promise<string> {
  const manipulated = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: SAMPLE_SIZE, height: SAMPLE_SIZE } }],
    {
      compress: 0.85,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );

  if (!manipulated.base64) {
    throw new Error('Failed to read image data');
  }

  const decoded = decode(base64ToUint8Array(manipulated.base64), {
    useTArray: true,
  });

  return dominantColorFromPixels(decoded.data);
}

export async function extractDominantColor(imageUri: string): Promise<string> {
  if (Platform.OS === 'web') {
    return extractDominantColorWeb(imageUri);
  }
  return extractDominantColorNative(imageUri);
}
