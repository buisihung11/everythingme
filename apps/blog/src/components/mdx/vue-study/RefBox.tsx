import { useState } from 'react'
import { Package, ShieldCheck, Unlink, Link2 } from 'lucide-react'
import { DemoButton, Figure, Mono, Tabs, cx, useFlash } from './ui'

type Mode = 'ref' | 'reactive'

export function RefBox() {
  const [mode, setMode] = useState<Mode>('ref')
  return (
    <Figure
      kicker="Hình 3 · Hai cách giữ state"
      title="ref là cái hộp. reactive là người gác cổng."
      caption={
        mode === 'ref' ? (
          <>
            Lấy giá trị ra khỏi hộp (<code>const n = count.value</code>) thì chỉ được
            một bản sao. Bản sao đó không đổi theo hộp nữa. Muốn giữ liên kết thì
            truyền chính cái hộp <code>count</code> đi.
          </>
        ) : (
          <>
            Người gác cổng (Proxy) ghi lại ai đọc thuộc tính nào (<strong>track</strong>)
            và báo cho đúng những người đó khi thuộc tính bị ghi (<strong>trigger</strong>).
            Destructure là mang giá trị ra ngoài cổng, nên không còn ai báo nữa. Dùng{' '}
            <code>toRefs</code> để mang ra những cái hộp vẫn nối với object gốc.
          </>
        )
      }
    >
      <div className="mb-4">
        <Tabs
          label="Chọn API"
          value={mode}
          onChange={setMode}
          items={[
            { value: 'ref', label: 'ref = cái hộp' },
            { value: 'reactive', label: 'reactive = người gác cổng' },
          ]}
        />
      </div>
      {mode === 'ref' ? <RefDemo /> : <ReactiveDemo />}
    </Figure>
  )
}

function RefDemo() {
  const [count, setCount] = useState(0)
  const [copy, setCopy] = useState<number | null>(null)
  const { flash, isOn } = useFlash()

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <DemoButton
            onClick={() => {
              setCount((c) => c + 1)
              flash(['box', 'tpl'])
            }}
          >
            count.value++
          </DemoButton>
          <DemoButton tone="ghost" onClick={() => { setCopy(count); flash(['copy']) }}>
            const n = count.value
          </DemoButton>
          <DemoButton tone="ghost" onClick={() => { setCount(0); setCopy(null) }}>
            Làm lại
          </DemoButton>
        </div>

        <div
          className={cx(
            'relative rounded-2xl border-2 border-dashed p-4 pt-6 transition-colors duration-300',
            isOn('box') ? 'border-emerald-500 bg-emerald-500/10' : 'border-emerald-500/40 bg-fd-background',
          )}
        >
          <span className="absolute -top-3 left-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 font-mono text-xs font-bold text-white dark:bg-emerald-500 dark:text-emerald-950">
            <Package className="size-3.5" aria-hidden /> count = ref(0)
          </span>
          <p className="text-xs text-fd-muted-foreground">Trong hộp:</p>
          <p className="font-mono text-2xl font-bold tabular-nums text-fd-foreground">
            .value = {count}
          </p>
          <p className="mt-1 text-xs text-fd-muted-foreground">
            Trong script phải mở hộp: <Mono>count.value</Mono>
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div
          className={cx(
            'rounded-xl border p-3 transition-colors duration-300',
            isOn('tpl') ? 'border-emerald-500 bg-emerald-500/10' : 'border-fd-border bg-fd-background',
          )}
        >
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <Link2 className="size-3.5" aria-hidden /> Template vẫn nối với hộp
          </p>
          <p className="mt-1 font-mono text-sm text-fd-muted-foreground">{'<p>{{ count }}</p>'}</p>
          <p className="font-mono text-xl font-bold tabular-nums text-fd-foreground">{count}</p>
          <p className="text-xs text-fd-muted-foreground">Template tự mở hộp, không cần .value</p>
        </div>

        <div
          className={cx(
            'rounded-xl border p-3 transition-colors duration-300',
            copy === null
              ? 'border-dashed border-fd-border bg-fd-background opacity-60'
              : isOn('copy')
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-amber-500/50 bg-amber-500/5',
          )}
        >
          <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <Unlink className="size-3.5" aria-hidden /> Bản sao đã tách khỏi hộp
          </p>
          {copy === null ? (
            <p className="mt-1 text-sm text-fd-muted-foreground">
              Bấm <Mono>const n = count.value</Mono> để lấy giá trị ra ngoài.
            </p>
          ) : (
            <>
              <p className="mt-1 font-mono text-xl font-bold tabular-nums text-fd-foreground">n = {copy}</p>
              <p className="text-xs text-fd-muted-foreground">
                {copy === count
                  ? 'Tăng count thêm vài lần, n sẽ đứng yên.'
                  : `count đã là ${count} nhưng n vẫn là ${copy}: nó chỉ là một con số, không phải cái hộp.`}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

type Trap = { kind: 'get' | 'set' | 'note'; text: string }

function ReactiveDemo() {
  const [qty, setQty] = useState(1)
  const [plain, setPlain] = useState<number | null>(null)
  const [linked, setLinked] = useState(false)
  const [log, setLog] = useState<Trap[]>([
    { kind: 'get', text: 'get cart.qty: template đọc, gác cổng ghi tên template vào sổ' },
  ])
  const { flash, isOn } = useFlash()

  const push = (...items: Trap[]) => setLog((l) => [...items, ...l].slice(0, 6))

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <DemoButton
            onClick={() => {
              setQty((q) => q + 1)
              flash(['proxy', 'tpl', ...(linked ? ['linked'] : [])])
              push(
                { kind: 'set', text: `set cart.qty = ${qty + 1}: trigger, báo cho những ai đã đọc qty` },
                { kind: 'get', text: 'get cart.qty: template render lại và đọc giá trị mới' },
              )
            }}
          >
            cart.qty++
          </DemoButton>
          <DemoButton
            tone="ghost"
            onClick={() => {
              setPlain(qty)
              flash(['plain'])
              push({ kind: 'note', text: `const { qty } = cart: lấy ra số ${qty}, mất liên lạc với gác cổng` })
            }}
          >
            {'const { qty } = cart'}
          </DemoButton>
          <DemoButton
            tone="ghost"
            onClick={() => {
              setLinked(true)
              flash(['linked'])
              push({ kind: 'note', text: 'const { qty } = toRefs(cart): lấy ra một cái hộp vẫn nối với cart.qty' })
            }}
          >
            toRefs(cart)
          </DemoButton>
        </div>

        <div
          className={cx(
            'rounded-2xl border-2 p-4 transition-colors duration-300',
            isOn('proxy') ? 'border-violet-500 bg-violet-500/10' : 'border-violet-500/40 bg-fd-background',
          )}
        >
          <p className="flex items-center gap-1.5 font-mono text-xs font-bold text-violet-700 dark:text-violet-300">
            <ShieldCheck className="size-4" aria-hidden /> cart = reactive({'{ qty: 1 }'})
          </p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-fd-foreground">qty: {qty}</p>
          <p className="mt-1 text-xs text-fd-muted-foreground">
            Mọi lần đọc và ghi đều phải đi qua gác cổng (Proxy).
          </p>
        </div>

        <ol className="space-y-1 rounded-xl border border-fd-border bg-fd-background p-3 font-mono text-[0.72rem] leading-5" aria-label="Nhật ký của gác cổng">
          {log.map((t, i) => (
            <li
              key={`${log.length}-${i}`}
              className={cx(
                i === 0 ? 'opacity-100' : 'opacity-60',
                t.kind === 'get' && 'text-sky-700 dark:text-sky-300',
                t.kind === 'set' && 'text-violet-700 dark:text-violet-300',
                t.kind === 'note' && 'text-amber-700 dark:text-amber-300',
              )}
            >
              {t.text}
            </li>
          ))}
        </ol>
      </div>

      <div className="space-y-3">
        <ReaderCard
          title="Template: {{ cart.qty }}"
          value={qty}
          on={isOn('tpl')}
          status="linked"
          note="Template đã có tên trong sổ, nên được báo mỗi khi qty đổi."
        />
        <ReaderCard
          title="const { qty } = cart"
          value={plain}
          on={isOn('plain')}
          status={plain === null ? 'empty' : 'broken'}
          note={
            plain === null
              ? 'Chưa destructure.'
              : plain === qty
                ? 'Tăng cart.qty thử xem, giá trị này sẽ đứng yên.'
                : `cart.qty đã là ${qty}, bản này vẫn là ${plain}.`
          }
        />
        <ReaderCard
          title="const { qty } = toRefs(cart)"
          value={linked ? qty : null}
          on={isOn('linked')}
          status={linked ? 'linked' : 'empty'}
          note={linked ? 'Mỗi thuộc tính là một ref trỏ về cart, nên luôn khớp với object gốc.' : 'Chưa gọi toRefs.'}
        />
      </div>
    </div>
  )
}

function ReaderCard({
  title,
  value,
  on,
  status,
  note,
}: {
  title: string
  value: number | null
  on: boolean
  status: 'linked' | 'broken' | 'empty'
  note: string
}) {
  return (
    <div
      className={cx(
        'rounded-xl border p-3 transition-colors duration-300',
        status === 'empty' && 'border-dashed border-fd-border bg-fd-background opacity-60',
        status === 'linked' && (on ? 'border-emerald-500 bg-emerald-500/10' : 'border-emerald-500/40 bg-fd-background'),
        status === 'broken' && (on ? 'border-amber-500 bg-amber-500/10' : 'border-amber-500/50 bg-amber-500/5'),
      )}
    >
      <p className="flex items-center gap-1.5 font-mono text-xs font-semibold text-fd-muted-foreground">
        {status === 'broken' ? (
          <Unlink className="size-3.5 text-amber-600" aria-hidden />
        ) : (
          <Link2 className="size-3.5 text-emerald-600" aria-hidden />
        )}
        {title}
      </p>
      <p className="mt-1 font-mono text-xl font-bold tabular-nums text-fd-foreground">
        {value === null ? '—' : value}
      </p>
      <p className="text-xs text-fd-muted-foreground">{note}</p>
    </div>
  )
}
