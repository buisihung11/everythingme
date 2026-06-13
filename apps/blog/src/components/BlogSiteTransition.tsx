import { BLOG_SITES, type BlogType } from '#/lib/blog'
import { BookOpen, Code2 } from 'lucide-react'

type TransitionPhase = 'idle' | 'cover' | 'navigate'

interface BlogSiteTransitionProps {
  target: BlogType | null
  phase: TransitionPhase
}

const SITE_ICONS = {
  personal: BookOpen,
  technical: Code2,
} as const

export default function BlogSiteTransition({
  target,
  phase,
}: BlogSiteTransitionProps) {
  if (!target || phase === 'idle') return null

  const Icon = SITE_ICONS[target]
  const config = BLOG_SITES[target]
  const visible = phase === 'cover' || phase === 'navigate'

  return (
    <div
      className={[
        'site-transition fixed inset-0 z-[100] flex items-center justify-center',
        visible ? 'site-transition-visible' : '',
        target === 'personal'
          ? 'site-transition-personal'
          : 'site-transition-technical',
      ].join(' ')}
      aria-hidden={!visible}
    >
      <div className="site-transition-panel rise-in text-center">
        <div className="site-transition-icon-wrap mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
          <Icon className="h-8 w-8" strokeWidth={1.8} />
        </div>
        <p className="site-transition-kicker mb-2 text-xs font-bold uppercase tracking-[0.18em]">
          Switching to
        </p>
        <p className="site-transition-title text-2xl font-bold">
          {config.title}
        </p>
        <p className="site-transition-copy mt-2 max-w-xs text-sm opacity-80">
          {config.tagline}
        </p>
      </div>
    </div>
  )
}
