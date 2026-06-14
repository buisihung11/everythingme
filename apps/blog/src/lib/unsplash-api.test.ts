import { afterEach, describe, expect, it, vi } from 'vitest'
import { handleUnsplashSearch } from '#/lib/unsplash-api'

function createRequest(url: string) {
  return new Request(`http://localhost${url}`)
}

describe('handleUnsplashSearch', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 503 when the access key is missing', async () => {
    const response = await handleUnsplashSearch(
      createRequest('/api/unsplash?query=travel'),
    )

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: 'Unsplash API key is not configured',
    })
  })

  it('returns empty results when query is missing', async () => {
    const response = await handleUnsplashSearch(
      createRequest('/api/unsplash'),
      'test-key',
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      results: [],
      total_pages: 0,
    })
  })

  it('proxies search params to Unsplash with the client id header', async () => {
    const payload = { results: [{ id: 'photo-1' }], total_pages: 1 }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(payload), { status: 200 }),
    )

    const response = await handleUnsplashSearch(
      createRequest('/api/unsplash?query=mountains&page=2&per_page=10'),
      'test-key',
    )

    expect(fetchMock).toHaveBeenCalledWith(
      new URL(
        'https://api.unsplash.com/search/photos?query=mountains&page=2&per_page=10',
      ),
      {
        headers: {
          Authorization: 'Client-ID test-key',
        },
      },
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(payload)
  })

  it('forwards upstream error status from Unsplash', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('rate limited', { status: 429 }),
    )

    const response = await handleUnsplashSearch(
      createRequest('/api/unsplash?query=ocean'),
      'test-key',
    )

    expect(response.status).toBe(429)
    await expect(response.json()).resolves.toEqual({
      error: 'Unsplash API request failed',
    })
  })
})
