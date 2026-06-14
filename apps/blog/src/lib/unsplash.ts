import type { UnsplashPhoto } from 'react-unsplash'

export interface UnsplashSearchResponse {
  results: UnsplashPhoto[]
  total_pages: number
}

export async function fetchUnsplashPhotos({
  query,
  page = 1,
}: {
  query: string
  page?: number
}): Promise<UnsplashSearchResponse> {
  if (!query) {
    return { results: [], total_pages: 0 }
  }

  const params = new URLSearchParams({
    query,
    page: String(page),
    per_page: '20',
  })

  const response = await fetch(`/api/unsplash?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch photos from Unsplash')
  }

  return response.json()
}
