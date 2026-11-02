import { useState } from 'react'
import { DemoButton, Figure, cx } from './ui'

const IDS = ['1', '2', '3']

export function ParamWatchTrap() {
  const [id, setId] = useState('1')
  const [getterRuns, setGetterRuns] = useState(0)
  const [assigned, setAssigned] = useState<string | null>(null)

  const push = (next: string) => {
    if (next === id) return
    setId(next)
    setGetterRuns((n) => n + 1)
    setAssigned(null)
  }

  const mutate = () => setAssigned('9')

  return (
    <Figure
      kicker="Hình 1 · Params"
      title="watch cần getter. Gán params không đổi URL."
      caption="Từ /users/1 sang /users/2, Vue Router giữ nguyên instance. beforeEnter không chạy lại. watch(() => route.params.id) thì chạy. watch(route.params.id) nhận một string, không có gì để theo."
    >
      <div className="flex flex-wrap gap-2">
        {IDS.map((next) => (
          <DemoButton key={next} tone={next === id ? 'primary' : 'ghost'} onClick={() => push(next)}>
            /users/{next}
          </DemoButton>
        ))}
        <DemoButton tone="danger" onClick={mutate}>
          gán params.id = 9
        </DemoButton>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Stat label="URL" value={`/users/${id}`} />
        <Stat label="watch(params.id)" value="0 lần" bad />
        <Stat label="watch(() => params.id)" value={`${getterRuns} lần`} />
      </div>

      <p
        className={cx(
          'mt-3 text-sm leading-6',
          assigned ? 'text-amber-800 dark:text-amber-300' : 'text-fd-muted-foreground',
        )}
      >
        {assigned
          ? `Đã gán route.params.id = '${assigned}' trong bộ nhớ giả. URL vẫn /users/${id}. Muốn đổi id thì router.push.`
          : 'Bấm một id khác. Chỉ watcher dùng getter tăng số lần chạy. Lazy route: component: () => import("./UserPage.vue").'}
      </p>
    </Figure>
  )
}

function Stat({ label, value, bad = false }: { label: string; value: string; bad?: boolean }) {
  return (
    <div
      className={cx(
        'rounded-lg border px-3 py-2',
        bad ? 'border-rose-500/30 bg-rose-500/10' : 'border-fd-border bg-fd-background',
      )}
    >
      <div className="text-[0.68rem] text-fd-muted-foreground">{label}</div>
      <div className="font-mono text-sm font-bold">{value}</div>
    </div>
  )
}
