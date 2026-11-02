import { useState } from 'react'
import { DemoButton, Figure, cx } from './ui'

export function StoreToRefsTrap() {
  const [count, setCount] = useState(0)
  const [peeled, setPeeled] = useState(0)
  const [live, setLive] = useState(0)

  const increment = () => {
    const next = count + 1
    setCount(next)
    setLive(next)
  }

  const destructure = () => setPeeled(count)

  return (
    <Figure
      kicker="Hình 3 · storeToRefs"
      title="Destructure store là lấy số ra khỏi reactive"
      caption="Store là reactive. const { count } = store chụp số tại thời điểm đó. storeToRefs trả ref cho state và getter, bỏ qua action. Action destructure trực tiếp vẫn gọi được vì nó đã bind vào store."
    >
      <div className="grid gap-2 sm:grid-cols-3">
        <Box label="store.count" value={count} tone="live" />
        <Box label="const { count } = store" value={peeled} tone="stuck" />
        <Box label="storeToRefs" value={live} tone="live" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <DemoButton onClick={increment}>increment()</DemoButton>
        <DemoButton tone="ghost" onClick={destructure}>
          destructure lại
        </DemoButton>
      </div>
      <p className="mt-3 text-sm leading-6 text-fd-muted-foreground">
        increment() tăng store. Ô giữa đứng yên cho tới khi bạn destructure lại, rồi lại đứng yên. Ô storeToRefs đi theo store. Template nên đọc store.count hoặc ref từ storeToRefs.
      </p>
    </Figure>
  )
}

function Box({ label, value, tone }: { label: string; value: number; tone: 'live' | 'stuck' }) {
  return (
    <div
      className={cx(
        'rounded-xl border px-3 py-2',
        tone === 'live' ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-rose-500/30 bg-rose-500/10',
      )}
    >
      <div className="text-[0.68rem] text-fd-muted-foreground">{label}</div>
      <div className="font-mono text-2xl font-bold tabular-nums">{value}</div>
    </div>
  )
}
