import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@everythingme/ui'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="page-wrap flex-1 px-4 pb-8 pt-14">
      <section className="island-shell rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">About</p>
        <h1 className="display-title mb-4 text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
          everything-blog
        </h1>
        <p className="mb-4 text-[var(--sea-ink-soft)]">
          Two separate spaces under one roof: a warm personal journal and a focused
          technical notebook. Use the icon switch in the header to move between them.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/technical">Technical notes</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/personal">Personal stories</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
