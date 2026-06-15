import { describe, expect, it } from 'vitest'
import {
  filterPageTreeForType,
  getBlogTypeFromPathname,
  getBlogTypeFromSlugs,
  getDefaultThumbnail,
} from './blog'

describe('getBlogTypeFromPathname', () => {
  it.each([
    ['/personal', 'personal'],
    ['/personal/travel', 'personal'],
    ['/blog/personal/travel/a-week-in-hoi-an', 'personal'],
    ['/technical', 'technical'],
    ['/technical/web-development', 'technical'],
    ['/blog/technical/web-development/post', 'technical'],
    ['/admin', 'technical'],
    ['/', 'technical'],
  ] as const)('maps %s to %s', (pathname, expected) => {
    expect(getBlogTypeFromPathname(pathname)).toBe(expected)
  })
})

describe('getBlogTypeFromSlugs', () => {
  it('returns the blog type when the first slug is personal or technical', () => {
    expect(getBlogTypeFromSlugs(['personal', 'travel'])).toBe('personal')
    expect(getBlogTypeFromSlugs(['technical', 'devops'])).toBe('technical')
  })

  it('returns null when the first slug is not a blog type', () => {
    expect(getBlogTypeFromSlugs(['travel', 'a-week-in-hoi-an'])).toBeNull()
    expect(getBlogTypeFromSlugs([])).toBeNull()
  })
})

describe('filterPageTreeForType', () => {
  const tree = {
    name: 'Blog',
    children: [
      {
        name: 'Personal',
        url: '/blog/personal',
        children: [{ name: 'Travel', url: '/blog/personal/travel' }],
      },
      {
        name: 'Technical',
        url: '/blog/technical',
        children: [{ name: 'Web Dev', url: '/blog/technical/web-development' }],
      },
    ],
  }

  it('returns the matching folder children when found by url', () => {
    expect(filterPageTreeForType(tree, 'personal')).toEqual({
      name: 'Personal',
      children: [{ name: 'Travel', url: '/blog/personal/travel' }],
    })
  })

  it('matches folders by case-insensitive name when url is missing', () => {
    const treeByName = {
      name: 'Blog',
      children: [
        {
          name: 'TECHNICAL',
          children: [{ name: 'DevOps', url: '/blog/technical/devops' }],
        },
      ],
    }

    expect(filterPageTreeForType(treeByName, 'technical')).toEqual({
      name: 'TECHNICAL',
      children: [{ name: 'DevOps', url: '/blog/technical/devops' }],
    })
  })

  it('returns an empty tree when the folder is missing or has no children', () => {
    expect(filterPageTreeForType(tree, 'technical')).toEqual({
      name: 'Technical',
      children: [{ name: 'Web Dev', url: '/blog/technical/web-development' }],
    })

    expect(filterPageTreeForType({ name: 'Blog', children: [] }, 'personal')).toEqual({
      name: 'Blog',
      children: [],
    })

    expect(
      filterPageTreeForType(
        {
          name: 'Blog',
          children: [{ name: 'Personal', url: '/blog/personal' }],
        },
        'personal',
      ),
    ).toEqual({
      name: 'Blog',
      children: [],
    })
  })
})

describe('getDefaultThumbnail', () => {
  it.each([
    ['personal', 'travel', '/thumbnails/personal-travel.svg'],
    ['personal', 'thoughts', '/thumbnails/personal-thoughts.svg'],
    ['personal', 'other', '/thumbnails/personal-thoughts.svg'],
    ['technical', 'system-design', '/thumbnails/technical-system.svg'],
    ['technical', 'devops', '/thumbnails/technical-devops.svg'],
    ['technical', 'web-development', '/thumbnails/technical-web.svg'],
    ['technical', 'other', '/thumbnails/technical-web.svg'],
  ] as const)('returns %s for %s/%s', (type, category, expected) => {
    expect(getDefaultThumbnail(type, category)).toBe(expected)
  })
})
