import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createUnsplashPhoto } from '#/test/fixtures/unsplash-photo'
import {
  buildMdxImageSnippet,
  buildMdxSnippet,
  buildPostSnippets,
  buildThumbnailFrontmatter,
  copyText,
  formatPhotoDimensions,
  getPhotoAlt,
} from './unsplash-utils'

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
      description: 'Description text',
    })

    expect(getPhotoAlt(photo)).toBe('Description text')
  })

  it('uses a default label when both descriptions are missing', () => {
    const photo = createUnsplashPhoto({
      alt_description: null,
      description: null,
    })

    expect(getPhotoAlt(photo)).toBe('Photo from Unsplash')
  })
})

describe('buildThumbnailFrontmatter', () => {
  it('writes the regular image URL into frontmatter', () => {
    const photo = createUnsplashPhoto()

    expect(buildThumbnailFrontmatter(photo)).toBe(
      'thumbnail: https://images.unsplash.com/photo-1?w=1080',
    )
  })
})

describe('buildMdxImageSnippet', () => {
  it('builds an Image component with src and alt', () => {
    const photo = createUnsplashPhoto()

    expect(buildMdxImageSnippet(photo)).toBe(
      `<Image\n  src="https://images.unsplash.com/photo-1?w=1080"\n  alt="Mountain sunrise"\n/>`,
    )
  })
})

describe('buildMdxSnippet', () => {
  it('delegates to buildMdxImageSnippet for backward compatibility', () => {
    const photo = createUnsplashPhoto()

    expect(buildMdxSnippet(photo)).toBe(buildMdxImageSnippet(photo))
  })
})

describe('buildPostSnippets', () => {
  it('combines thumbnail frontmatter and image snippet', () => {
    const photo = createUnsplashPhoto()

    expect(buildPostSnippets(photo)).toBe(
      [
        'thumbnail: https://images.unsplash.com/photo-1?w=1080',
        '',
        `<Image\n  src="https://images.unsplash.com/photo-1?w=1080"\n  alt="Mountain sunrise"\n/>`,
      ].join('\n'),
    )
  })
})

describe('formatPhotoDimensions', () => {
  it('formats width and height with locale separators', () => {
    const photo = createUnsplashPhoto({ width: 4000, height: 3000 })

    expect(formatPhotoDimensions(photo)).toBe('4,000 × 3,000')
  })
})

describe('copyText', () => {
  const writeText = vi.fn()

  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    writeText.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns true when clipboard write succeeds', async () => {
    writeText.mockResolvedValue(undefined)

    await expect(copyText('hello')).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith('hello')
  })

  it('returns false when clipboard write fails', async () => {
    writeText.mockRejectedValue(new Error('denied'))

    await expect(copyText('hello')).resolves.toBe(false)
  })
})
