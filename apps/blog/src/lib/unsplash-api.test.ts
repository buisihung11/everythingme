import { afterEach, describe, expect, it, vi } from 'vitest'
import { createUnsplashPhoto } from '#/test/fixtures/unsplash-photo'
import { handleUnsplashSearch } from './unsplash-api'

describe('handleUnsplashSearch', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 503 when the Unsplash access key is missing', async () => {
    const request = new Request('http://localhost/api/unsplash?query=travel')

    const response = await handleUnsplashSearch(request, undefined)

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: 'Unsplash API key is not configured',
    })
  })

  it('returns empty results when query is missing', async () => {
    const request = new Request('http://localhost/api/unsplash')

    const response = await handleUnsplashSearch(request, 'test-key')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      results: [],
      total_pages: 0,
    })
  })

  it('proxies search requests to Unsplash with auth and pagination params', async () => {
    const photo = createUnsplashPhoto()
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ results: [photo], total_pages: 3 }), {
        status: 200,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const request = new Request(
      'http://localhost/api/unsplash?query=mountain&page=2&per_page=10',
    )

    const response = await handleUnsplashSearch(request, 'test-key')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      results: [photo],
      total_pages: 3,
    })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, options] = fetchMock.mock.calls[0] as [URL, RequestInit]
    expect(url.href).toBe(
      'https://api.unsplash.com/search/photos?query=mountain&page=2&per_page=10',
    )
    expect(options.headers).toEqual({
      Authorization: 'Client-ID test-key',
    })
  })

  it('forwards upstream error status when Unsplash rejects the request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    )

    const request = new Request('http://localhost/api/unsplash?query=travel')
    const response = await handleUnsplashSearch(request, 'test-key')

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: 'Unsplash API request failed',
    })
  })
})
