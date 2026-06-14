import { describe, expect, it } from 'vitest'
import {
  BLOG_PAGE_TRANSITION,
  BLOG_POST_CLOSE_TRANSITION,
  BLOG_POST_OPEN_TRANSITION,
  getBlogPostViewTransitionTypes,
  getPostTransitionNames,
  isBlogDetailPath,
  isBlogListPath,
  postUrlFromPath,
} from '#/lib/view-transitions'

describe('isBlogListPath', () => {
  it.each(['/personal', '/technical'])('returns true for %s', (pathname) => {
    expect(isBlogListPath(pathname)).toBe(true)
  })

  it('returns false for blog detail and unrelated paths', () => {
    expect(isBlogListPath('/blog/personal/travel/post')).toBe(false)
    expect(isBlogListPath('/')).toBe(false)
  })
})

describe('isBlogDetailPath', () => {
  it('returns true for paths under /blog/', () => {
    expect(isBlogDetailPath('/blog/personal/travel/post')).toBe(true)
  })

  it('returns false for list and unrelated paths', () => {
    expect(isBlogDetailPath('/personal')).toBe(false)
    expect(isBlogDetailPath('/about')).toBe(false)
  })
})

describe('getBlogPostViewTransitionTypes', () => {
  it('returns open transition when navigating from list to detail', () => {
    expect(
      getBlogPostViewTransitionTypes({
        fromLocation: { pathname: '/personal' },
        toLocation: { pathname: '/blog/personal/travel/post' },
      }),
    ).toEqual([BLOG_POST_OPEN_TRANSITION])
  })

  it('returns close transition when navigating from detail to list', () => {
    expect(
      getBlogPostViewTransitionTypes({
        fromLocation: { pathname: '/blog/technical/web/post' },
        toLocation: { pathname: '/technical' },
      }),
    ).toEqual([BLOG_POST_CLOSE_TRANSITION])
  })

  it('returns false when neither open nor close applies', () => {
    expect(
      getBlogPostViewTransitionTypes({
        fromLocation: { pathname: '/about' },
        toLocation: { pathname: '/contact' },
      }),
    ).toBe(false)
  })

  it('treats a missing from location as non-list', () => {
    expect(
      getBlogPostViewTransitionTypes({
        toLocation: { pathname: '/blog/personal/travel/post' },
      }),
    ).toBe(false)
  })
})

describe('getPostTransitionNames', () => {
  it('derives stable transition names from a blog post URL', () => {
    expect(getPostTransitionNames('/blog/personal/travel/a-week-in-hoi-an')).toEqual({
      page: BLOG_PAGE_TRANSITION,
      thumbnail: 'post-thumb-personal-travel-a-week-in-hoi-an',
      title: 'post-title-personal-travel-a-week-in-hoi-an',
    })
  })

  it('sanitizes special characters in the transition id', () => {
    expect(getPostTransitionNames('/blog/personal/travel/post_v2!')).toEqual({
      page: BLOG_PAGE_TRANSITION,
      thumbnail: 'post-thumb-personal-travel-post-v2',
      title: 'post-title-personal-travel-post-v2',
    })
  })
})

describe('postUrlFromPath', () => {
  it('prefixes a relative path with /blog/', () => {
    expect(postUrlFromPath('personal/travel/post')).toBe(
      '/blog/personal/travel/post',
    )
  })

  it('strips a leading slash before prefixing', () => {
    expect(postUrlFromPath('/personal/travel/post')).toBe(
      '/blog/personal/travel/post',
    )
  })
})
