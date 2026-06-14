import { createFileRoute } from '@tanstack/react-router'
import { handleUnsplashSearch } from '#/lib/unsplash-api'

export const Route = createFileRoute('/api/unsplash')({
  server: {
    handlers: {
      GET: async ({ request }) =>
        handleUnsplashSearch(request, process.env.UNSPLASH_ACCESS_KEY),
    },
  },
})
