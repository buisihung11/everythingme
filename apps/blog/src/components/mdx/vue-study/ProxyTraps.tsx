import { useState } from 'react'
import { DoorOpen, ShieldCheck } from 'lucide-react'
import { DemoButton, Figure, Mono, cx, useFlash } from './ui'

type Trap = 'get' | 'set' | 'has' | 'deleteProperty' | 'ownKeys'
type Target = { name: string; price: number; discount?: number }
type Screen = { price: number; keys: string[] }

type Outcome = {
  trap: Trap | null
  vue: string
  vue2: string
  kind: 'track' | 'trigger' | 'none' | 'backdoor'
}

const TRAPS: Array<{ id: Trap; vue: string }> = [
  { id: 'get', vue: 'track' },
  { id: 'set', vue: 'trigger' },
  { id: 'has', vue: 'track' },
  { id: 'deleteProperty', vue: 'trigger' },
  { id: 'ownKeys', vue: 'track' },
]

const INITIAL: Target = { name: 'Áo thun', price: 120 }

type OpId = 'get' | 'set' | 'same' | 'add' | 'has' | 'delete' | 'keys' | 'raw'

const OPS: Array<{ id: OpId; code: string }> = [
  { id: 'get', code: 'product.price' },
  { id: 'set', code: 'product.price += 10' },
  { id: 'same', code: 'product.price = product.price' },
  { id: 'add', code: 'product.discount = 10' },
  { id: 'has', code: "'discount' in product" },
  { id: 'delete', code: 'delete product.discount' },
  { id: 'keys', code: 'Object.keys(product)' },
  { id: 'raw', code: 'raw.price += 100' },
]

export function ProxyTraps() {
  const [target, setTarget] = useState<Target>(INITIAL)
  const [screen, setScreen] = useState<Screen>({ price: INITIAL.price, keys: Object.keys(INITIAL) })
  const [last, setLast] = useState<{ code: string; outcome: Outcome } | null>(null)
  const { flash, isOn } = useFlash(1000)

  const run = (id: OpId, code: string) => {
    let next = target
    let outcome: Outcome
    switch (id) {
      case 'get':
        outcome = { trap: 'get', kind: 'track', vue: "track(product, 'price'): ghi effect đang chạy vào sổ của price", vue2: 'Thấy được: getter có sẵn trên key price' }
        break
      case 'set':
        next = { ...target, price: target.price + 10 }
        outcome = { trap: 'set', kind: 'trigger', vue: `trigger(product, 'price'): giá trị đổi ${target.price} → ${next.price}, báo cho ai đã đọc price`, vue2: 'Thấy được: setter có sẵn trên key price' }
        break
      case 'same':
        outcome = { trap: 'set', kind: 'none', vue: 'Bẫy set có chạy, nhưng giá trị không đổi (so bằng Object.is) nên Vue không trigger', vue2: 'Cũng bỏ qua vì giá trị không đổi' }
        break
      case 'add':
        if (target.discount !== undefined) {
          next = { ...target, discount: target.discount + 5 }
          outcome = { trap: 'set', kind: 'trigger', vue: `trigger(product, 'discount'): key đã có, giá trị đổi thành ${next.discount}`, vue2: 'Không thấy: discount được thêm sau khi khởi tạo' }
        } else {
          next = { ...target, discount: 10 }
          outcome = { trap: 'set', kind: 'trigger', vue: "trigger(product, 'discount', ADD): báo cả ai đọc discount lẫn ai đang duyệt danh sách key", vue2: 'Không thấy: phải dùng Vue.set(product, "discount", 10)' }
        }
        break
      case 'has':
        outcome = { trap: 'has', kind: 'track', vue: `track(product, 'discount'): ghi sổ dù key ${target.discount === undefined ? 'chưa tồn tại' : 'đã có'}, để biết báo khi nó xuất hiện hoặc biến mất`, vue2: 'Không thấy: toán tử in không đi qua getter' }
        break
      case 'delete':
        if (target.discount === undefined) {
          outcome = { trap: 'deleteProperty', kind: 'none', vue: 'Bẫy deleteProperty có chạy, nhưng discount không tồn tại nên không có gì để báo', vue2: 'Không thấy: phải dùng Vue.delete' }
        } else {
          next = { ...target }
          delete next.discount
          outcome = { trap: 'deleteProperty', kind: 'trigger', vue: "trigger(product, 'discount', DELETE): báo ai đọc discount và ai duyệt danh sách key", vue2: 'Không thấy: phải dùng Vue.delete(product, "discount")' }
        }
        break
      case 'keys':
        outcome = { trap: 'ownKeys', kind: 'track', vue: 'track(product, ITERATE): ghi sổ "người duyệt key", sẽ được báo khi có key thêm vào hoặc bị xóa', vue2: 'Không thấy việc thêm hoặc xóa key' }
        break
      case 'raw':
        next = { ...target, price: target.price + 100 }
        outcome = { trap: null, kind: 'backdoor', vue: 'Không có bẫy nào chạy: bạn sửa object gốc, đi vòng qua người gác cổng. Không ai được báo.', vue2: 'Vue 2 sửa thẳng object gốc nên vẫn thấy, nhưng Vue 3 thì không' }
        break
    }

    setTarget(next)
    if (outcome.kind === 'trigger') {
      setScreen({ price: next.price, keys: Object.keys(next) })
      flash(['screen'], 250)
    }
    setLast({ code, outcome })
    flash(outcome.trap ? ['gate', `trap-${outcome.trap}`] : ['raw'])
  }

  const reset = () => {
    setTarget(INITIAL)
    setScreen({ price: INITIAL.price, keys: Object.keys(INITIAL) })
    setLast(null)
  }

  const stale = screen.price !== target.price || screen.keys.join() !== Object.keys(target).join()

  return (
    <Figure
      kicker="Hình 1 · Proxy"
      title="Mọi thao tác trên object đều phải đi qua một cái bẫy"
      caption={
        <>
          Bấm lần lượt từng thao tác và để ý cái bẫy nào sáng lên. Thao tác đọc (
          <code>get</code>, <code>has</code>, <code>ownKeys</code>) dẫn tới{' '}
          <strong>track</strong>. Thao tác ghi (<code>set</code>,{' '}
          <code>deleteProperty</code>) dẫn tới <strong>trigger</strong>. Thao tác cuối
          cùng sửa thẳng object gốc: dữ liệu đổi nhưng màn hình đứng yên, vì không đi qua
          cổng thì không có ai báo.
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-fd-muted-foreground">Thử một thao tác</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {OPS.map((op) => (
              <DemoButton
                key={op.id}
                tone={op.id === 'raw' ? 'danger' : 'ghost'}
                className="justify-start font-mono text-[0.78rem]"
                onClick={() => run(op.id, op.code)}
              >
                {op.code}
              </DemoButton>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2 rounded-xl border border-fd-border bg-fd-background p-3 text-xs text-fd-muted-foreground">
            <span>
              <Mono>const raw = {'{ … }'}</Mono> · <Mono>const product = reactive(raw)</Mono>
            </span>
            <DemoButton tone="ghost" onClick={reset} disabled={!last}>Làm lại</DemoButton>
          </div>
        </div>

        <div className="space-y-3">
          <div
            className={cx(
              'rounded-2xl border-2 p-3 transition-colors duration-300',
              isOn('gate') ? 'border-violet-500 bg-violet-500/10' : 'border-violet-500/40 bg-fd-background',
            )}
          >
            <p className="flex items-center gap-1.5 font-mono text-xs font-bold text-violet-700 dark:text-violet-300">
              <ShieldCheck className="size-4" aria-hidden /> Proxy handler của Vue
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TRAPS.map((t) => (
                <span
                  key={t.id}
                  className={cx(
                    'rounded-lg border px-2 py-1 font-mono text-[0.72rem] transition-colors duration-300',
                    isOn(`trap-${t.id}`)
                      ? t.vue === 'track'
                        ? 'border-sky-500 bg-sky-500/20 text-sky-800 dark:text-sky-200'
                        : 'border-violet-500 bg-violet-500/20 text-violet-800 dark:text-violet-200'
                      : 'border-fd-border text-fd-muted-foreground',
                  )}
                >
                  {t.id} <span className="opacity-60">→ {t.vue}</span>
                </span>
              ))}
            </div>
            <div aria-live="polite" className="mt-3 min-h-20 rounded-xl border border-fd-border bg-fd-card p-3 text-sm leading-6">
              {last ? (
                <>
                  <p className="font-mono text-xs font-bold text-fd-foreground">{last.code}</p>
                  <p
                    className={cx(
                      'mt-1',
                      last.outcome.kind === 'track' && 'text-sky-800 dark:text-sky-300',
                      last.outcome.kind === 'trigger' && 'text-violet-800 dark:text-violet-300',
                      last.outcome.kind === 'none' && 'text-fd-muted-foreground',
                      last.outcome.kind === 'backdoor' && 'text-rose-700 dark:text-rose-300',
                    )}
                  >
                    {last.outcome.vue}
                  </p>
                  <p className="mt-1 text-xs text-fd-muted-foreground">Vue 2 (Object.defineProperty): {last.outcome.vue2}</p>
                </>
              ) : (
                <p className="text-fd-muted-foreground">Chưa có thao tác nào.</p>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div
              className={cx(
                'rounded-xl border p-3 transition-colors duration-300',
                isOn('raw') ? 'border-rose-500 bg-rose-500/10' : 'border-fd-border bg-fd-background',
              )}
            >
              <p className="flex items-center gap-1.5 text-xs font-semibold text-fd-muted-foreground">
                <DoorOpen className="size-3.5" aria-hidden /> Object gốc (raw)
              </p>
              <pre className="mt-1 font-mono text-[0.75rem] leading-5 text-fd-foreground">
                {Object.entries(target).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}
              </pre>
            </div>
            <div
              className={cx(
                'rounded-xl border p-3 transition-colors duration-300',
                isOn('screen') ? 'border-emerald-500 bg-emerald-500/10' : stale ? 'border-amber-500/60 bg-amber-500/5' : 'border-fd-border bg-fd-background',
              )}
            >
              <p className="text-xs font-semibold text-fd-muted-foreground">Màn hình (template)</p>
              <p className="mt-1 font-mono text-sm text-fd-foreground">Giá: {screen.price}k</p>
              <p className="font-mono text-[0.72rem] text-fd-muted-foreground">Các trường: {screen.keys.join(', ')}</p>
              {stale ? (
                <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-400">Lệch với dữ liệu thật</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Figure>
  )
}
