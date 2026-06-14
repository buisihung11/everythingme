import { describe, expect, it } from 'vitest'
import {
  filterPageTreeForType,
  getBlogTypeFromPathname,
  getBlogTypeFromSlugs,
  getDefaultThumbnail,
} from '#/lib/blog'

describe('getBlogTypeFromPathname', () => {
  it.each([
    '/personal',
    '/personal/travel',
    '/blog/personal/travel/post',
  ])('returns personal for %s', (pathname) => {
    expect(getBlogTypeFromPathname(pathname)).toBe('personal')
  })

  it('defaults to technical for other paths', () => {
    expect(getBlogTypeFromPathname('/technical')).toBe('technical')
    expect(getBlogTypeFromPathname('/blog/technical/web/post')).toBe('technical')
    expect(getBlogTypeFromPathname('/')).toBe('technical')
  })
})

describe('getBlogTypeFromSlugs', () => {
  it('returns the blog type when the first slug matches', () => {
    expect(getBlogTypeFromSlugs(['personal', 'travel'])).toBe('personal')
    expect(getBlogTypeFromSlugs(['technical', 'web-development'])).toBe(
      'technical',
    )
  })

  it('returns null for unknown first slugs', () => {
    expect(getBlogTypeFromSlugs(['about'])).toBeNull()
    expect(getBlogTypeFromSlugs([])).toBeNull()
  })
})

describe('filterPageTreeForType', () => {
  it('returns only the children for the requested blog type', () => {
    const tree = {
      name: 'root',
      children: [
        {
          url: '/blog/personal',
          name: 'Personal',
          children: [{ url: '/blog/personal/travel/post-a' }],
        },
        {
          url: '/blog/technical',
          name: 'Technical',
          children: [{ url: '/blog/technical/web/post-b' }],
        },
      ],
    }

    expect(filterPageTreeForType(tree, 'personal')).toEqual({
      name: 'Personal',
      children: [{ url: '/blog/personal/travel/post-a' }],
    })
  })

  it('returns an empty tree when the blog type folder is missing', () => {
    const tree = { name: 'root', children: [] }

    expect(filterPageTreeForType(tree, 'technical')).toEqual({
      name: 'root',
      children: [],
    })
  })
})

describe('getDefaultThumbnail', () => {
  it.each([
    ['personal', 'travel', '/thumbnails/personal-travel.svg'],
    ['personal', 'thoughts', '/thumbnails/personal-thoughts.svg'],
    ['technical', 'system-design', '/thumbnails/technical-system.svg'],
    ['technical', 'devops', '/thumbnails/technical-devops.svg'],
    ['technical', 'web-development', '/thumbnails/technical-web.svg'],
  ] as const)('maps %s/%s to %s', (type, category, expected) => {
    expect(getDefaultThumbnail(type, category)).toBe(expected)
  })
})
