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

export interface BlogPageForListing {
  url: string
  data: {
    title: string
    description?: string
    date?: string
    type: BlogType
    category?: string
    readTime?: number
    thumbnail?: string
  }
}

export function buildPostList(
  pages: BlogPageForListing[],
  data: { type: BlogType; category?: string },
): PostMeta[] {
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
}

export function getBlogHomePath(type: BlogType) {
  return type === 'technical' ? '/technical' : '/personal'
}
