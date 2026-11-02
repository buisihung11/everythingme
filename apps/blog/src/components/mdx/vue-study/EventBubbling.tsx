import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Ear, EarOff, Lightbulb } from 'lucide-react'
import { CodeLines, DemoButton, Figure, Tabs, cx, prefersReducedMotion } from './ui'

type Mode = 'stop' | 'relay' | 'dom'
type Level = 'card' | 'list' | 'app'

const MODES: Record<Mode, { listCode: string[]; appCode: string; reach: Level[]; result: string }> = {
  stop: {
    listCode: ['<!-- ProductList.vue -->', '<ul>', '  <ProductCard v-for="p in products" :product="p" />', '</ul>'],
    appCode: '<ProductList @add-to-cart="addToCart" />',
    reach: ['card', 'list'],
    result: 'Sự kiện dừng ở ProductList. ProductList không nghe @add-to-cart nên không có gì xảy ra, và App không bao giờ nghe thấy.',
  },
  relay: {
    listCode: [
      '<!-- ProductList.vue -->',
      "const emit = defineEmits<{ addToCart: [id: number] }>()",
      '<ul>',
      '  <ProductCard v-for="p in products" :product="p"',
      "    @add-to-cart=\"(id) => emit('addToCart', id)\" />",
      '</ul>',
    ],
    appCode: '<ProductList @add-to-cart="addToCart" />',
    reach: ['card', 'list', 'app'],
    result: 'ProductList nghe sự kiện của con rồi emit lại một sự kiện của chính nó. Mỗi tầng tự khai báo, nên hợp đồng của từng component vẫn rõ ràng.',
  },
  dom: {
    listCode: ['<!-- ProductList.vue -->', '<ul>', '  <ProductCard v-for="p in products" :product="p" />', '</ul>'],
    appCode: '<div @click="onAnyClick"><ProductList /></div>',
    reach: ['card', 'list', 'app'],
    result: 'Sự kiện click gốc của DOM nổi bọt qua mọi phần tử cha, giống hệt trong React. Chỉ sự kiện của component (emit) mới dừng ở cha trực tiếp.',
  },
}

export function EventBubbling() {
  const [mode, setMode] = useState<Mode>('stop')
  const [lit, setLit] = useState<Level[]>([])
  const [heard, setHeard] = useState(0)
  const [busy, setBusy] = useState(false)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((t) => window.clearTimeout(t))
  }, [])

  const choose = (m: Mode) => {
    setMode(m)
    setLit([])
    setHeard(0)
  }

  const fire = () => {
    const { reach } = MODES[mode]
    const gap = prefersReducedMotion() ? 0 : 450
    setBusy(true)
    setLit([])
    reach.forEach((level, i) => {
      timers.current.push(window.setTimeout(() => setLit((l) => [...l, level]), i * gap))
    })
    timers.current.push(
      window.setTimeout(() => {
        if (reach.includes('app')) setHeard((h) => h + 1)
        setBusy(false)
      }, reach.length * gap),
    )
  }

  const { listCode, appCode, reach, result } = MODES[mode]
  const done = !busy && lit.length > 0
  const eventName = mode === 'dom' ? 'click' : "emit('addToCart', 42)"

  return (
    <Figure
      kicker="Hình 3 · defineEmits"
      title="Đèn báo chỉ sáng tới cha trực tiếp"
      caption={
        <>
          Bấm nút trong ProductCard ở từng chế độ. Sự kiện của component{' '}
          <strong>không nổi bọt</strong>: nó chỉ tới cha trực tiếp. Muốn tầng trên nghe được,
          tầng giữa phải emit lại. Nếu phải chuyển tiếp qua nhiều tầng, đó là dấu hiệu nên
          dùng provide/inject hoặc store (các bài Composables và Pinia). Tên sự kiện khai báo kiểu
          camelCase (<code>addToCart</code>) vẫn nghe được bằng kebab-case (
          <code>@add-to-cart</code>).
        </>
      }
    >
      <div className="mb-4">
        <Tabs
          label="Chế độ"
          value={mode}
          onChange={choose}
          items={[
            { value: 'stop', label: 'Không chuyển tiếp' },
            { value: 'relay', label: 'Cha emit lại' },
            { value: 'dom', label: 'So sánh: click của DOM' },
          ]}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <Tier
            name="App.vue (ông)"
            on={lit.includes('app')}
            reached={reach.includes('app')}
            done={done}
            listens
            extra={<span className="font-mono text-[0.72rem] text-fd-muted-foreground">đã nghe {heard} lần</span>}
          >
            <Tier
              name="ProductList.vue (cha)"
              on={lit.includes('list')}
              reached
              done={done}
              listens={mode !== 'stop'}
            >
              <Tier name="ProductCard.vue (con)" on={lit.includes('card')} reached done={done} source>
                <DemoButton onClick={fire} disabled={busy}>
                  <Lightbulb className="size-3.5" aria-hidden /> {mode === 'dom' ? 'Click' : 'Thêm vào giỏ'}
                </DemoButton>
                <p className="mt-1 font-mono text-[0.7rem] text-fd-muted-foreground">{eventName}</p>
              </Tier>
            </Tier>
          </Tier>
        </div>

        <div className="min-w-0 space-y-3">
          <CodeLines
            lines={[
              { text: '<!-- ProductCard.vue -->' },
              { text: "const emit = defineEmits<{ addToCart: [id: number] }>()" },
              { text: "<button @click=\"emit('addToCart', product.id)\">" },
            ]}
            lineClass={() => (lit.includes('card') && mode !== 'dom' ? 'bg-violet-500/10' : undefined)}
          />
          <CodeLines lines={listCode.map((text) => ({ text }))} lineClass={() => (lit.includes('list') ? 'bg-violet-500/10' : undefined)} />
          <CodeLines
            lines={[{ text: '<!-- App.vue -->' }, { text: appCode }]}
            lineClass={() => (lit.includes('app') ? 'bg-emerald-500/10' : undefined)}
          />
          <p
            aria-live="polite"
            className={cx(
              'rounded-lg border px-3 py-2 text-sm leading-6 transition-opacity',
              done ? 'opacity-100' : 'opacity-0',
              reach.includes('app') ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-amber-500/40 bg-amber-500/5',
            )}
          >
            {result}
          </p>
        </div>
      </div>
    </Figure>
  )
}

function Tier({
  name,
  on,
  reached,
  done,
  listens = false,
  source = false,
  extra,
  children,
}: {
  name: string
  on: boolean
  reached: boolean
  done: boolean
  listens?: boolean
  source?: boolean
  extra?: ReactNode
  children?: ReactNode
}) {
  const missed = done && !reached
  return (
    <div
      className={cx(
        'rounded-2xl border-2 p-3 transition-colors duration-300',
        on ? (source ? 'border-violet-500 bg-violet-500/10' : 'border-amber-500 bg-amber-400/15') : missed ? 'border-dashed border-fd-border bg-fd-muted/40' : 'border-fd-border bg-fd-background',
        children && !source ? 'pb-3' : '',
      )}
    >
      <p className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold text-fd-foreground">
        {name}
        {!source ? (
          listens ? (
            <span className="inline-flex items-center gap-1 font-normal text-emerald-700 dark:text-emerald-400">
              <Ear className="size-3.5" aria-hidden /> có nghe
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-normal text-fd-muted-foreground">
              <EarOff className="size-3.5" aria-hidden /> không nghe
            </span>
          )
        ) : null}
        {extra}
      </p>
      {children}
    </div>
  )
}
