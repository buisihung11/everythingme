import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import BlogHomePage from '#/components/BlogHomePage'
import { fetchPosts } from '#/lib/blog-posts'

const searchSchema = z.object({
  category: z.string().optional(),
})

export const Route = createFileRoute('/personal/')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ category: search.category }),
  loader: async ({ deps }) => {
    return fetchPosts({
      data: { type: 'personal', category: deps.category },
    })
  },
  component: PersonalHome,
})

function PersonalHome() {
  const search = Route.useSearch()
  const posts = Route.useLoaderData()

  return (
    <BlogHomePage
      type="personal"
      posts={posts}
      category={search.category}
    />
  )
}
