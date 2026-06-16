import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { blogSource } from '#/lib/source'
import {
  buildPostList,
  type PostMeta,
} from '#/lib/blog-post-list'

export type { PostMeta } from '#/lib/blog-post-list'
export { getBlogHomePath } from '#/lib/blog-post-list'

export const fetchPosts = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      type: z.enum(['personal', 'technical']),
      category: z.string().optional(),
    }),
  )
  .handler(async ({ data }): Promise<PostMeta[]> => {
    return buildPostList(blogSource.getPages(), data)
  })
