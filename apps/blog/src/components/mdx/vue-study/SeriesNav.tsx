import Link from 'fumadocs-core/link'
import { Check, Clock } from 'lucide-react'
import { cx } from './ui'
import { VUE_STUDY_HOME, VUE_STUDY_LESSONS, lessonHref } from './series'

export function SeriesNav({ current }: { current?: string }) {
  const published = VUE_STUDY_LESSONS.filter((l) => l.status === 'published')
  return (
    <nav
      aria-label="Vue Study series"
      className="not-prose my-8 rounded-2xl border border-fd-border bg-fd-card p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Link
          href={VUE_STUDY_HOME}
          className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-emerald-700 no-underline hover:underline dark:text-emerald-400"
        >
          Series · Vue Study
        </Link>
        <span className="text-xs text-fd-muted-foreground">
          {published.length}/{VUE_STUDY_LESSONS.length} bài đã xuất bản
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-fd-muted">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{
            width: `${(published.length / VUE_STUDY_LESSONS.length) * 100}%`,
          }}
        />
      </div>
      <ol className="mt-4 grid gap-2">
        {VUE_STUDY_LESSONS.map((lesson, i) => {
          const isCurrent = lesson.slug === current
          const isPublished = lesson.status === 'published'
          const body = (
            <>
              <span
                className={cx(
                  'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                  isCurrent
                    ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-emerald-950'
                    : isPublished
                      ? 'border-emerald-500/50 text-emerald-700 dark:text-emerald-400'
                      : 'border-fd-border text-fd-muted-foreground',
                )}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span
                    className={cx(
                      'font-semibold',
                      isPublished ? 'text-fd-foreground' : 'text-fd-muted-foreground',
                    )}
                  >
                    {lesson.title}
                  </span>
                  {isCurrent ? (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-700 dark:text-emerald-300">
                      Bạn đang ở đây
                    </span>
                  ) : isPublished ? (
                    <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-label="Đã xuất bản" />
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[0.65rem] font-semibold text-fd-muted-foreground">
                      <Clock className="size-3" aria-hidden /> Sắp ra mắt
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-fd-muted-foreground">
                  {lesson.summary}
                </span>
              </span>
            </>
          )
          const rowClass = cx(
            'flex items-start gap-3 rounded-xl border px-3 py-2.5 no-underline transition-colors',
            isCurrent
              ? 'border-emerald-500/40 bg-emerald-500/5'
              : 'border-transparent',
            isPublished && !isCurrent && 'hover:border-fd-border hover:bg-fd-accent',
          )
          return (
            <li key={lesson.slug}>
              {isPublished && !isCurrent ? (
                <Link href={lessonHref(lesson.slug)} className={rowClass}>
                  {body}
                </Link>
              ) : (
                <div className={rowClass} aria-current={isCurrent ? 'page' : undefined}>
                  {body}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
