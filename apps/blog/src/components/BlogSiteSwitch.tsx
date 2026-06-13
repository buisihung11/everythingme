import { BookOpen, Code2 } from 'lucide-react'
import { BLOG_SITES, type BlogType } from '#/lib/blog'
import { useBlogSite } from './BlogSiteContext'

const SITE_OPTIONS: {
  type: BlogType
  label: string
  Icon: typeof BookOpen
}[] = [
  { type: 'personal', label: 'Personal stories', Icon: BookOpen },
  { type: 'technical', label: 'Technical notes', Icon: Code2 },
]

export default function BlogSiteSwitch() {
  const { site, switchSite, isTransitioning } = useBlogSite()

  return (
    <div
      className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--surface)] p-0.5 shadow-sm"
      role="group"
      aria-label="Switch blog site"
    >
      {SITE_OPTIONS.map(({ type, label, Icon }) => {
        const active = site === type
        return (
          <button
            key={type}
            type="button"
            disabled={isTransitioning}
            onClick={() => switchSite(type)}
            title={BLOG_SITES[type].label}
            aria-label={label}
            aria-pressed={active}
            className={[
              'flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 sm:h-9 sm:w-9',
              active
                ? 'bg-[var(--blog-accent,var(--lagoon))] text-white shadow-sm'
                : 'text-[var(--sea-ink-soft)] hover:bg-[var(--chip-bg)] hover:text-[var(--sea-ink)]',
              isTransitioning ? 'cursor-wait opacity-70' : '',
            ].join(' ')}
          >
            <Icon className="h-4 w-4" strokeWidth={active ? 2.2 : 1.8} />
          </button>
        )
      })}
    </div>
  )
}
