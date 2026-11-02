import { useState } from 'react'
import { ShoppingBag, TriangleAlert } from 'lucide-react'
import { CodeLines, DemoButton, Figure, Tabs, Toggle, cx, useFlash, type CodeLine } from './ui'

type Mode = 'component' | 'manual'
type EffectId = 'avg' | 'draw' | 'log' | 'analytics'

const DELTAS = [3, -2, 5, -1, 4, -3]

const INSIDE: Array<{ id: EffectId; code: string; note: string }> = [
  { id: 'avg', code: 'computed(avg)', note: 'giá trung bình' },
  { id: 'draw', code: 'watchEffect(drawChart)', note: 'vẽ lại biểu đồ' },
  { id: 'log', code: 'watch(price, logPrice)', note: 'ghi nhật ký giá' },
]

function code(mode: Mode, fixed: boolean): CodeLine[] {
  const body = [
    { text: 'const avg = computed(() => avgOf(history.value))' },
    { text: 'watchEffect(() => drawChart(avg.value))' },
    { text: 'watch(price, logPrice)' },
    { text: 'onScopeDispose(() => socket.close())' },
  ]
  if (mode === 'component') {
    return [
      { text: '<script setup>' },
      ...body,
      { text: '' },
      ...(fixed
        ? [{ text: 'watch(price, sendAnalytics) // ✓ tạo đồng bộ', id: 'analytics' }]
        : [
            { text: 'setTimeout(() => {', id: 'analytics' },
            { text: '  watch(price, sendAnalytics) // ✗ ngoài scope', id: 'analytics' },
            { text: '}, 1000)', id: 'analytics' },
          ]),
      { text: '</script>' },
    ]
  }
  return [
    { text: 'const scope = effectScope()' },
    { text: 'scope.run(() => {' },
    ...body.map((l) => ({ text: `  ${l.text}` })),
    ...(fixed ? [{ text: '  watch(price, sendAnalytics) // ✓ trong túi', id: 'analytics' }] : []),
    { text: '})' },
    ...(fixed ? [] : [{ text: 'watch(price, sendAnalytics) // ✗ ngoài túi', id: 'analytics' }]),
    { text: '' },
    { text: 'scope.stop() // khi không cần nữa' },
  ]
}

export function EffectScopeDemo() {
  const [mode, setMode] = useState<Mode>('component')
  const [fixed, setFixed] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'active' | 'stopped'>('idle')
  const [prices, setPrices] = useState<number[]>([100])
  const [runs, setRuns] = useState<Record<EffectId, number>>({ avg: 0, draw: 0, log: 0, analytics: 0 })
  const [leaks, setLeaks] = useState(0)
  const { flash, isOn } = useFlash()

  const reset = (nextMode = mode, nextFixed = fixed) => {
    setMode(nextMode)
    setFixed(nextFixed)
    setPhase('idle')
    setPrices([100])
    setRuns({ avg: 0, draw: 0, log: 0, analytics: 0 })
    setLeaks(0)
  }

  const start = () => {
    setPhase('active')
    setRuns({ avg: 1, draw: 1, log: 0, analytics: 0 })
    flash(['bag', 'avg', 'draw'])
  }

  const tick = () => {
    const price = prices[prices.length - 1] + DELTAS[(prices.length - 1) % DELTAS.length]
    setPrices((p) => [...p, price].slice(-6))
    const lit: string[] = ['price']
    const next = { ...runs }
    if (phase === 'active') {
      next.avg += 1
      next.draw += 1
      next.log += 1
      lit.push('avg', 'draw', 'log')
    }
    const analyticsAlive = phase === 'active' || (phase === 'stopped' && !fixed)
    if (analyticsAlive) {
      next.analytics += 1
      lit.push('analytics')
      if (phase === 'stopped') setLeaks((n) => n + 1)
    }
    setRuns(next)
    flash(lit)
  }

  const stop = () => {
    setPhase('stopped')
    flash(['bag'])
  }

  const price = prices[prices.length - 1]
  const avg = Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 10) / 10
  const stopLabel = mode === 'component' ? 'Unmount component' : 'scope.stop()'
  const startLabel = mode === 'component' ? 'Mount component' : 'scope.run(…)'
  const bagLabel = mode === 'component' ? 'scope của <PriceTicker>, Vue tự tạo' : 'const scope = effectScope()'
  const analyticsStopped = phase === 'stopped' && fixed

  const analyticsCard = (
    <EffectCard
      code="watch(price, sendAnalytics)"
      note={fixed ? 'gửi analytics' : 'gửi analytics · tạo bất đồng bộ'}
      runs={runs.analytics}
      on={isOn('analytics')}
      status={phase === 'idle' ? 'idle' : analyticsStopped ? 'stopped' : phase === 'stopped' ? 'leak' : 'running'}
    />
  )

  return (
    <Figure
      kicker="Hình 5 · effectScope"
      title="Cái túi gom effect: dừng một lần, không sót cái nào"
      caption={
        <>
          Bấm Mount, đổi giá vài lần, rồi Unmount và đổi giá tiếp. Mọi effect nằm trong túi
          dừng cùng lúc và <code>onScopeDispose</code> đóng socket. Riêng watcher tạo trong{' '}
          <code>setTimeout</code> không nằm trong túi nên vẫn chạy: đó là rò rỉ. Bật "Sửa
          lỗi" để đưa nó vào túi. Tab thứ hai cho thấy đúng cơ chế đó khi bạn tự tạo túi bằng{' '}
          <code>effectScope()</code>, ví dụ cho một composable dùng chung bên ngoài component.
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Tabs
          label="Chọn ngữ cảnh"
          value={mode}
          onChange={(m) => reset(m, fixed)}
          items={[
            { value: 'component', label: 'Trong component' },
            { value: 'manual', label: 'effectScope() tự tạo' },
          ]}
        />
        <Toggle checked={fixed} onChange={(v) => reset(mode, v)} label="Sửa lỗi" />
      </div>

      <div className="grid gap-4">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap gap-2">
            <DemoButton onClick={start} disabled={phase !== 'idle'}>{startLabel}</DemoButton>
            <DemoButton tone="ghost" onClick={tick} disabled={phase === 'idle'}>Giá mới</DemoButton>
            <DemoButton tone="danger" onClick={stop} disabled={phase !== 'active'}>{stopLabel}</DemoButton>
            <DemoButton tone="ghost" onClick={() => reset()} disabled={phase === 'idle'}>Làm lại</DemoButton>
          </div>
          <p className={cx('rounded-lg border px-3 py-1.5 font-mono text-sm transition-colors duration-300', isOn('price') ? 'border-amber-500 bg-amber-400/15' : 'border-fd-border bg-fd-background')}>
            price = {price} <span className="text-fd-muted-foreground">· lịch sử: {prices.join(', ')}</span>
          </p>
          <CodeLines
            lines={code(mode, fixed)}
            lineClass={(l) => (l.id === 'analytics' ? (fixed ? 'bg-emerald-500/10' : 'bg-rose-500/10') : undefined)}
          />
        </div>

        <div className="min-w-0 space-y-3">
          <div
            className={cx(
              'rounded-2xl border-2 border-dashed p-3 transition-colors duration-500',
              phase === 'stopped' ? 'border-fd-border bg-fd-muted/40' : isOn('bag') ? 'border-emerald-500 bg-emerald-500/10' : phase === 'active' ? 'border-emerald-500/60 bg-fd-background' : 'border-fd-border bg-fd-background',
            )}
          >
            <p className="flex flex-wrap items-center gap-1.5 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <ShoppingBag className="size-4" aria-hidden /> {bagLabel}
              {phase === 'stopped' ? (
                <span className="rounded-full bg-fd-foreground/10 px-2 py-0.5 font-sans text-[0.65rem] text-fd-muted-foreground">đã dừng</span>
              ) : null}
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {INSIDE.map((e) => (
                <EffectCard
                  key={e.id}
                  code={e.code}
                  note={e.id === 'avg' && phase !== 'idle' ? `${e.note}: ${avg}` : e.note}
                  runs={runs[e.id]}
                  on={isOn(e.id)}
                  status={phase === 'idle' ? 'idle' : phase === 'active' ? 'running' : 'stopped'}
                />
              ))}
              <div className="rounded-xl border border-fd-border bg-fd-card p-2.5">
                <p className="font-mono text-[0.75rem] font-bold text-fd-foreground">onScopeDispose</p>
                <p className="text-[0.7rem] text-fd-muted-foreground">
                  socket: {phase === 'idle' ? 'chưa mở' : phase === 'active' ? 'đang mở' : 'đã đóng'}
                </p>
              </div>
              {fixed ? analyticsCard : null}
            </div>
          </div>

          {fixed ? null : (
            <div>
              <p className="mb-1 text-xs font-semibold text-fd-muted-foreground">Bên ngoài túi</p>
              {analyticsCard}
            </div>
          )}

          {leaks > 0 ? (
            <p role="alert" className="flex gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[0.8rem] leading-5 text-rose-700 dark:text-rose-300">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Rò rỉ: sendAnalytics đã chạy {leaks} lần sau khi {mode === 'component' ? 'component bị unmount' : 'scope dừng'}. Nó còn giữ tham chiếu tới price và sẽ chạy mãi.
            </p>
          ) : null}
        </div>
      </div>
    </Figure>
  )
}

function EffectCard({
  code,
  note,
  runs,
  on,
  status,
}: {
  code: string
  note: string
  runs: number
  on: boolean
  status: 'idle' | 'running' | 'stopped' | 'leak'
}) {
  return (
    <div
      className={cx(
        'rounded-xl border p-2.5 transition-colors duration-300',
        status === 'leak' ? (on ? 'border-rose-500 bg-rose-500/15' : 'border-rose-500/50 bg-rose-500/5') : on ? 'border-amber-500 bg-amber-400/15' : 'border-fd-border bg-fd-card',
        status === 'stopped' && 'opacity-55',
      )}
    >
      <p className="flex items-center gap-1.5 font-mono text-[0.75rem] font-bold text-fd-foreground">
        <span
          className={cx(
            'size-2 shrink-0 rounded-full',
            status === 'running' && 'bg-emerald-500',
            status === 'leak' && 'bg-rose-500',
            (status === 'idle' || status === 'stopped') && 'bg-fd-muted-foreground/40',
          )}
          aria-hidden
        />
        <span className="truncate">{code}</span>
      </p>
      <p className="text-[0.7rem] text-fd-muted-foreground">
        {note} · {runs}× {status === 'stopped' ? '· đã dừng' : status === 'leak' ? '· vẫn chạy' : ''}
      </p>
    </div>
  )
}
