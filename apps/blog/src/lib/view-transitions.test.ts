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
} from './view-transitions'

describe('isBlogListPath', () => {
  it.each(['/personal', '/technical'])('returns true for %s', (pathname) => {
    expect(isBlogListPath(pathname)).toBe(true)
  })

  it('returns false for non-list paths', () => {
    expect(isBlogListPath('/blog/personal/travel')).toBe(false)
    expect(isBlogListPath('/admin')).toBe(false)
  })
})

describe('isBlogDetailPath', () => {
  it('returns true for blog detail paths', () => {
    expect(isBlogDetailPath('/blog/personal/travel/a-week-in-hoi-an')).toBe(
      true,
    )
  })

  it('returns false for list and unrelated paths', () => {
    expect(isBlogDetailPath('/personal')).toBe(false)
    expect(isBlogDetailPath('/')).toBe(false)
  })
})

describe('getBlogPostViewTransitionTypes', () => {
  it('uses open transition when navigating from a list page to a post', () => {
    expect(
      getBlogPostViewTransitionTypes({
        fromLocation: { pathname: '/personal' },
        toLocation: { pathname: '/blog/personal/travel/a-week-in-hoi-an' },
      }),
    ).toEqual([BLOG_POST_OPEN_TRANSITION])
  })

  it('uses close transition when navigating from a post back to a list page', () => {
    expect(
      getBlogPostViewTransitionTypes({
        fromLocation: {
          pathname: '/blog/personal/travel/a-week-in-hoi-an',
        },
        toLocation: { pathname: '/technical' },
      }),
    ).toEqual([BLOG_POST_CLOSE_TRANSITION])
  })

  it('returns false when navigation does not match list/detail transitions', () => {
    expect(
      getBlogPostViewTransitionTypes({
        fromLocation: { pathname: '/admin' },
        toLocation: { pathname: '/blog/personal/travel/a-week-in-hoi-an' },
      }),
    ).toBe(false)

    expect(
      getBlogPostViewTransitionTypes({
        toLocation: { pathname: '/personal' },
      }),
    ).toBe(false)
  })
})

describe('getPostTransitionNames', () => {
  it('builds stable transition names from a blog post URL', () => {
    expect(
      getPostTransitionNames('/blog/personal/travel/a-week-in-hoi-an'),
    ).toEqual({
      page: BLOG_PAGE_TRANSITION,
      thumbnail: 'post-thumb-personal-travel-a-week-in-hoi-an',
      title: 'post-title-personal-travel-a-week-in-hoi-an',
    })
  })

  it('sanitizes unsupported characters in transition ids', () => {
    expect(getPostTransitionNames('/blog/personal/travel/post@v2!!')).toEqual({
      page: BLOG_PAGE_TRANSITION,
      thumbnail: 'post-thumb-personal-travel-post-v2',
      title: 'post-title-personal-travel-post-v2',
    })
  })
})

describe('postUrlFromPath', () => {
  it('prefixes blog paths and strips a leading slash', () => {
    expect(postUrlFromPath('personal/travel/a-week-in-hoi-an')).toBe(
      '/blog/personal/travel/a-week-in-hoi-an',
    )
    expect(postUrlFromPath('/personal/travel/a-week-in-hoi-an')).toBe(
      '/blog/personal/travel/a-week-in-hoi-an',
    )
  })
})
