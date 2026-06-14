import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchUnsplashPhotos } from '#/lib/unsplash'

describe('fetchUnsplashPhotos', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns empty results without calling the API when query is blank', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')

    await expect(fetchUnsplashPhotos({ query: '' })).resolves.toEqual({
      results: [],
      total_pages: 0,
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches photos from the local proxy route', async () => {
    const payload = {
      results: [{ id: 'photo-1' }],
      total_pages: 2,
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(payload), { status: 200 }),
    )

    await expect(
      fetchUnsplashPhotos({ query: 'mountains', page: 2 }),
    ).resolves.toEqual(payload)

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/unsplash?query=mountains&page=2&per_page=20',
    )
  })

  it('throws when the proxy responds with a non-OK status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('upstream error', { status: 503 }),
    )

    await expect(fetchUnsplashPhotos({ query: 'ocean' })).rejects.toThrow(
      'Failed to fetch photos from Unsplash',
    )
  })
})
