export const BLOG_POST_OPEN_TRANSITION = 'blog-post-open'
export const BLOG_POST_CLOSE_TRANSITION = 'blog-post-close'
export const BLOG_PAGE_TRANSITION = 'blog-page'

export function isBlogListPath(pathname: string) {
  return pathname === '/personal' || pathname === '/technical'
}

export function isBlogDetailPath(pathname: string) {
  return pathname.startsWith('/blog/')
}

export function getBlogPostViewTransitionTypes({
  fromLocation,
  toLocation,
}: {
  fromLocation?: { pathname: string }
  toLocation: { pathname: string }
}) {
  const from = fromLocation?.pathname ?? ''
  const to = toLocation.pathname

  if (isBlogListPath(from) && isBlogDetailPath(to)) {
    return [BLOG_POST_OPEN_TRANSITION]
  }

  if (isBlogDetailPath(from) && isBlogListPath(to)) {
    return [BLOG_POST_CLOSE_TRANSITION]
  }

  return false
}

function toTransitionId(url: string) {
  return url
    .replace(/^\/blog\//, '')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function getPostTransitionNames(url: string) {
  const id = toTransitionId(url)

  return {
    page: BLOG_PAGE_TRANSITION,
    thumbnail: `post-thumb-${id}`,
    title: `post-title-${id}`,
  } as const
}

export function postUrlFromPath(path: string) {
  return `/blog/${path.replace(/^\//, '')}`
}

export function blogPostSplatFromUrl(url: string): string | undefined {
  return url.startsWith('/blog/') ? url.slice('/blog/'.length) : undefined
}
