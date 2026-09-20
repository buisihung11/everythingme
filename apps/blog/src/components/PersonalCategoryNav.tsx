import { Link, useRouterState } from '@tanstack/react-router'
import { getActivePersonalCategory, SUB_CATEGORIES } from '#/lib/blog'

export default function PersonalCategoryNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const search = useRouterState({
    select: (state) => state.location.search as { category?: string },
  })
  const activeCategory = getActivePersonalCategory(pathname, search.category)

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      {SUB_CATEGORIES.personal.map((cat) => {
        const isActive = activeCategory === cat.slug
        return (
          <Link
            key={cat.slug}
            to="/personal"
            search={cat.slug === 'all' ? {} : { category: cat.slug }}
            className="rounded-full border px-2.5 py-1 text-xs font-semibold no-underline transition-all duration-150 sm:px-3"
            style={{
              borderColor: isActive
                ? 'var(--blog-accent)'
                : 'var(--blog-chip-line)',
              background: isActive
                ? 'var(--blog-accent)'
                : 'var(--blog-chip-bg)',
              color: isActive ? '#fff' : 'var(--blog-ink-soft)',
            }}
            aria-current={isActive ? 'page' : undefined}
          >
            {cat.label}
          </Link>
        )
      })}
    </div>
  )
}
