import { useEffect, useRef, useState } from 'react'
import { DemoButton, Figure, cx, prefersReducedMotion } from './ui'

type Step = {
  id: string
  name: string
  phase: 'birth' | 'mount' | 'update' | 'unmount'
  react: string
  use: string
  hook?: boolean
}

const STEPS: Step[] = [
  { id: 'setup', name: 'setup()', phase: 'birth', react: 'Thân hàm component, nhưng chỉ chạy một lần', use: 'Khai báo ref, computed, watch, đăng ký các hook khác', hook: true },
  { id: 'beforeMount', name: 'onBeforeMount', phase: 'mount', react: 'Không có tương đương trực tiếp', use: 'Hiếm khi cần', hook: true },
  { id: 'render-mount', name: 'render + tạo DOM', phase: 'mount', react: 'Render + commit', use: 'Do Vue tự làm' },
  { id: 'mounted', name: 'onMounted', phase: 'mount', react: 'useEffect(fn, [])', use: 'Đo DOM, gắn thư viện ngoài, mở kết nối', hook: true },
  { id: 'beforeUpdate', name: 'onBeforeUpdate', phase: 'update', react: 'Không có tương đương trực tiếp', use: 'Đọc trạng thái DOM trước khi patch', hook: true },
  { id: 'render-update', name: 'render + patch DOM', phase: 'update', react: 'Re-render + commit', use: 'Do Vue tự làm' },
  { id: 'updated', name: 'onUpdated', phase: 'update', react: 'useEffect(fn) không có deps', use: 'Hiếm khi cần, thường watch hợp hơn', hook: true },
  { id: 'beforeUnmount', name: 'onBeforeUnmount', phase: 'unmount', react: 'Gần với cleanup của useEffect', use: 'Gỡ listener khi DOM vẫn còn', hook: true },
  { id: 'unmounted', name: 'onUnmounted', phase: 'unmount', react: 'Cleanup của useEffect(fn, [])', use: 'Đóng kết nối, xóa timer', hook: true },
]

const PHASES: Record<Step['phase'], { label: string; tone: string; ring: string }> = {
  birth: { label: '1 · Sinh ra', tone: 'text-violet-700 dark:text-violet-300', ring: 'border-violet-500 bg-violet-500/15' },
  mount: { label: '2 · Lên sóng', tone: 'text-emerald-700 dark:text-emerald-300', ring: 'border-emerald-500 bg-emerald-500/15' },
  update: { label: '3 · Thay áo (lặp lại)', tone: 'text-sky-700 dark:text-sky-300', ring: 'border-sky-500 bg-sky-500/15' },
  unmount: { label: '4 · Xuống sóng', tone: 'text-rose-700 dark:text-rose-300', ring: 'border-rose-500 bg-rose-500/15' },
}

const SEQUENCES = {
  mount: ['setup', 'beforeMount', 'render-mount', 'mounted'],
  update: ['beforeUpdate', 'render-update', 'updated'],
  unmount: ['beforeUnmount', 'unmounted'],
} as const

export function LifecycleTimeline() {
  const [mounted, setMounted] = useState(false)
  const [current, setCurrent] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const timers = useRef<number[]>([])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((t) => window.clearTimeout(t))
  }, [])

  const play = (kind: keyof typeof SEQUENCES) => {
    const seq = SEQUENCES[kind]
    const gap = prefersReducedMotion() ? 0 : 450
    setBusy(true)
    if (kind === 'mount') setLog([])
    seq.forEach((id, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setCurrent(id)
          const step = STEPS.find((s) => s.id === id)!
          setLog((l) => [...l, step.name])
        }, i * gap),
      )
    })
    timers.current.push(
      window.setTimeout(() => {
        setBusy(false)
        setMounted(kind !== 'unmount')
      }, seq.length * gap),
    )
  }

  const phases = Object.keys(PHASES) as Step['phase'][]

  return (
    <Figure
      kicker="Hình 9 · Vòng đời"
      title="Sinh ra, lên sóng, thay áo, xuống sóng"
      caption="Bấm lần lượt Mount, Đổi state vài lần, rồi Unmount. setup chỉ xuất hiện một lần trong nhật ký, còn cặp onBeforeUpdate/onUpdated lặp lại sau mỗi thay đổi. Trong thực tế bạn sẽ dùng onMounted và onUnmounted nhiều nhất. Phần còn lại thường đã có watch hoặc computed lo."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <DemoButton onClick={() => play('mount')} disabled={busy || mounted}>Mount</DemoButton>
        <DemoButton tone="ghost" onClick={() => play('update')} disabled={busy || !mounted}>Đổi state</DemoButton>
        <DemoButton tone="danger" onClick={() => play('unmount')} disabled={busy || !mounted}>Unmount</DemoButton>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {phases.map((phase) => (
          <section key={phase} className="min-w-0 rounded-xl border border-fd-border bg-fd-background p-2.5">
            <p className={cx('mb-2 text-xs font-bold', PHASES[phase].tone)}>{PHASES[phase].label}</p>
            <ol className="space-y-1.5">
              {STEPS.filter((s) => s.phase === phase).map((s) => (
                <li
                  key={s.id}
                  className={cx(
                    'rounded-lg border px-2.5 py-1.5 transition-colors duration-300',
                    current === s.id ? PHASES[phase].ring : 'border-transparent',
                    !s.hook && 'border-dashed',
                  )}
                >
                  <p className={cx('font-mono text-[0.78rem] font-bold', s.hook ? 'text-fd-foreground' : 'text-fd-muted-foreground')}>{s.name}</p>
                  <p className="text-[0.7rem] leading-4 text-fd-muted-foreground">React: {s.react}</p>
                  <p className="text-[0.7rem] leading-4 text-fd-muted-foreground">Dùng để: {s.use}</p>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-fd-border bg-fd-background p-3">
        <p className="text-xs font-semibold text-fd-muted-foreground">Nhật ký</p>
        <p className="mt-1 min-h-6 font-mono text-[0.75rem] leading-6 text-fd-foreground">
          {log.length ? log.join(' → ') : 'Chưa có gì. Bấm Mount để bắt đầu.'}
        </p>
      </div>
    </Figure>
  )
}
