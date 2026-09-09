import { describe, expect, it } from 'vitest'
import { createBlogPage } from '#/test/fixtures/blog-page'
import { buildPostList, getBlogHomePath } from './blog-post-list'

describe('getBlogHomePath', () => {
  it.each([
    ['personal', '/personal'],
    ['technical', '/technical'],
  ] as const)('returns %s for %s blog', (type, expected) => {
    expect(getBlogHomePath(type)).toBe(expected)
  })
})

describe('buildPostList', () => {
  it('returns posts for the requested blog type sorted by date descending', () => {
    const posts = buildPostList(
      [
        createBlogPage({
          url: '/blog/personal/travel/older',
          data: {
            title: 'Older trip',
            date: '2026-01-01',
            type: 'personal',
            category: 'travel',
          },
        }),
        createBlogPage({
          url: '/blog/personal/thoughts/newer',
          data: {
            title: 'Newer thought',
            date: '2026-06-01',
            type: 'personal',
            category: 'thoughts',
          },
        }),
      ],
      { type: 'personal' },
    )

    expect(posts.map((post) => post.title)).toEqual([
      'Newer thought',
      'Older trip',
    ])
  })

  it('excludes pages from the other blog type and non-blog URLs', () => {
    const posts = buildPostList(
      [
        createBlogPage({
          url: '/blog/technical/web-development/post',
          data: {
            title: 'Technical post',
            date: '2026-03-01',
            type: 'technical',
            category: 'web-development',
          },
        }),
        createBlogPage({
          url: '/blog/personal/travel/post',
          data: {
            title: 'Personal post',
            date: '2026-02-01',
            type: 'personal',
            category: 'travel',
          },
        }),
        createBlogPage({
          url: '/personal/travel/post',
          data: {
            title: 'Wrong prefix',
            date: '2026-02-01',
            type: 'personal',
            category: 'travel',
          },
        }),
      ],
      { type: 'personal' },
    )

    expect(posts).toHaveLength(1)
    expect(posts[0]?.title).toBe('Personal post')
  })

  it('filters by category when a specific category is requested', () => {
    const posts = buildPostList(
      [
        createBlogPage({
          url: '/blog/personal/travel/post-a',
          data: {
            title: 'Travel post',
            date: '2026-04-01',
            type: 'personal',
            category: 'travel',
          },
        }),
        createBlogPage({
          url: '/blog/personal/thoughts/post-b',
          data: {
            title: 'Thought post',
            date: '2026-05-01',
            type: 'personal',
            category: 'thoughts',
          },
        }),
      ],
      { type: 'personal', category: 'travel' },
    )

    expect(posts).toHaveLength(1)
    expect(posts[0]?.category).toBe('travel')
  })

  it('returns all categories when category is all', () => {
    const posts = buildPostList(
      [
        createBlogPage({
          url: '/blog/personal/travel/post-a',
          data: {
            title: 'Travel post',
            date: '2026-04-01',
            type: 'personal',
            category: 'travel',
          },
        }),
        createBlogPage({
          url: '/blog/personal/thoughts/post-b',
          data: {
            title: 'Thought post',
            date: '2026-05-01',
            type: 'personal',
            category: 'thoughts',
          },
        }),
      ],
      { type: 'personal', category: 'all' },
    )

    expect(posts).toHaveLength(2)
  })

  it('uses frontmatter thumbnail when present and falls back to defaults', () => {
    const [withThumb] = buildPostList(
      [
        createBlogPage({
          url: '/blog/personal/travel/with-thumb',
          data: {
            title: 'With thumbnail',
            date: '2026-04-01',
            type: 'personal',
            category: 'travel',
            thumbnail: 'https://example.com/custom.jpg',
          },
        }),
      ],
      { type: 'personal' },
    )

    const [withoutThumb] = buildPostList(
      [
        createBlogPage({
          url: '/blog/technical/devops/without-thumb',
          data: {
            title: 'Without thumbnail',
            date: '2026-03-01',
            type: 'technical',
            category: 'devops',
          },
        }),
      ],
      { type: 'technical' },
    )

    expect(withThumb?.thumbnail).toBe('https://example.com/custom.jpg')
    expect(withoutThumb?.thumbnail).toBe('/thumbnails/technical-devops.svg')
  })

  it('normalizes missing optional fields to empty strings', () => {
    const [post] = buildPostList(
      [
        createBlogPage({
          url: '/blog/personal/thoughts/minimal',
          data: {
            title: 'Minimal post',
            type: 'personal',
          },
        }),
      ],
      { type: 'personal' },
    )

    expect(post).toMatchObject({
      title: 'Minimal post',
      description: '',
      date: '',
      category: '',
      thumbnail: '/thumbnails/personal-thoughts.svg',
    })
  })
})
