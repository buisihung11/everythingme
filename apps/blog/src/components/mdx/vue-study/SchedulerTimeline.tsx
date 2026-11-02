import { useEffect, useRef, useState } from 'react'
import { Pause, Play, StepForward } from 'lucide-react'
import { CodeLines, DemoButton, Figure, Tabs, cx, prefersReducedMotion } from './ui'

type Flush = 'pre' | 'post' | 'sync'
type Lane = 'stack' | 'flush' | 'after'

type Step = {
  lane: Lane
  text: string
  line: number
  count: number
  dom: string
  queue: string[]
  log?: string
  skip?: boolean
}

const LANES: Array<{ id: Lane; label: string; hint: string }> = [
  { id: 'stack', label: '1 · Code đồng bộ', hint: 'handler đang chạy' },
  { id: 'flush', label: '2 · Flush (microtask)', hint: 'Vue xử lý hàng đợi' },
  { id: 'after', label: '3 · Sau flush', hint: 'nextTick resolve' },
]

function buildSteps(flush: Flush): Step[] {
  const steps: Step[] = []
  const watcherJob = flush === 'sync' ? [] : [`watcher (${flush})`]
  const queueFull = flush === 'pre' ? [...watcherJob, 'render'] : ['render', ...watcherJob]
  for (let i = 1; i <= 3; i++) {
    const first = i === 1
    steps.push({
      lane: 'stack',
      line: i,
      count: i,
      dom: '0',
      queue: queueFull,
      text: first
        ? `count = 1 → trigger: đưa ${flush === 'sync' ? 'job render' : 'job render và job watcher'} vào hàng đợi`
        : `count = ${i} → trigger: job đã có trong hàng đợi, bỏ qua`,
      skip: !first,
    })
    if (flush === 'sync') {
      steps.push({
        lane: 'stack',
        line: i,
        count: i,
        dom: '0',
        queue: queueFull,
        text: `watcher sync chạy ngay: cb(${i}), DOM vẫn là "0"`,
        log: `watch: count=${i}, DOM="0"`,
      })
    }
  }
  steps.push({ lane: 'stack', line: 4, count: 3, dom: '0', queue: queueFull, text: 'Đọc DOM: chưa flush nên vẫn là "0"', log: 'log 1: "0"' })
  steps.push({ lane: 'stack', line: 5, count: 3, dom: '0', queue: queueFull, text: 'await nextTick(): handler tạm dừng, chờ chuyến xe chạy' })

  const watcherStep = (dom: string, queue: string[]): Step => ({
    lane: 'flush',
    line: 8,
    count: 3,
    dom,
    queue,
    text: `watcher (${flush}) chạy một lần: cb(3, 0), DOM lúc này là "${dom}"`,
    log: `watch: count=3, DOM="${dom}"`,
  })
  const renderStep = (queue: string[]): Step => ({
    lane: 'flush',
    line: 9,
    count: 3,
    dom: '3',
    queue,
    text: 'render chạy một lần, patch <p> thành "3"',
  })

  if (flush === 'pre') {
    steps.push(watcherStep('0', ['render']))
    steps.push(renderStep([]))
  } else if (flush === 'post') {
    steps.push(renderStep([watcherJob[0]]))
    steps.push(watcherStep('3', []))
  } else {
    steps.push(renderStep([]))
  }
  steps.push({ lane: 'after', line: 6, count: 3, dom: '3', queue: [], text: 'nextTick resolve, handler chạy tiếp: DOM đã là "3"', log: 'log 2: "3"' })
  return steps
}

const CODE = (flush: Flush) => [
  { text: 'async function onClick() {' },
  { text: '  count.value++' },
  { text: '  count.value++' },
  { text: '  count.value++' },
  { text: '  console.log(p.textContent)' },
  { text: '  await nextTick()' },
  { text: '  console.log(p.textContent)' },
  { text: '}' },
  { text: `watch(count, cb${flush === 'pre' ? '' : `, { flush: '${flush}' }`})` },
  { text: '<p>{{ count }}</p>' },
]

export function SchedulerTimeline() {
  const [flush, setFlush] = useState<Flush>('pre')
  const [index, setIndex] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const steps = buildSteps(flush)
  const done = index >= steps.length - 1

  useEffect(() => {
    if (!playing) return
    if (index >= steps.length - 1) {
      setPlaying(false)
      return
    }
    timer.current = window.setTimeout(() => setIndex((i) => i + 1), prefersReducedMotion() ? 0 : 750)
    return () => window.clearTimeout(timer.current)
  }, [playing, index, steps.length])

  const choose = (next: Flush) => {
    setFlush(next)
    setIndex(-1)
    setPlaying(false)
  }

  const play = () => {
    if (done) setIndex(-1)
    setPlaying(true)
  }

  const current = index >= 0 ? steps[index] : null
  const visible = steps.slice(0, index + 1)
  const logs = visible.filter((s) => s.log).map((s) => s.log!)
  const watcherRuns = visible.filter((s) => s.log?.startsWith('watch')).length
  const renderRuns = visible.filter((s) => s.text.startsWith('render')).length

  return (
    <Figure
      kicker="Hình 4 · Lịch cập nhật"
      title="Chuyến xe cuối tick: ba lần sửa, một lần flush"
      caption={
        <>
          Chạy handler với từng chế độ <code>flush</code>. Ba lần <code>count.value++</code>{' '}
          chỉ đưa job render vào hàng đợi một lần, nên component render đúng một lần với giá
          trị cuối. Lần đọc DOM đầu tiên luôn ra <code>"0"</code>, vì xe chưa chạy.{' '}
          <code>await nextTick()</code> là chờ xe chạy xong. Watcher <code>pre</code> (mặc
          định) chạy trước khi patch DOM, <code>post</code> chạy sau, còn <code>sync</code>{' '}
          chạy ngay sau mỗi lần sửa, tức ba lần.
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Tabs
          label="Chế độ flush của watcher"
          value={flush}
          onChange={choose}
          items={[
            { value: 'pre', label: "flush: 'pre'" },
            { value: 'post', label: "flush: 'post'" },
            { value: 'sync', label: "flush: 'sync'" },
          ]}
        />
        <div className="flex flex-wrap gap-2">
          {playing ? (
            <DemoButton tone="ghost" onClick={() => setPlaying(false)}>
              <Pause className="size-3.5" aria-hidden /> Tạm dừng
            </DemoButton>
          ) : (
            <DemoButton onClick={play}>
              <Play className="size-3.5" aria-hidden /> {done ? 'Chạy lại' : index < 0 ? 'Bấm nút (chạy handler)' : 'Chạy tiếp'}
            </DemoButton>
          )}
          <DemoButton tone="ghost" disabled={playing || done} onClick={() => setIndex((i) => i + 1)}>
            <StepForward className="size-3.5" aria-hidden /> Từng bước
          </DemoButton>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="min-w-0 space-y-3">
          <CodeLines
            lines={CODE(flush)}
            lineClass={(_, i) => (current && current.line === i ? 'bg-amber-400/25' : undefined)}
          />
          <div className="grid grid-cols-3 gap-2">
            <Box label="count" value={current ? current.count : 0} />
            <Box label="<p> trên DOM" value={`"${current ? current.dom : '0'}"`} on={current?.dom === '3'} />
            <Box label="render / watch" value={`${renderRuns} / ${watcherRuns}`} />
          </div>
          <div className="rounded-xl border border-fd-border bg-fd-background p-3">
            <p className="text-xs font-semibold text-fd-muted-foreground">Hàng đợi của Vue</p>
            <div className="mt-1.5 flex min-h-7 flex-wrap gap-1.5">
              {current && current.queue.length ? (
                current.queue.map((job) => (
                  <span
                    key={job}
                    className={cx(
                      'rounded-md border px-2 py-0.5 font-mono text-[0.72rem] font-semibold transition-colors',
                      current.skip ? 'border-amber-500 bg-amber-400/20 text-amber-800 dark:text-amber-200' : 'border-violet-500/50 bg-violet-500/10 text-violet-800 dark:text-violet-200',
                    )}
                  >
                    {job}
                  </span>
                ))
              ) : (
                <span className="text-xs text-fd-muted-foreground">trống</span>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-fd-border bg-fd-background p-3">
            <p className="text-xs font-semibold text-fd-muted-foreground">Console</p>
            <div className="mt-1 min-h-12 font-mono text-[0.75rem] leading-5 text-fd-foreground">
              {logs.length ? logs.map((l, i) => <div key={`${l}-${i}`}>{l}</div>) : <span className="text-fd-muted-foreground">(trống)</span>}
            </div>
          </div>
        </div>

        <ol className="min-w-0 space-y-3" aria-live="polite">
          {LANES.map((lane) => (
            <li key={lane.id} className="rounded-xl border border-fd-border bg-fd-background p-3">
              <p className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-xs font-bold text-fd-foreground">{lane.label}</span>
                <span className="text-[0.68rem] text-fd-muted-foreground">{lane.hint}</span>
              </p>
              <ul className="mt-2 space-y-1.5">
                {visible.map((s, i) =>
                  s.lane === lane.id ? (
                    <li
                      key={i}
                      className={cx(
                        'flex gap-2 rounded-lg border px-2.5 py-1.5 text-[0.8rem] leading-5 transition-colors duration-300',
                        i === index ? 'border-amber-500 bg-amber-400/15' : 'border-fd-border bg-fd-card',
                        s.skip && 'text-fd-muted-foreground',
                      )}
                    >
                      <span className="font-mono text-[0.7rem] text-fd-muted-foreground">{i + 1}</span>
                      <span>{s.text}</span>
                    </li>
                  ) : null,
                )}
                {visible.every((s) => s.lane !== lane.id) ? (
                  <li className="text-xs italic text-fd-muted-foreground">chưa tới</li>
                ) : null}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </Figure>
  )
}

function Box({ label, value, on = false }: { label: string; value: string | number; on?: boolean }) {
  return (
    <div className={cx('rounded-lg border px-2.5 py-2 transition-colors duration-300', on ? 'border-emerald-500 bg-emerald-500/10' : 'border-fd-border bg-fd-background')}>
      <div className="truncate text-[0.68rem] font-medium text-fd-muted-foreground">{label}</div>
      <div className="font-mono text-base font-bold tabular-nums text-fd-foreground">{value}</div>
    </div>
  )
}
