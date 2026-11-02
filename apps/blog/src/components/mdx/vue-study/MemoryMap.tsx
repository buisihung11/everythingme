import { MEMORY_MAPS, type ReviewId } from './review'

export function MemoryMap({ id = 'vue-fundamentals' }: { id?: ReviewId }) {
  return (
    <nav aria-label="Bản đồ hình ảnh của bài" className="not-prose my-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {MEMORY_MAPS[id].map(({ icon: Icon, image, concept, href }) => (
        <a
          key={image}
          href={href}
          className="group flex gap-3 rounded-xl border border-fd-border bg-fd-card p-3 no-underline transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/5"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/12 text-emerald-700 dark:text-emerald-400">
            <Icon className="size-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-fd-foreground">{image}</span>
            <span className="block text-xs leading-5 text-fd-muted-foreground">{concept}</span>
          </span>
        </a>
      ))}
    </nav>
  )
}
