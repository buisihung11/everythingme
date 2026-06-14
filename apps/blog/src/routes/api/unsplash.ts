import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/unsplash')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const accessKey = process.env.UNSPLASH_ACCESS_KEY

        if (!accessKey) {
          return Response.json(
            { error: 'Unsplash API key is not configured' },
            { status: 503 },
          )
        }

        const { searchParams } = new URL(request.url)
        const query = searchParams.get('query')

        if (!query) {
          return Response.json({ results: [], total_pages: 0 })
        }

        const page = searchParams.get('page') ?? '1'
        const perPage = searchParams.get('per_page') ?? '20'

        const unsplashUrl = new URL('https://api.unsplash.com/search/photos')
        unsplashUrl.searchParams.set('query', query)
        unsplashUrl.searchParams.set('page', page)
        unsplashUrl.searchParams.set('per_page', perPage)

        const response = await fetch(unsplashUrl, {
          headers: {
            Authorization: `Client-ID ${accessKey}`,
          },
        })

        if (!response.ok) {
          return Response.json(
            { error: 'Unsplash API request failed' },
            { status: response.status },
          )
        }

        return Response.json(await response.json())
      },
    },
  },
})
