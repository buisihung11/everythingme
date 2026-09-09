import { afterEach, describe, expect, it, vi } from 'vitest'
import { createUnsplashPhoto } from '#/test/fixtures/unsplash-photo'
import { fetchUnsplashPhotos } from './unsplash'

describe('fetchUnsplashPhotos', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns empty results for blank queries without calling the API', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchUnsplashPhotos({ query: '' })).resolves.toEqual({
      results: [],
      total_pages: 0,
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches photos from the local proxy route', async () => {
    const photo = createUnsplashPhoto()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ results: [photo], total_pages: 1 }), {
          status: 200,
        }),
      ),
    )

    await expect(fetchUnsplashPhotos({ query: 'coffee', page: 2 })).resolves.toEqual(
      {
        results: [photo],
        total_pages: 1,
      },
    )

    expect(fetch).toHaveBeenCalledWith(
      '/api/unsplash?query=coffee&page=2&per_page=20',
    )
  })

  it('throws when the proxy responds with an error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 503 })),
    )

    await expect(fetchUnsplashPhotos({ query: 'travel' })).rejects.toThrow(
      'Failed to fetch photos from Unsplash',
    )
  })
})
