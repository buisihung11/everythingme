import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { DemoButton, Figure, Mono, cx } from './ui'

type Source = 'price' | 'qty' | 'note'
type NodeId = Source | 'subtotal' | 'shipping' | 'total' | 'render' | 'watch'
type Status = 'idle' | 'changed' | 'recomputed' | 'same' | 'cached' | 'ran'

type Sources = { price: number; qty: number; note: string }
type Derived = { subtotal: number; shipping: number; total: number }

const FREE_SHIPPING_FROM = 300
const SHIPPING_FEE = 30

const COMPUTED: Array<{ id: keyof Derived; deps: NodeId[]; fn: (s: Sources, d: Derived) => number }> = [
  { id: 'subtotal', deps: ['price', 'qty'], fn: (s) => s.price * s.qty },
  { id: 'shipping', deps: ['subtotal'], fn: (_, d) => (d.subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE) },
  { id: 'total', deps: ['subtotal', 'shipping'], fn: (_, d) => d.subtotal + d.shipping },
]
const RENDER_DEPS: NodeId[] = ['shipping', 'total', 'note']
const WATCH_DEPS: NodeId[] = ['total']

const LAYOUT: Record<NodeId, { x: number; y: number; kind: string }> = {
  note: { x: 10, y: 24, kind: 'ref' },
  price: { x: 10, y: 134, kind: 'ref' },
  qty: { x: 10, y: 234, kind: 'ref' },
  subtotal: { x: 215, y: 184, kind: 'computed' },
  shipping: { x: 420, y: 134, kind: 'computed' },
  total: { x: 420, y: 240, kind: 'computed' },
  render: { x: 625, y: 60, kind: 'template' },
  watch: { x: 625, y: 220, kind: 'watch(total)' },
}
const W = 150
const H = 62

const EDGES: Array<[NodeId, NodeId]> = [
  ['price', 'subtotal'],
  ['qty', 'subtotal'],
  ['subtotal', 'shipping'],
  ['subtotal', 'total'],
  ['shipping', 'total'],
  ['shipping', 'render'],
  ['total', 'render'],
  ['note', 'render'],
  ['total', 'watch'],
]

const STATUS_STYLE: Record<Status, string> = {
  idle: 'fill-fd-background stroke-fd-border',
  changed: 'fill-amber-100 stroke-amber-500 dark:fill-amber-500/20',
  recomputed: 'fill-emerald-100 stroke-emerald-500 dark:fill-emerald-500/20',
  same: 'fill-slate-100 stroke-slate-400 dark:fill-slate-500/20',
  cached: 'fill-fd-background stroke-fd-border',
  ran: 'fill-sky-100 stroke-sky-500 dark:fill-sky-500/20',
}

const STATUS_LABEL: Partial<Record<Status, string>> = {
  changed: 'vừa đổi',
  recomputed: 'tính lại',
  same: 'tính lại, giá trị giữ nguyên',
  cached: 'dùng cache',
  ran: 'vừa chạy',
}

const k = (n: number) => `${n}k`

function derive(s: Sources): Derived {
  const d = { subtotal: 0, shipping: 0, total: 0 }
  for (const c of COMPUTED) d[c.id] = c.fn(s, d)
  return d
}

type Run = { statuses: Partial<Record<NodeId, Status>>; steps: string[]; seq: number }

const INITIAL: Sources = { price: 120, qty: 2, note: 'Giao giờ hành chính' }

export function ReactiveSpreadsheet() {
  const [sources, setSources] = useState<Sources>(INITIAL)
  const [derived, setDerived] = useState<Derived>(() => derive(INITIAL))
  const [runs, setRuns] = useState<Record<NodeId, number>>({
    price: 0, qty: 0, note: 0, subtotal: 1, shipping: 1, total: 1, render: 1, watch: 0,
  })
  const [run, setRun] = useState<Run>({ statuses: {}, steps: [], seq: 0 })
  const [saved, setSaved] = useState<number | null>(null)

  const set = <K extends Source>(key: K, value: Sources[K]) => {
    if (sources[key] === value) return
    const nextSources = { ...sources, [key]: value }
    const statuses: Partial<Record<NodeId, Status>> = { [key]: 'changed' }
    const changed = new Set<NodeId>([key])
    const steps = [`${key}.value = ${JSON.stringify(value)}: trigger, báo cho những ai đã đọc ${key}`]
    const nextDerived = { ...derived }
    const nextRuns = { ...runs }

    for (const c of COMPUTED) {
      if (!c.deps.some((d) => changed.has(d))) {
        statuses[c.id] = 'cached'
        continue
      }
      const prev = derived[c.id]
      const next = c.fn(nextSources, nextDerived)
      nextDerived[c.id] = next
      nextRuns[c.id] += 1
      if (next !== prev) {
        changed.add(c.id)
        statuses[c.id] = 'recomputed'
        steps.push(`${c.id} tính lại: ${k(prev)} → ${k(next)}`)
      } else {
        statuses[c.id] = 'same'
        steps.push(`${c.id} tính lại nhưng vẫn là ${k(next)}, nên không báo tiếp cho ai`)
      }
    }

    const cachedIds = COMPUTED.filter((c) => statuses[c.id] === 'cached').map((c) => c.id)
    if (cachedIds.length) steps.push(`${cachedIds.join(', ')}: không phụ thuộc ${key}, dùng lại cache`)

    if (RENDER_DEPS.some((d) => changed.has(d))) {
      statuses.render = 'ran'
      nextRuns.render += 1
      steps.push('template render lại và patch đúng những chỗ trên DOM đã đổi')
    }
    if (WATCH_DEPS.some((d) => changed.has(d))) {
      statuses.watch = 'ran'
      nextRuns.watch += 1
      steps.push(`watch(total) chạy side effect: lưu giỏ hàng với tổng ${k(nextDerived.total)}`)
      setSaved(nextDerived.total)
    }

    setSources(nextSources)
    setDerived(nextDerived)
    setRuns(nextRuns)
    setRun({ statuses, steps, seq: run.seq + 1 })
  }

  const value = (id: NodeId): string => {
    if (id === 'price' || id === 'qty') return id === 'price' ? k(sources.price) : String(sources.qty)
    if (id === 'note') return sources.note.length > 14 ? `${sources.note.slice(0, 13)}…` : sources.note || '""'
    if (id === 'render') return `chạy ${runs.render}×`
    if (id === 'watch') return `chạy ${runs.watch}×`
    return k(derived[id])
  }

  const edgeActive = (from: NodeId, to: NodeId) => {
    const a = run.statuses[from]
    const b = run.statuses[to]
    return (a === 'changed' || a === 'recomputed') && (b === 'recomputed' || b === 'same' || b === 'ran')
  }

  return (
    <Figure
      kicker="Hình 4 · Vue là một bảng tính"
      title="ref là ô dữ liệu, computed là ô công thức, template và watch là người đọc"
      caption={
        <>
          Thử ba thao tác theo thứ tự. Đầu tiên tăng <code>qty</code> lên 3: subtotal
          vượt 300k nên phí ship về 0. Sau đó tăng <code>price</code>: shipping được
          tính lại nhưng vẫn là 0, nên nó không báo tiếp cho ai. Cuối cùng sửa{' '}
          <code>note</code>: cả ba computed đều dùng cache, chỉ có template render lại.
          Mỗi ô computed có số lần đã chạy, nhờ đó bạn thấy được cache hoạt động.
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Stepper label="price (ref)" value={sources.price} display={k(sources.price)} step={10} min={10}
          onChange={(v) => set('price', v)} />
        <Stepper label="qty (ref)" value={sources.qty} display={String(sources.qty)} step={1} min={1}
          onChange={(v) => set('qty', v)} />
        <label className="block rounded-xl border border-fd-border bg-fd-background p-2.5">
          <span className="text-[0.68rem] font-semibold text-fd-muted-foreground">note (ref)</span>
          <input
            value={sources.note}
            onChange={(e) => set('note', e.target.value)}
            className="mt-1 w-full rounded-md border border-fd-border bg-fd-card px-2 py-1 text-sm text-fd-foreground outline-none focus:border-emerald-500"
          />
        </label>
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg viewBox="0 0 785 312" className="min-w-[560px]" role="img"
          aria-label="Đồ thị phụ thuộc: price và qty tạo subtotal; subtotal tạo shipping và total; template đọc shipping, total, note; watch theo dõi total">
          <defs>
            <marker id="vs-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="fill-fd-muted-foreground/60" />
            </marker>
            <marker id="vs-arrow-on" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="fill-emerald-500" />
            </marker>
          </defs>
          {[
            ['Dữ liệu (ref)', 10],
            ['Công thức (computed)', 215],
            ['', 420],
            ['Người đọc', 625],
          ].map(([t, x]) => (
            <text key={String(x)} x={Number(x)} y={12} className="fill-fd-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
              {t}
            </text>
          ))}
          {EDGES.map(([from, to]) => {
            const a = LAYOUT[from]
            const b = LAYOUT[to]
            const x1 = a.x + W
            const y1 = a.y + H / 2
            const x2 = b.x
            const y2 = b.y + H / 2
            const sameCol = a.x === b.x
            const d = sameCol
              ? `M${a.x + W / 2},${a.y + H} L${b.x + W / 2},${b.y}`
              : `M${x1},${y1} C${x1 + 55},${y1} ${x2 - 55},${y2} ${x2 - 2},${y2}`
            const on = edgeActive(from, to)
            return (
              <path
                key={`${from}-${to}-${on ? run.seq : 'off'}`}
                d={d}
                fill="none"
                markerEnd={on ? 'url(#vs-arrow-on)' : 'url(#vs-arrow)'}
                className={cx(
                  'transition-colors',
                  on ? 'stroke-emerald-500 [stroke-dasharray:6_4] motion-safe:animate-[vs-dash_0.8s_linear_infinite]' : 'stroke-fd-muted-foreground/35',
                )}
                strokeWidth={on ? 2.25 : 1.5}
              />
            )
          })}
          {(Object.keys(LAYOUT) as NodeId[]).map((id) => {
            const { x, y, kind } = LAYOUT[id]
            const status = run.statuses[id] ?? 'idle'
            const count = id in derived ? runs[id] : null
            return (
              <g key={id}>
                <rect
                  x={x} y={y} width={W} height={H} rx={12}
                  className={cx('transition-colors duration-500', STATUS_STYLE[status])}
                  strokeWidth={status === 'idle' || status === 'cached' ? 1.25 : 2}
                  strokeDasharray={status === 'same' ? '5 4' : undefined}
                />
                <text x={x + 12} y={y + 19} className="fill-fd-foreground font-mono text-[12px] font-bold">{id === 'render' ? 'template' : id === 'watch' ? 'watch' : id}</text>
                <text x={x + W - 12} y={y + 19} textAnchor="end" className="fill-fd-muted-foreground font-mono text-[9.5px]">{kind}</text>
                <text x={x + 12} y={y + 40} className="fill-fd-foreground font-mono text-[15px] font-semibold">{value(id)}</text>
                <text x={x + 12} y={y + 55} className="fill-fd-muted-foreground text-[9.5px]">
                  {STATUS_LABEL[status] ?? (count !== null ? `đã chạy ${count}×` : '')}
                  {STATUS_LABEL[status] && count !== null ? ` · ${count}×` : ''}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="rounded-xl border border-fd-border bg-fd-background p-3">
          <p className="text-xs font-semibold text-fd-muted-foreground">Chuyện gì vừa xảy ra</p>
          {run.steps.length ? (
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-fd-foreground">
              {run.steps.map((s) => <li key={`${run.seq}-${s}`}>{s}</li>)}
            </ol>
          ) : (
            <p className="mt-2 text-sm text-fd-muted-foreground">Đổi một ô dữ liệu ở trên để xem thay đổi lan qua đồ thị.</p>
          )}
        </div>
        <div className="rounded-xl border border-fd-border bg-fd-background p-3">
          <p className="text-xs font-semibold text-fd-muted-foreground">Màn hình (template render ra)</p>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-fd-muted-foreground">Phí ship</dt>
            <dd className="text-right font-mono">{derived.shipping === 0 ? 'Miễn phí' : k(derived.shipping)}</dd>
            <dt className="text-fd-muted-foreground">Tổng</dt>
            <dd className="text-right font-mono font-bold">{k(derived.total)}</dd>
            <dt className="text-fd-muted-foreground">Ghi chú</dt>
            <dd className="truncate text-right">{sources.note || '—'}</dd>
          </dl>
          <p className="mt-2 border-t border-fd-border pt-2 text-xs text-fd-muted-foreground">
            watch đã lưu: <Mono>{saved === null ? 'chưa lần nào' : k(saved)}</Mono>
          </p>
        </div>
      </div>
      <style>{'@keyframes vs-dash { to { stroke-dashoffset: -20; } }'}</style>
    </Figure>
  )
}

function Stepper({
  label, value, display, step, min, onChange,
}: {
  label: string; value: number; display: string; step: number; min: number; onChange: (v: number) => void
}) {
  return (
    <div className="rounded-xl border border-fd-border bg-fd-background p-2.5">
      <span className="text-[0.68rem] font-semibold text-fd-muted-foreground">{label}</span>
      <div className="mt-1 flex items-center justify-between gap-2">
        <DemoButton tone="ghost" aria-label={`Giảm ${label}`} disabled={value - step < min} onClick={() => onChange(value - step)} className="px-2">
          <Minus className="size-3.5" aria-hidden />
        </DemoButton>
        <span className="font-mono text-lg font-bold tabular-nums">{display}</span>
        <DemoButton tone="ghost" aria-label={`Tăng ${label}`} onClick={() => onChange(value + step)} className="px-2">
          <Plus className="size-3.5" aria-hidden />
        </DemoButton>
      </div>
    </div>
  )
}
