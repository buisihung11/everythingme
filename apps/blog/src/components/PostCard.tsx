import { Link } from '@tanstack/react-router'
import type { PostMeta } from '#/lib/blog-posts'
import { blogPostSplatFromUrl } from '#/lib/blog'
import {
  BLOG_POST_OPEN_TRANSITION,
  getPostTransitionNames,
} from '#/lib/view-transitions'

interface PostCardProps {
  post: PostMeta
  variant: 'personal' | 'technical'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatCategory(slug: string) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function PostCard({ post, variant }: PostCardProps) {
  if (variant === 'personal') {
    return <PersonalPostCard post={post} />
  }
  return <TechnicalPostCard post={post} />
}

function PostThumbnail({
  post,
  variant,
  transitionName,
}: {
  post: PostMeta
  variant: 'personal' | 'technical'
  transitionName?: string
}) {
  return (
    <div
      className={[
        'relative overflow-hidden',
        variant === 'personal' ? 'mb-5 aspect-[16/10] rounded-xl' : 'mb-4 aspect-[16/9] rounded-lg',
      ].join(' ')}
      style={transitionName ? { viewTransitionName: transitionName } : undefined}
    >
      <img
        src={post.thumbnail}
        alt=""
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            variant === 'personal'
              ? 'linear-gradient(180deg, transparent 40%, rgba(59,42,26,0.35))'
              : 'linear-gradient(180deg, transparent 50%, rgba(15,23,42,0.4))',
        }}
      />
    </div>
  )
}

function PersonalPostCard({ post }: { post: PostMeta }) {
  const transitionNames = getPostTransitionNames(post.url)

  return (
    <Link
      to="/blog/$"
      params={{ _splat: blogPostSplatFromUrl(post.url) }}
      className="group block no-underline"
      viewTransition={{ types: [BLOG_POST_OPEN_TRANSITION] }}
    >
      <article
        className="h-full rounded-2xl border p-6 transition-all duration-200 group-hover:-translate-y-1"
        style={{
          borderColor: 'var(--blog-line)',
          background:
            'linear-gradient(160deg, var(--blog-surface-strong), var(--blog-surface))',
          boxShadow:
            '0 2px 0 rgba(255,255,255,0.6) inset, 0 12px 32px rgba(120,70,20,0.08)',
        }}
      >
        <PostThumbnail
          post={post}
          variant="personal"
          transitionName={transitionNames.thumbnail}
        />

        <div className="mb-3 flex items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{
              background: 'var(--blog-tag-bg)',
              color: 'var(--blog-tag-text)',
            }}
          >
            {formatCategory(post.category)}
          </span>
        </div>

        <h2
          className="blog-heading-font mb-3 text-xl font-bold leading-snug"
          style={{
            color: 'var(--blog-ink)',
            viewTransitionName: transitionNames.title,
          }}
        >
          {post.title}
        </h2>

        <p
          className="mb-5 text-sm leading-relaxed"
          style={{ color: 'var(--blog-ink-soft)' }}
        >
          {post.description}
        </p>

        <footer className="flex items-center justify-between">
          <time
            dateTime={post.date}
            className="text-xs"
            style={{ color: 'var(--blog-ink-soft)' }}
          >
            {formatDate(post.date)}
          </time>
          {post.readTime && (
            <span className="text-xs" style={{ color: 'var(--blog-ink-soft)' }}>
              {post.readTime} min read
            </span>
          )}
        </footer>
      </article>
    </Link>
  )
}

function TechnicalPostCard({ post }: { post: PostMeta }) {
  const transitionNames = getPostTransitionNames(post.url)

  return (
    <Link
      to="/blog/$"
      params={{ _splat: blogPostSplatFromUrl(post.url) }}
      className="group block no-underline"
      viewTransition={{ types: [BLOG_POST_OPEN_TRANSITION] }}
    >
      <article
        className="h-full overflow-hidden rounded-xl border transition-all duration-200 group-hover:border-[var(--blog-accent-light)] group-hover:shadow-md"
        style={{
          borderColor: 'var(--blog-line)',
          background: 'var(--blog-surface-strong)',
        }}
      >
        <PostThumbnail
          post={post}
          variant="technical"
          transitionName={transitionNames.thumbnail}
        />

        <div className="p-5 pt-0">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span
              className="rounded-md px-2 py-0.5 font-mono text-xs font-semibold"
              style={{
                background: 'var(--blog-tag-bg)',
                color: 'var(--blog-tag-text)',
              }}
            >
              {formatCategory(post.category)}
            </span>
            {post.readTime && (
              <span
                className="text-xs tabular-nums"
                style={{ color: 'var(--blog-ink-soft)' }}
              >
                {post.readTime} min
              </span>
            )}
          </div>

          <h2
            className="mb-2 text-base font-bold leading-snug"
            style={{
              color: 'var(--blog-ink)',
              viewTransitionName: transitionNames.title,
            }}
          >
            {post.title}
          </h2>

          <p
            className="mb-4 text-sm leading-relaxed"
            style={{ color: 'var(--blog-ink-soft)' }}
          >
            {post.description}
          </p>

          <footer className="flex items-center gap-1.5">
            <time
              dateTime={post.date}
              className="text-xs"
              style={{ color: 'var(--blog-ink-soft)' }}
            >
              {formatDate(post.date)}
            </time>
            <span
              className="ml-auto text-xs font-semibold group-hover:underline"
              style={{ color: 'var(--blog-accent)' }}
            >
              Read &rarr;
            </span>
          </footer>
        </div>
      </article>
    </Link>
  )
}
