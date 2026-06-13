import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import BlogHomePage from '#/components/BlogHomePage'
import { fetchPosts } from '#/lib/blog-posts'

const searchSchema = z.object({
  category: z.string().optional(),
})

export const Route = createFileRoute('/technical/')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ category: search.category }),
  loader: async ({ deps }) => {
    return fetchPosts({
      data: { type: 'technical', category: deps.category },
    })
  },
  component: TechnicalHome,
})

function TechnicalHome() {
  const search = Route.useSearch()
  const posts = Route.useLoaderData()

  return (
    <BlogHomePage
      type="technical"
      posts={posts}
      category={search.category}
    />
  )
}
