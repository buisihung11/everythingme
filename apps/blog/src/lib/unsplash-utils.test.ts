import { describe, expect, it, vi } from 'vitest'
import {
  buildMdxImageSnippet,
  buildPostSnippets,
  buildThumbnailFrontmatter,
  copyText,
  formatPhotoDimensions,
  getPhotoAlt,
} from '#/lib/unsplash-utils'
import { createUnsplashPhoto } from '#/test/fixtures/unsplash-photo'

describe('getPhotoAlt', () => {
  it('prefers alt_description over description', () => {
    const photo = createUnsplashPhoto({
      alt_description: 'Alt text',
      description: 'Description text',
    })

    expect(getPhotoAlt(photo)).toBe('Alt text')
  })

  it('falls back to description when alt_description is missing', () => {
    const photo = createUnsplashPhoto({
      alt_description: null,
      description: 'Description only',
    })

    expect(getPhotoAlt(photo)).toBe('Description only')
  })

  it('uses a generic label when both descriptions are missing', () => {
    const photo = createUnsplashPhoto({
      alt_description: null,
      description: null,
    })

    expect(getPhotoAlt(photo)).toBe('Photo from Unsplash')
  })
})

describe('buildThumbnailFrontmatter', () => {
  it('emits the regular URL as post thumbnail frontmatter', () => {
    const photo = createUnsplashPhoto()

    expect(buildThumbnailFrontmatter(photo)).toBe(
      'thumbnail: https://images.unsplash.com/photo-1/regular',
    )
  })
})

describe('buildMdxImageSnippet', () => {
  it('builds an Image MDX block with src and alt', () => {
    const photo = createUnsplashPhoto()

    expect(buildMdxImageSnippet(photo)).toBe(
      '<Image\n  src="https://images.unsplash.com/photo-1/regular"\n  alt="Mountain sunrise over a misty valley"\n/>',
    )
  })
})

describe('buildPostSnippets', () => {
  it('combines thumbnail frontmatter and image snippet', () => {
    const photo = createUnsplashPhoto()

    expect(buildPostSnippets(photo)).toBe(
      `${buildThumbnailFrontmatter(photo)}\n\n${buildMdxImageSnippet(photo)}`,
    )
  })
})

describe('formatPhotoDimensions', () => {
  it('formats width and height with locale-aware separators', () => {
    const photo = createUnsplashPhoto({ width: 4000, height: 3000 })

    expect(formatPhotoDimensions(photo)).toBe('4,000 × 3,000')
  })
})

describe('copyText', () => {
  it('returns true when clipboard write succeeds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    await expect(copyText('hello')).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith('hello')
  })

  it('returns false when clipboard write fails', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('denied')),
      },
      configurable: true,
    })

    await expect(copyText('hello')).resolves.toBe(false)
  })
})
