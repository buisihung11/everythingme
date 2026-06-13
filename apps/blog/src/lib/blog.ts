export type BlogType = 'personal' | 'technical'

export const SUB_CATEGORIES = {
  personal: [
    { slug: 'all', label: 'All' },
    { slug: 'travel', label: 'Travel' },
    { slug: 'thoughts', label: 'Thoughts' },
  ],
  technical: [
    { slug: 'all', label: 'All' },
    { slug: 'web-development', label: 'Web Dev' },
    { slug: 'system-design', label: 'System Design' },
    { slug: 'devops', label: 'DevOps' },
  ],
} as const

export const BLOG_SITES = {
  personal: {
    home: '/personal',
    label: 'Personal Life',
    title: 'Stories',
    tagline: 'Travel, reflections, and the small things worth remembering.',
  },
  technical: {
    home: '/technical',
    label: 'Technical',
    title: 'Dev Notes',
    tagline: 'Architecture, tools, and things I wish I knew earlier.',
  },
} as const

type TreeNode = {
  type?: string
  name?: string
  url?: string
  children?: TreeNode[]
}

export function getBlogTypeFromPathname(pathname: string): BlogType {
  if (
    pathname === '/personal' ||
    pathname.startsWith('/personal/') ||
    pathname.startsWith('/blog/personal')
  ) {
    return 'personal'
  }
  return 'technical'
}

export function getBlogTypeFromSlugs(slugs: string[]): BlogType | null {
  const first = slugs[0]
  if (first === 'personal' || first === 'technical') return first
  return null
}

export function filterPageTreeForType(tree: unknown, type: BlogType): unknown {
  const root = tree as { name?: unknown; children?: TreeNode[] }
  const folder = root.children?.find(
    (child) =>
      child.url === `/blog/${type}` || child.name?.toLowerCase() === type,
  )

  if (!folder?.children) {
    return { ...root, children: [] }
  }

  return {
    ...root,
    name: folder.name ?? root.name,
    children: folder.children,
  }
}

export function getDefaultThumbnail(type: BlogType, category: string): string {
  if (type === 'personal') {
    if (category === 'travel') return '/thumbnails/personal-travel.svg'
    return '/thumbnails/personal-thoughts.svg'
  }

  if (category === 'system-design') return '/thumbnails/technical-system.svg'
  if (category === 'devops') return '/thumbnails/technical-devops.svg'
  return '/thumbnails/technical-web.svg'
}
