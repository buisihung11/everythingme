import { useState } from 'react'
import { CodeLines, DemoButton, Figure, Mono, cx, useFlash } from './ui'

type Key = 'name' | 'price' | 'stock'
type Effect = 'render' | 'title' | 'watch'
type Product = { name: string; price: number; stock: number }

const KEYS: Key[] = ['name', 'price', 'stock']
const EFFECTS: Array<{ id: Effect; label: string; tone: string }> = [
  { id: 'render', label: 'render', tone: 'border-emerald-500/60 text-emerald-800 dark:text-emerald-300' },
  { id: 'title', label: 'watchEffect', tone: 'border-sky-500/60 text-sky-800 dark:text-sky-300' },
  { id: 'watch', label: 'watch', tone: 'border-violet-500/60 text-violet-800 dark:text-violet-300' },
]

const INITIAL: Product = { name: 'Áo thun', price: 120, stock: 2 }

function depsOf(effect: Effect, p: Product): Key[] {
  if (effect === 'render') return ['name', 'price']
  if (effect === 'title') return p.stock > 0 ? ['stock', 'price'] : ['stock']
  return ['stock']
}

const titleOf = (p: Product) => (p.stock > 0 ? `${p.price}k` : 'Hết hàng')

const CODE = [
  { text: 'const product = reactive({' },
  { text: "  name: 'Áo thun', price: 120, stock: 2," },
  { text: '})' },
  { text: '' },
  { text: '<!-- effect render -->', id: 'render' },
  { text: '<p>{{ product.name }} · {{ product.price }}k</p>', id: 'render' },
  { text: '' },
  { text: 'watchEffect(() => {', id: 'title' },
  { text: '  document.title = product.stock > 0', id: 'title' },
  { text: '    ? `${product.price}k`', id: 'title' },
  { text: "    : 'Hết hàng'", id: 'title' },
  { text: '})', id: 'title' },
  { text: '' },
  { text: 'watch(() => product.stock, notifyWarehouse)', id: 'watch' },
]

type Ghost = { key: Key; effect: Effect }

export function TrackTriggerMap() {
  const [mounted, setMounted] = useState(false)
  const [product, setProduct] = useState<Product>(INITIAL)
  const [runs, setRuns] = useState<Record<Effect, number>>({ render: 0, title: 0, watch: 0 })
  const [ghosts, setGhosts] = useState<Ghost[]>([])
  const [log, setLog] = useState<string[]>([])
  const { flash, isOn } = useFlash(1100)

  const mount = () => {
    setMounted(true)
    setRuns({ render: 1, title: 1, watch: 1 })
    setGhosts([])
    setLog([
      'render chạy lần đầu: get name, get price → track hai lần',
      'watchEffect chạy lần đầu: get stock, get price → track',
      'watch chạy getter: get stock → track',
    ])
    flash(['row-name', 'row-price', 'row-stock', 'chip-render', 'chip-title', 'chip-watch', 'map'])
  }

  const mutate = <K extends Key>(key: K, value: Product[K], code: string) => {
    const next = { ...product, [key]: value }
    const subscribers = EFFECTS.map((e) => e.id).filter((e) => depsOf(e, product).includes(key))
    const lines = [`${code} → trigger(product, '${key}')`]
    const removed: Ghost[] = []
    const nextRuns = { ...runs }

    if (subscribers.length === 0) {
      lines.push(`Dep của '${key}' đang trống: không ai đọc, không ai phải chạy lại`)
    } else {
      lines.push(`Tra sổ: targetMap → product → '${key}' → Dep { ${subscribers.join(', ')} }`)
    }

    for (const e of subscribers) {
      nextRuns[e] += 1
      const before = depsOf(e, product)
      const after = depsOf(e, next)
      lines.push(`${e} chạy lại, lần này đọc: ${after.join(', ')}`)
      for (const k of before.filter((k) => !after.includes(k))) {
        removed.push({ key: k, effect: e })
        lines.push(`${e} không đọc '${k}' nữa → bị gỡ khỏi Dep của '${k}'`)
      }
      for (const k of after.filter((k) => !before.includes(k))) {
        lines.push(`${e} bắt đầu đọc '${k}' → được ghi thêm vào Dep của '${k}'`)
        flash([`row-${k}`, `chip-${e}-${k}`], 250)
      }
    }

    setProduct(next)
    setRuns(nextRuns)
    setGhosts(removed)
    setLog(lines)
    flash([`row-${key}`, ...subscribers.map((e) => `chip-${e}`)])
  }

  const reset = () => {
    setMounted(false)
    setProduct(INITIAL)
    setRuns({ render: 0, title: 0, watch: 0 })
    setGhosts([])
    setLog([])
  }

  const activeCode = (id?: string) =>
    id && EFFECTS.some((e) => e.id === id && isOn(`chip-${e.id}`)) ? 'bg-amber-400/20' : undefined

  return (
    <Figure
      kicker="Hình 2 · track và trigger"
      title="Cuốn sổ ba tầng: WeakMap → Map → Dep"
      caption={
        <>
          Bấm <strong>Mount</strong> để các effect chạy lần đầu và ghi tên vào sổ. Sau đó
          giảm <code>stock</code> hai lần về 0: watchEffect chạy lại, không còn đọc{' '}
          <code>price</code> nữa nên bị gỡ khỏi sổ của <code>price</code>. Giờ tăng{' '}
          <code>price</code>: chỉ render chạy lại. Sổ được viết lại sau mỗi lần một effect
          chạy, nên nó luôn khớp với những gì effect thực sự đọc.
        </>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <DemoButton onClick={mount} disabled={mounted}>Mount</DemoButton>
        <DemoButton tone="ghost" disabled={!mounted} onClick={() => mutate('price', product.price + 10, 'product.price += 10')}>
          product.price += 10
        </DemoButton>
        <DemoButton tone="ghost" disabled={!mounted || product.stock === 0} onClick={() => mutate('stock', product.stock - 1, 'product.stock--')}>
          product.stock--
        </DemoButton>
        <DemoButton tone="ghost" disabled={!mounted || product.stock === 2} onClick={() => mutate('stock', 2, 'product.stock = 2')}>
          product.stock = 2
        </DemoButton>
        <DemoButton
          tone="ghost"
          disabled={!mounted}
          onClick={() => mutate('name', product.name === 'Áo thun' ? 'Áo polo' : 'Áo thun', `product.name = '${product.name === 'Áo thun' ? 'Áo polo' : 'Áo thun'}'`)}
        >
          đổi product.name
        </DemoButton>
        <DemoButton tone="ghost" disabled={!mounted} onClick={reset}>Làm lại</DemoButton>
      </div>

      <div className="grid gap-4">
        <div className="min-w-0 space-y-3">
          <CodeLines lines={CODE} lineClass={(l) => activeCode(l.id)} />
          <div className="grid gap-2 sm:grid-cols-3">
            {EFFECTS.map((e) => (
              <div
                key={e.id}
                className={cx(
                  'rounded-xl border p-2.5 transition-colors duration-300',
                  isOn(`chip-${e.id}`) ? 'border-amber-500 bg-amber-400/15' : 'border-fd-border bg-fd-background',
                )}
              >
                <p className="font-mono text-xs font-bold text-fd-foreground">{e.label}</p>
                <p className="text-[0.7rem] text-fd-muted-foreground">đã chạy {runs[e.id]}×</p>
                <p className="mt-1 truncate font-mono text-[0.72rem] text-fd-foreground">
                  {!mounted
                    ? '—'
                    : e.id === 'render'
                      ? `${product.name} · ${product.price}k`
                      : e.id === 'title'
                        ? `title: ${titleOf(product)}`
                        : `báo kho ${runs.watch - 1}×`}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          <div
            className={cx(
              'rounded-2xl border-2 border-dashed p-3 transition-colors duration-300',
              isOn('map') ? 'border-amber-500 bg-amber-400/10' : 'border-fd-border bg-fd-background',
            )}
          >
            <p className="font-mono text-[0.72rem] font-bold text-fd-muted-foreground">targetMap: WeakMap</p>
            <div className="mt-2 rounded-xl border border-fd-border bg-fd-card p-2.5">
              <p className="font-mono text-[0.72rem] font-bold text-violet-700 dark:text-violet-300">
                product (object gốc) → depsMap: Map
              </p>
              <ul className="mt-2 space-y-1.5">
                {KEYS.map((k) => {
                  const subs = mounted ? EFFECTS.filter((e) => depsOf(e.id, product).includes(k)) : []
                  const gone = ghosts.filter((g) => g.key === k)
                  return (
                    <li
                      key={k}
                      className={cx(
                        'flex flex-wrap items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-colors duration-300',
                        isOn(`row-${k}`) ? 'border-amber-500 bg-amber-400/15' : 'border-fd-border bg-fd-background',
                      )}
                    >
                      <span className="w-14 shrink-0 font-mono text-[0.75rem] font-bold text-fd-foreground">'{k}'</span>
                      <span className="font-mono text-[0.7rem] text-fd-muted-foreground">→ Dep</span>
                      {subs.length === 0 && gone.length === 0 ? (
                        <span className="font-mono text-[0.7rem] italic text-fd-muted-foreground">trống</span>
                      ) : null}
                      {subs.map((e) => (
                        <span
                          key={e.id}
                          className={cx(
                            'rounded-md border px-1.5 py-0.5 font-mono text-[0.7rem] font-semibold transition-colors duration-300',
                            e.tone,
                            isOn(`chip-${e.id}`) || isOn(`chip-${e.id}-${k}`) ? 'bg-amber-400/25' : 'bg-fd-card',
                          )}
                        >
                          {e.label}
                        </span>
                      ))}
                      {gone.map((g) => (
                        <span
                          key={`gone-${g.effect}`}
                          className="rounded-md border border-dashed border-rose-500/60 px-1.5 py-0.5 font-mono text-[0.7rem] text-rose-700 line-through dark:text-rose-300"
                        >
                          {EFFECTS.find((e) => e.id === g.effect)?.label} · vừa gỡ
                        </span>
                      ))}
                    </li>
                  )
                })}
              </ul>
            </div>
            <p className="mt-2 text-[0.7rem] leading-5 text-fd-muted-foreground">
              WeakMap: object bị thu gom thì phần sổ của nó cũng tự biến mất.
            </p>
          </div>

          <div className="rounded-xl border border-fd-border bg-fd-background p-3" aria-live="polite">
            <p className="text-xs font-semibold text-fd-muted-foreground">Chuyện gì vừa xảy ra</p>
            {log.length ? (
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-[0.8rem] leading-5 text-fd-foreground">
                {log.map((line) => <li key={line}>{line}</li>)}
              </ol>
            ) : (
              <p className="mt-2 text-sm text-fd-muted-foreground">
                Sổ đang trống vì chưa effect nào chạy. Bấm <Mono>Mount</Mono>.
              </p>
            )}
          </div>
        </div>
      </div>
    </Figure>
  )
}
