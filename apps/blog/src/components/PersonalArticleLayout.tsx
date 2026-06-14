import { Link } from '@tanstack/react-router'
import { Suspense } from 'react'
import { useMDXComponents } from '@/components/mdx'
import {
  BlogPostTransitionProvider,
  useBlogPostUrl,
} from '@/components/BlogPostTransitionContext'
import browserCollections from 'collections/browser'
import {
  BLOG_POST_CLOSE_TRANSITION,
  getPostTransitionNames,
} from '#/lib/view-transitions'

function formatDate(dateStr?: string) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatCategory(slug?: string) {
  if (!slug) return null
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const personalClientLoader = browserCollections.docs.createClientLoader({
  component({ frontmatter, default: MDX }) {
    const postUrl = useBlogPostUrl()
    const transitionNames = postUrl ? getPostTransitionNames(postUrl) : null
    const date = formatDate(frontmatter.date as string | undefined)
    const category = formatCategory(frontmatter.category as string | undefined)

    return (
      <article className="personal-article">
        {frontmatter.thumbnail ? (
          <div
            className="personal-article-hero mb-8 overflow-hidden rounded-[1.75rem]"
            style={
              transitionNames
                ? { viewTransitionName: transitionNames.thumbnail }
                : undefined
            }
          >
            <img
              src={frontmatter.thumbnail as string}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        <header className="mb-8">
          {category ? (
            <p
              className="island-kicker mb-3"
              style={{ color: 'var(--blog-accent, var(--kicker))' }}
            >
              {category}
            </p>
          ) : null}
          <h1
            className="display-title mb-4 text-4xl font-bold leading-[1.05] tracking-tight text-[var(--blog-ink,var(--sea-ink))] sm:text-5xl"
            style={
              transitionNames
                ? { viewTransitionName: transitionNames.title }
                : undefined
            }
          >
            {frontmatter.title}
          </h1>
          {frontmatter.description ? (
            <p className="text-lg leading-relaxed text-[var(--blog-ink-soft,var(--sea-ink-soft))]">
              {frontmatter.description}
            </p>
          ) : null}
          {date ? (
            <time
              dateTime={frontmatter.date as string}
              className="mt-4 block text-sm text-[var(--blog-ink-soft,var(--sea-ink-soft))]"
            >
              {date}
            </time>
          ) : null}
        </header>

        <div className="personal-article-body prose prose-neutral max-w-none dark:prose-invert">
          <MDX components={useMDXComponents()} />
        </div>
      </article>
    )
  },
})

interface PersonalArticleLayoutProps {
  path: string
  url: string
}

export default function PersonalArticleLayout({ path, url }: PersonalArticleLayoutProps) {
  const transitionNames = getPostTransitionNames(url)

  return (
    <main
      className="page-wrap flex-1 px-4 pb-16 pt-8"
      style={{ viewTransitionName: transitionNames.page }}
    >
      <div className="mx-auto max-w-2xl">
        <Link
          to="/personal"
          className="mb-8 inline-flex items-center gap-1 text-sm font-semibold no-underline"
          style={{ color: 'var(--blog-accent, var(--lagoon-deep))' }}
          viewTransition={{ types: [BLOG_POST_CLOSE_TRANSITION] }}
        >
          &larr; Back to stories
        </Link>
        <Suspense>
          <BlogPostTransitionProvider url={url}>
            {personalClientLoader.useContent(path)}
          </BlogPostTransitionProvider>
        </Suspense>
      </div>
    </main>
  )
}

export { personalClientLoader }
