import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import { BLOG_SITES, type BlogType } from '#/lib/blog'

export function baseOptions(type: BlogType): BaseLayoutProps {
  const site = BLOG_SITES[type]

  return {
    nav: {
      title: site.title,
      url: site.home,
    },
    links: [
      {
        text: 'Home',
        url: site.home,
        active: 'nested-url',
      },
      {
        text: 'About',
        url: '/about',
      },
    ],
  }
}
