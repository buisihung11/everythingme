import { useState } from 'react'
import { Figure, cx } from './ui'

const NODES = [
  { id: 'page', label: 'pages/cart' },
  { id: 'widget', label: 'widgets/cart-summary' },
  { id: 'add', label: 'features/add-to-cart' },
  { id: 'remove', label: 'features/remove-line' },
  { id: 'product', label: 'entities/product' },
  { id: 'cart', label: 'entities/cart' },
  { id: 'ui', label: 'shared/ui' },
] as const

type Id = (typeof NODES)[number]['id']

const RANK: Record<Id, number> = {
  page: 4,
  widget: 3,
  add: 2,
  remove: 2,
  product: 1,
  cart: 1,
  ui: 0,
}

function verdict(from: Id, to: Id) {
  if (from === to) {
    return { ok: false, why: 'Một file không import barrel của chính slice nó. Dễ thành vòng import.' }
  }
  if (RANK[from] === RANK[to]) {
    return {
      ok: false,
      why: 'Hai slice cùng tầng. add-to-cart không import remove-line. Phối hợp chúng ở widget hoặc page phía trên.',
    }
  }
  if (RANK[from] > RANK[to]) {
    return {
      ok: true,
      why: 'Import xuống tầng thấp hơn, qua index.ts của slice đó. Đừng chui vào file ui/ bên trong.',
    }
  }
  return {
    ok: false,
    why: 'Import ngược lên. Entity không được biết feature. shared không được biết cart.',
  }
}

export function ImportBoundary() {
  const [from, setFrom] = useState<Id>('add')
  const [to, setTo] = useState<Id>('page')
  const result = verdict(from, to)

  return (
    <Figure
      kicker="Hình 2 · Chiều import"
      title="Chỉ import xuống. Cùng tầng thì kéo lên trên."
      caption="Trong một slice, các segment import tương đối cho nhau. Ra ngoài slice thì đi qua public API và chỉ đi xuống tầng thấp hơn. Bài tổng quan dùng cùng quy tắc này với complete-task và TaskCard."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Picker label="File này" value={from} onChange={setFrom} />
        <Picker label="muốn import" value={to} onChange={setTo} />
      </div>
      <p
        className={cx(
          'mt-3 rounded-xl border px-3 py-2 text-sm leading-6',
          result.ok
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
            : 'border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-200',
        )}
      >
        <span className="font-bold">{result.ok ? 'Được.' : 'Cấm.'} </span>
        {result.why}
      </p>
    </Figure>
  )
}

function Picker({ label, value, onChange }: { label: string; value: Id; onChange: (id: Id) => void }) {
  return (
    <label className="block text-xs font-semibold text-fd-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as Id)}
        className="mt-1 w-full rounded-lg border border-fd-border bg-fd-background px-2 py-2 font-mono text-xs text-fd-foreground"
      >
        {NODES.map((node) => (
          <option key={node.id} value={node.id}>
            {node.label}
          </option>
        ))}
      </select>
    </label>
  )
}
