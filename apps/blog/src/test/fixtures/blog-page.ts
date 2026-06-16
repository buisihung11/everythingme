import type { BlogPageForListing } from '#/lib/blog-post-list'

export function createBlogPage(
  overrides: Partial<BlogPageForListing> & {
    data: BlogPageForListing['data']
  },
): BlogPageForListing {
  const { data, ...rest } = overrides

  return {
    url: rest.url ?? `/blog/${data.type}/${data.category ?? 'general'}/post`,
    ...rest,
    data,
  }
}
