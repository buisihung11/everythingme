import { Link, useRouterState } from '@tanstack/react-router'
import ThemeToggle from './ThemeToggle'
import BlogSiteSwitch from './BlogSiteSwitch'
import PersonalCategoryNav from './PersonalCategoryNav'
import { BLOG_SITES, getBlogTypeFromPathname } from '#/lib/blog'

export default function Header() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const site = getBlogTypeFromPathname(pathname)
  const siteConfig = BLOG_SITES[site]
  const homePath = siteConfig.home as '/personal' | '/technical'

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
        <h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
          <Link
            to={homePath}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background:
                  site === 'personal'
                    ? 'linear-gradient(90deg,#e8924f,#f0a96b)'
                    : 'linear-gradient(90deg,#2563eb,#60a5fa)',
              }}
            />
            {siteConfig.title}
          </Link>
        </h2>

        {site === 'personal' ? (
          <div className="order-3 flex w-full items-center sm:order-none sm:w-auto sm:flex-1 sm:justify-center">
            <PersonalCategoryNav />
          </div>
        ) : (
          <div className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-sm font-semibold sm:order-none sm:w-auto sm:flex-nowrap sm:pb-0">
            <Link
              to={homePath}
              className="nav-link"
              activeProps={{ className: 'nav-link is-active' }}
            >
              Home
            </Link>
            <Link
              to="/about"
              className="nav-link"
              activeProps={{ className: 'nav-link is-active' }}
            >
              About
            </Link>
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <BlogSiteSwitch />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
