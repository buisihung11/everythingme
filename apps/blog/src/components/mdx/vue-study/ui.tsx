import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function Figure({
  kicker,
  title,
  caption,
  children,
}: {
  kicker?: string
  title: string
  caption?: ReactNode
  children: ReactNode
}) {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-2xl border border-fd-border bg-fd-card text-fd-card-foreground shadow-sm">
      <header className="border-b border-fd-border px-5 py-3">
        {kicker ? (
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
            {kicker}
          </p>
        ) : null}
        <p className="mt-0.5 text-base font-semibold text-fd-foreground">
          {title}
        </p>
      </header>
      <div className="p-4 sm:p-5">{children}</div>
      {caption ? (
        <figcaption className="border-t border-fd-border bg-fd-muted/50 px-5 py-3 text-sm leading-6 text-fd-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}

type Tone = 'primary' | 'ghost' | 'danger'

const TONES: Record<Tone, string> = {
  primary:
    'border-emerald-700/20 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400',
  ghost:
    'border-fd-border bg-fd-background text-fd-foreground hover:bg-fd-accent',
  danger:
    'border-rose-500/30 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:text-rose-300',
}

export function DemoButton({
  tone = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        TONES[tone],
        className,
      )}
      {...props}
    />
  )
}

export function Mono({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span className={cx('font-mono text-[0.85em]', className)}>{children}</span>
  )
}

export function Pill({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border border-fd-border bg-fd-background px-2 py-0.5 text-[0.7rem] font-semibold text-fd-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  )
}

export type CodeLine = { text: string; id?: string }

/** Code shown line by line so individual lines can light up. */
export function CodeLines({
  lines,
  lineClass,
  className,
}: {
  lines: CodeLine[]
  lineClass?: (line: CodeLine, index: number) => string | undefined
  className?: string
}) {
  return (
    <div
      className={cx(
        'overflow-x-auto rounded-xl border border-fd-border bg-fd-background py-2 font-mono text-[0.75rem] leading-6',
        className,
      )}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          className={cx(
            'whitespace-pre px-3 transition-colors duration-300',
            lineClass?.(line, i),
          )}
        >
          {line.text || ' '}
        </div>
      ))}
    </div>
  )
}

export function Stat({
  label,
  value,
  tone = 'neutral',
  flash = false,
}: {
  label: string
  value: ReactNode
  tone?: 'neutral' | 'vue' | 'react' | 'warn'
  flash?: boolean
}) {
  const toneClass = {
    neutral: 'text-fd-foreground',
    vue: 'text-emerald-700 dark:text-emerald-400',
    react: 'text-sky-700 dark:text-sky-400',
    warn: 'text-amber-700 dark:text-amber-400',
  }[tone]
  return (
    <div
      className={cx(
        'rounded-lg border border-fd-border px-3 py-2 transition-colors duration-300',
        flash ? 'bg-amber-400/20' : 'bg-fd-background',
      )}
    >
      <div className="text-[0.68rem] font-medium text-fd-muted-foreground">
        {label}
      </div>
      <div className={cx('font-mono text-lg font-bold tabular-nums', toneClass)}>
        {value}
      </div>
    </div>
  )
}

export function Tabs<T extends string>({
  value,
  onChange,
  items,
  label,
}: {
  value: T
  onChange: (value: T) => void
  items: Array<{ value: T; label: ReactNode }>
  label: string
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex flex-wrap gap-1 rounded-xl border border-fd-border bg-fd-background p-1"
    >
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={item.value === value}
          onClick={() => onChange(item.value)}
          className={cx(
            'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
            item.value === value
              ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950'
              : 'text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: ReactNode
  disabled?: boolean
}) {
  return (
    <label
      className={cx(
        'inline-flex items-center gap-2 rounded-lg border border-fd-border bg-fd-background px-3 py-1.5 font-mono text-[0.78rem] font-semibold',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-emerald-600"
      />
      {label}
    </label>
  )
}

/** Light up ids for a moment; overlapping flashes of the same id stay lit until the last one ends. */
export function useFlash(duration = 900) {
  const [active, setActive] = useState<Record<string, number>>({})
  const timers = useRef<number[]>([])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((t) => window.clearTimeout(t))
  }, [])

  const flash = useCallback(
    (ids: string[], delay = 0) => {
      const start = window.setTimeout(() => {
        setActive((prev) => {
          const next = { ...prev }
          for (const id of ids) next[id] = (next[id] ?? 0) + 1
          return next
        })
        const end = window.setTimeout(() => {
          setActive((prev) => {
            const next = { ...prev }
            for (const id of ids) {
              const n = (next[id] ?? 1) - 1
              if (n <= 0) delete next[id]
              else next[id] = n
            }
            return next
          })
        }, duration)
        timers.current.push(end)
      }, delay)
      timers.current.push(start)
    },
    [duration],
  )

  const isOn = useCallback((id: string) => Boolean(active[id]), [active])
  return { flash, isOn }
}

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
