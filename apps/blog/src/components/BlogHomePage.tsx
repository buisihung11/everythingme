import { useNavigate } from '@tanstack/react-router'
import { FileTextIcon } from 'lucide-react'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  ToggleGroup,
  ToggleGroupItem,
} from '@everythingme/ui'
import { PostCard } from '#/components/PostCard'
import {
  BLOG_SITES,
  SUB_CATEGORIES,
  type BlogType,
} from '#/lib/blog'
import type { PostMeta } from '#/lib/blog-posts'
import { BLOG_PAGE_TRANSITION } from '#/lib/view-transitions'

interface BlogHomePageProps {
  type: BlogType
  posts: PostMeta[]
  category?: string
}

export default function BlogHomePage({ type, posts, category }: BlogHomePageProps) {
  const navigate = useNavigate()
  const activeCategory = category ?? 'all'
  const subCategories = SUB_CATEGORIES[type]
  const site = BLOG_SITES[type]
  const homePath = site.home as '/personal' | '/technical'
  const pageTransitionName = BLOG_PAGE_TRANSITION

  function handleCategoryClick(slug: string) {
    navigate({
      to: homePath,
      search: slug === 'all' ? {} : { category: slug },
    })
  }

  return (
    <main
      className="page-wrap flex-1 px-4 pb-16 pt-10"
      style={{ viewTransitionName: pageTransitionName }}
    >
      <section className="rise-in mb-10">
        {type === 'personal' ? (
          <PersonalIntro />
        ) : (
          <TechnicalIntro />
        )}
      </section>

      {type === 'technical' ? (
        <div
          className="rise-in mb-8 flex flex-col gap-4"
          style={{ animationDelay: '80ms' }}
        >
          <ToggleGroup
            type="single"
            value={activeCategory}
            onValueChange={(value) => {
              if (value) handleCategoryClick(value)
            }}
            variant="outline"
            size="sm"
            className="flex-wrap"
          >
            {subCategories.map((cat) => (
              <ToggleGroupItem key={cat.slug} value={cat.slug}>
                {cat.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      ) : null}

      {posts.length === 0 ? (
        <EmptyState type={type} />
      ) : (
        <div
          className={[
            'grid gap-5',
            type === 'personal'
              ? 'sm:grid-cols-1 md:grid-cols-2'
              : 'sm:grid-cols-2 lg:grid-cols-3',
          ].join(' ')}
        >
          {posts.map((post, i) => (
            <div
              key={post.url}
              className="rise-in"
              style={{ animationDelay: `${i * 60 + 140}ms` }}
            >
              <PostCard post={post} variant={type} />
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

function PersonalIntro() {
  return (
    <div className="max-w-2xl">
      <p
        className="island-kicker mb-3"
        style={{ color: 'var(--blog-accent, var(--kicker))' }}
      >
        Personal Life
      </p>
      <h1
        className="display-title mb-4 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl"
        style={{ color: 'var(--blog-ink, var(--sea-ink))' }}
      >
        Stories from the road,
        <br />
        thoughts on the way.
      </h1>
      <p
        className="text-base leading-relaxed sm:text-lg"
        style={{ color: 'var(--blog-ink-soft, var(--sea-ink-soft))' }}
      >
        {BLOG_SITES.personal.tagline}
      </p>
    </div>
  )
}

function TechnicalIntro() {
  return (
    <div className="max-w-2xl">
      <p
        className="island-kicker mb-3"
        style={{ color: 'var(--blog-accent, var(--kicker))' }}
      >
        Technical
      </p>
      <h1
        className="mb-4 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl"
        style={{ color: 'var(--blog-ink, var(--sea-ink))' }}
      >
        Building, learning,
        <br />
        writing it down.
      </h1>
      <p
        className="text-base leading-relaxed sm:text-lg"
        style={{ color: 'var(--blog-ink-soft, var(--sea-ink-soft))' }}
      >
        {BLOG_SITES.technical.tagline}
      </p>
    </div>
  )
}

function EmptyState({ type }: { type: BlogType }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileTextIcon />
        </EmptyMedia>
        <EmptyTitle>No posts yet</EmptyTitle>
        <EmptyDescription>
          {type === 'personal'
            ? 'No stories here yet — check back soon.'
            : 'Nothing published here yet — more coming.'}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
