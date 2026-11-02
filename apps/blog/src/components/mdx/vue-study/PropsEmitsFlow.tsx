import { useRef, useState } from 'react'
import { ArrowDown, ArrowUp, TriangleAlert } from 'lucide-react'
import { CodeLines, DemoButton, Figure, cx, prefersReducedMotion, useFlash } from './ui'

const LANE = 96

function travel(el: HTMLElement | null, direction: 'up' | 'down') {
  const ms = prefersReducedMotion() ? 1 : 650
  if (!el) return Promise.resolve()
  const from = direction === 'down' ? 0 : LANE - 14
  const to = direction === 'down' ? LANE - 14 : 0
  return el
    .animate(
      [
        { transform: `translateY(${from}px)`, opacity: 0 },
        { opacity: 1, offset: 0.15 },
        { opacity: 1, offset: 0.85 },
        { transform: `translateY(${to}px)`, opacity: 0 },
      ],
      { duration: ms, easing: 'ease-in-out' },
    )
    .finished.then(() => undefined, () => undefined)
}

export function PropsEmitsFlow() {
  const [count, setCount] = useState(0)
  const [childSees, setChildSees] = useState(0)
  const [busy, setBusy] = useState(false)
  const [warning, setWarning] = useState(false)
  const downDot = useRef<HTMLSpanElement>(null)
  const upDot = useRef<HTMLSpanElement>(null)
  const { flash, isOn } = useFlash(800)

  const emitIncrement = async () => {
    setBusy(true)
    setWarning(false)
    flash(['child', 'emit'])
    await travel(upDot.current, 'up')
    setCount((c) => c + 1)
    flash(['parent'])
    flash(['props'], 150)
    await new Promise((r) => setTimeout(r, 150))
    await travel(downDot.current, 'down')
    setChildSees((c) => c + 1)
    flash(['child'])
    setBusy(false)
  }

  return (
    <Figure
      kicker="Hình 8 · Luồng dữ liệu một chiều"
      title="Props chảy xuống như nước. Sự kiện bay lên như khói."
      caption={
        <>
          Con không bao giờ tự sửa props. Con chỉ <strong>emit</strong> một sự kiện để
          xin thay đổi, cha sửa state của mình, và giá trị mới lại chảy xuống. React cũng
          một chiều như vậy, nhưng ở React con gọi một callback cha truyền xuống (
          <code>onIncrement</code>). Ở Vue, con khai báo sự kiện bằng{' '}
          <code>defineEmits</code>, và cha nghe bằng <code>@increment</code>.
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <div
            className={cx(
              'rounded-xl border-2 p-3 transition-colors duration-300',
              isOn('parent') ? 'border-emerald-500 bg-emerald-500/10' : 'border-fd-border bg-fd-background',
            )}
          >
            <p className="text-xs font-bold text-fd-muted-foreground">Cha: App.vue</p>
            <p className="mt-1 font-mono text-sm">
              const count = ref(<span className="font-bold text-emerald-700 dark:text-emerald-400">{count}</span>)
            </p>
            <p className="mt-1 font-mono text-[0.72rem] text-fd-muted-foreground">
              {'<Counter :count="count" @increment="count++" />'}
            </p>
          </div>

          <div className="relative mx-auto flex w-full max-w-xs justify-between px-6" style={{ height: LANE }}>
            <div className="relative flex w-24 flex-col items-center">
              <div className={cx('h-full w-0.5 transition-colors', isOn('props') ? 'bg-sky-500' : 'bg-sky-500/30')} />
              <span ref={downDot} className="absolute top-0 size-3.5 rounded-full bg-sky-500 opacity-0 shadow-[0_0_12px] shadow-sky-500" aria-hidden />
              <span className="absolute top-1/2 -translate-y-1/2 translate-x-8 whitespace-nowrap rounded bg-fd-card px-1 font-mono text-[0.7rem] font-semibold text-sky-700 dark:text-sky-300">
                <ArrowDown className="mr-0.5 inline size-3" aria-hidden />props
              </span>
            </div>
            <div className="relative flex w-24 flex-col items-center">
              <div className={cx('h-full w-0.5 transition-colors', isOn('emit') ? 'bg-violet-500' : 'bg-violet-500/30')} />
              <span ref={upDot} className="absolute top-0 size-3.5 rounded-full bg-violet-500 opacity-0 shadow-[0_0_12px] shadow-violet-500" aria-hidden />
              <span className="absolute top-1/2 -translate-y-1/2 -translate-x-10 whitespace-nowrap rounded bg-fd-card px-1 font-mono text-[0.7rem] font-semibold text-violet-700 dark:text-violet-300">
                <ArrowUp className="mr-0.5 inline size-3" aria-hidden />emit
              </span>
            </div>
          </div>

          <div
            className={cx(
              'rounded-xl border-2 p-3 transition-colors duration-300',
              warning ? 'border-rose-500 bg-rose-500/10' : isOn('child') ? 'border-violet-500 bg-violet-500/10' : 'border-fd-border bg-fd-background',
            )}
          >
            <p className="text-xs font-bold text-fd-muted-foreground">Con: Counter.vue</p>
            <p className="mt-1 font-mono text-sm">
              props.count = <span className="font-bold text-sky-700 dark:text-sky-400">{childSees}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <DemoButton onClick={emitIncrement} disabled={busy}>emit('increment')</DemoButton>
              <DemoButton tone="danger" disabled={busy} onClick={() => { setWarning(true); flash(['child']) }}>
                props.count++
              </DemoButton>
            </div>
          </div>
          {warning ? (
            <p role="alert" className="mt-2 flex gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 font-mono text-[0.72rem] leading-5 text-rose-700 dark:text-rose-300">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              [Vue warn] Attempting to mutate prop "count". Props are readonly.
            </p>
          ) : null}
        </div>

        <div className="min-w-0 space-y-2">
          <p className="text-xs font-bold text-fd-muted-foreground">Counter.vue</p>
          <CodeLines
            lines={[
              { text: '<script setup lang="ts">' },
              { text: 'const props = defineProps<{ count: number }>()', id: 'props' },
              { text: 'const emit = defineEmits<{ increment: [] }>()', id: 'emit' },
              { text: '</script>' },
              { text: '' },
              { text: '<template>' },
              { text: '  <p>{{ count }}</p>', id: 'props' },
              { text: '  <button @click="emit(\'increment\')">+1</button>', id: 'emit' },
              { text: '</template>' },
            ]}
            lineClass={(l) => cx(
              l.id === 'props' && isOn('props') && 'bg-sky-500/15',
              l.id === 'emit' && isOn('emit') && 'bg-violet-500/15',
            )}
          />
          <p className="text-xs font-bold text-fd-muted-foreground">v-model trên component chỉ là cặp này viết gọn</p>
          <CodeLines
            lines={[
              { text: '<Search v-model="query" />' },
              { text: '<!-- bằng với -->' },
              { text: '<Search :modelValue="query"' },
              { text: '        @update:modelValue="v => query = v" />' },
            ]}
          />
        </div>
      </div>
    </Figure>
  )
}
