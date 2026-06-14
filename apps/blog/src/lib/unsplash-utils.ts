import type { UnsplashPhoto } from 'react-unsplash'

export function getPhotoAlt(photo: UnsplashPhoto): string {
  return photo.alt_description ?? photo.description ?? 'Photo from Unsplash'
}

/** Card + article hero — same field used in post frontmatter. */
export function buildThumbnailFrontmatter(photo: UnsplashPhoto): string {
  return `thumbnail: ${photo.urls.regular}`
}

export function buildMdxImageSnippet(photo: UnsplashPhoto): string {
  const alt = getPhotoAlt(photo)
  return `<Image\n  src="${photo.urls.regular}"\n  alt="${alt}"\n/>`
}

/** @deprecated Use buildMdxImageSnippet */
export function buildMdxSnippet(photo: UnsplashPhoto): string {
  return buildMdxImageSnippet(photo)
}

export function buildPostSnippets(photo: UnsplashPhoto): string {
  return `${buildThumbnailFrontmatter(photo)}\n\n${buildMdxImageSnippet(photo)}`
}

export function formatPhotoDimensions(photo: UnsplashPhoto): string {
  return `${photo.width.toLocaleString()} × ${photo.height.toLocaleString()}`
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export const MOOD_SEARCHES = [
  { label: 'Travel', query: 'travel landscape', emoji: '✈️' },
  { label: 'Coffee', query: 'coffee shop cozy', emoji: '☕' },
  { label: 'Mountains', query: 'mountain sunrise', emoji: '🏔️' },
  { label: 'Minimal', query: 'minimal architecture', emoji: '◻️' },
  { label: 'Ocean', query: 'ocean waves aerial', emoji: '🌊' },
  { label: 'City night', query: 'city night lights', emoji: '🌃' },
  { label: 'Forest', query: 'forest mist path', emoji: '🌲' },
  { label: 'Workspace', query: 'desk workspace aesthetic', emoji: '💻' },
] as const
