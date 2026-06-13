import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { blogSource } from '#/lib/source'
import { getDefaultThumbnail, type BlogType } from '#/lib/blog'

export interface PostMeta {
  url: string
  title: string
  description: string
  date: string
  category: string
  readTime?: number
  thumbnail: string
}

export const fetchPosts = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      type: z.enum(['personal', 'technical']),
      category: z.string().optional(),
    }),
  )
  .handler(async ({ data }): Promise<PostMeta[]> => {
    const pages = blogSource.getPages()

    return pages
      .filter((page) => {
        if (page.data.type !== data.type) return false
        if (!page.url.startsWith(`/blog/${data.type}`)) return false
        if (data.category && data.category !== 'all') {
          if (page.data.category !== data.category) return false
        }
        return true
      })
      .map((page) => ({
        url: page.url,
        title: page.data.title,
        description: page.data.description ?? '',
        date: page.data.date ?? '',
        category: page.data.category ?? '',
        readTime: page.data.readTime,
        thumbnail:
          page.data.thumbnail ??
          getDefaultThumbnail(data.type, page.data.category ?? ''),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })

export function getBlogHomePath(type: BlogType) {
  return type === 'technical' ? '/technical' : '/personal'
}
