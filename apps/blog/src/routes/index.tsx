import { Link, createFileRoute } from '@tanstack/react-router'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageContainer,
} from '@everythingme/ui'

export const Route = createFileRoute('/')({ component: App })

const categories = [
  {
    title: 'Re-event the wheel',
    description:
      'Rebuild existing applications with our own solutions. Every project keeps a lessons/ folder.',
  },
  {
    title: 'Studying',
    description:
      'Small apps to learn new technology hands-on. Document findings in lessons/.',
  },
  {
    title: 'Personal blog',
    description:
      'Long-form writing powered by Fumadocs MDX and TanStack Start.',
  },
  {
    title: 'Foundation libs',
    description:
      'Shared auth, database, shadcn UI, and config for every app in the monorepo.',
  },
] as const

function App() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
        <p className="island-kicker mb-3">EverythingMe</p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          One monorepo for building, learning, and writing.
        </h1>
        <p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          Personal projects, study experiments, re-invented apps, and shared
          foundation libraries — all in one place.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/blog/$" params={{ _splat: '' }}>
              Read the blog
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/about">About</Link>
          </Button>
        </div>
      </section>

      <PageContainer className="mt-8 px-0">
        <section className="grid gap-4 sm:grid-cols-2">
          {categories.map((item, index) => (
            <Card
              key={item.title}
              className="rise-in feature-card border-[var(--line)] bg-[var(--surface-strong)]"
              style={{ animationDelay: `${index * 90 + 80}ms` }}
            >
              <CardHeader>
                <CardTitle className="text-[var(--sea-ink)]">
                  {item.title}
                </CardTitle>
                <CardDescription className="text-[var(--sea-ink-soft)]">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </section>
      </PageContainer>
    </main>
  )
}
