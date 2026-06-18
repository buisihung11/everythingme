import { describe, expect, it } from 'vitest'
import { BLOG_SITES } from './blog'
import { baseOptions } from './layout.shared'

describe('baseOptions', () => {
  it.each(['personal', 'technical'] as const)(
    'returns nav and links scoped to the %s blog',
    (type) => {
      const site = BLOG_SITES[type]

      expect(baseOptions(type)).toEqual({
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
      })
    },
  )
})
