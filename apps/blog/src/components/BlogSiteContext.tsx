import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import {
  BLOG_SITES,
  getBlogTypeFromPathname,
  type BlogType,
} from '#/lib/blog'
import BlogSiteTransition from './BlogSiteTransition'

type TransitionPhase = 'idle' | 'cover' | 'navigate'

interface BlogSiteContextValue {
  site: BlogType
  switchSite: (target: BlogType) => void
  isTransitioning: boolean
}

const BlogSiteContext = createContext<BlogSiteContextValue | null>(null)

export function BlogSiteProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const site = getBlogTypeFromPathname(pathname)
  const [targetSite, setTargetSite] = useState<BlogType | null>(null)
  const [phase, setPhase] = useState<TransitionPhase>('idle')

  const switchSite = useCallback(
    (target: BlogType) => {
      if (target === site || phase !== 'idle') return

      setTargetSite(target)
      setPhase('cover')

      window.setTimeout(() => {
        setPhase('navigate')
        navigate({ to: BLOG_SITES[target].home })
      }, 420)

      window.setTimeout(() => {
        setPhase('idle')
        setTargetSite(null)
      }, 900)
    },
    [navigate, phase, site],
  )

  const value = useMemo(
    () => ({
      site,
      switchSite,
      isTransitioning: phase !== 'idle',
    }),
    [phase, site, switchSite],
  )

  return (
    <BlogSiteContext.Provider value={value}>
      <div data-blog-mode={site} className="flex min-h-full flex-col">
        {children}
        <BlogSiteTransition
          target={targetSite}
          phase={phase}
        />
      </div>
    </BlogSiteContext.Provider>
  )
}

export function useBlogSite() {
  const context = useContext(BlogSiteContext)
  if (!context) {
    throw new Error('useBlogSite must be used within BlogSiteProvider')
  }
  return context
}
