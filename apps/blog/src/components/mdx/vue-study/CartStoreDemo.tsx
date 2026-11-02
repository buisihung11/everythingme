import { useState } from 'react'
import { DemoButton, Figure, cx } from './ui'

type Line = { id: string; name: string; price: number; qty: number }

const CATALOG: Line[] = [
  { id: 'ca-phe', name: 'Cà phê', price: 35, qty: 1 },
  { id: 'tra', name: 'Trà', price: 30, qty: 1 },
  { id: 'banh', name: 'Bánh', price: 20, qty: 1 },
]

export function CartStoreDemo() {
  const [lines, setLines] = useState<Line[]>([{ ...CATALOG[0] }])

  const count = lines.reduce((sum, line) => sum + line.qty, 0)
  const total = lines.reduce((sum, line) => sum + line.price * line.qty, 0)

  const add = (item: Line) => {
    setLines((prev) => {
      const found = prev.find((line) => line.id === item.id)
      if (!found) return [...prev, { ...item }]
      return prev.map((line) => (line.id === item.id ? { ...line, qty: line.qty + 1 } : line))
    })
  }

  return (
    <Figure
      kicker="Hình 2 · Setup store"
      title="Header và trang cart đọc cùng một store"
      caption="ref trong setup store là state, computed là getter, function là action. Pinia bắt return mọi state. Hai component gọi useCartStore() ra cùng một bản, nên badge đổi khi trang cart thêm món."
    >
      <div className="grid gap-3 xl:grid-cols-2">
        <section className="rounded-xl border border-fd-border bg-fd-background p-3">
          <header className="flex items-center justify-between">
            <p className="text-sm font-semibold">Header</p>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300">
              giỏ · {count}
            </span>
          </header>
          <p className="mt-2 font-mono text-[0.72rem] leading-5 text-fd-muted-foreground">
            store.count
            <br />
            computed từ items
          </p>
        </section>

        <section className="rounded-xl border border-fd-border bg-fd-background p-3">
          <p className="text-sm font-semibold">CartPage</p>
          <ul className="mt-2 space-y-1">
            {lines.map((line) => (
              <li key={line.id} className="flex justify-between font-mono text-xs">
                <span>
                  {line.name} × {line.qty}
                </span>
                <span>{line.price * line.qty}k</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 border-t border-fd-border pt-2 font-mono text-sm font-bold">total {total}k</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CATALOG.map((item) => (
              <DemoButton key={item.id} tone="ghost" onClick={() => add(item)}>
                + {item.name}
              </DemoButton>
            ))}
          </div>
        </section>
      </div>
      <p className={cx('mt-3 font-mono text-[0.72rem] leading-5 text-fd-muted-foreground')}>
        defineStore('cart', () =&gt; {'{'} items, count, total, add {'}'})
      </p>
    </Figure>
  )
}
