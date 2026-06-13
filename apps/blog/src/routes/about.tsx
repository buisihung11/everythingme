import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@everythingme/ui'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">About</p>
        <h1 className="display-title mb-4 text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
          EverythingMe
        </h1>
        <p className="mb-4 text-[var(--sea-ink-soft)]">
          This monorepo is my all-in-one workspace for personal software
          projects. It is organized into four purposes: re-event-the-wheel
          experiments, studying new tech, a personal blog, and shared foundation
          libraries.
        </p>
        <p className="mb-6 text-[var(--sea-ink-soft)]">
          The blog is the first implemented app. Posts are written as MDX files
          and rendered with Fumadocs. UI components use shadcn/ui from
          `@everythingme/ui`. Authentication is handled by Better Auth with
          PostgreSQL via Drizzle ORM.
        </p>
        <Button asChild>
          <Link to="/blog/$" params={{ _splat: 'posts/hello-world' }}>
            Read the first post
          </Link>
        </Button>
      </section>
    </main>
  )
}
