import { useState, type ReactNode } from 'react'
import { Lock, ShieldCheck, ShieldOff, TriangleAlert } from 'lucide-react'
import { CodeLines, DemoButton, Figure, Stat, Tabs, cx, useFlash } from './ui'

type Api = 'ref' | 'shallowRef' | 'reactive' | 'shallowReactive' | 'readonly' | 'markRaw'
type Guard = 'watch' | 'none' | 'lock'
type Data = { user: { name: string; tags: string[] } }
type Op = 'replace' | 'name' | 'push' | 'triggerRef'

const INITIAL: Data = { user: { name: 'An', tags: ['vue'] } }

const APIS: Record<Api, { decl: string[]; prefix: string; guards: [Guard, Guard, Guard]; use: string }> = {
  ref: {
    decl: ['const state = ref({', "  user: { name: 'An', tags: ['vue'] },", '})'],
    prefix: 'state.value',
    guards: ['watch', 'watch', 'watch'],
    use: 'Mặc định cho mọi state. Object bên trong .value được bọc reactive() nên sâu tới tận đáy.',
  },
  shallowRef: {
    decl: ['const state = shallowRef({', "  user: { name: 'An', tags: ['vue'] },", '})'],
    prefix: 'state.value',
    guards: ['watch', 'none', 'none'],
    use: 'Dữ liệu lớn hoặc bất biến, như danh sách 10.000 dòng hay kết quả API chỉ thay cả cục.',
  },
  reactive: {
    decl: ['const state = reactive({', "  user: { name: 'An', tags: ['vue'] },", '})'],
    prefix: 'state',
    guards: ['watch', 'watch', 'watch'],
    use: 'Object gom nhiều trường liên quan mà bạn sẽ không destructure. Object lồng bên trong được bọc khi được đọc tới.',
  },
  shallowReactive: {
    decl: ['const state = shallowReactive({', "  user: { name: 'An', tags: ['vue'] },", '})'],
    prefix: 'state',
    guards: ['watch', 'none', 'none'],
    use: 'Hiếm khi cần: chỉ các key ở tầng đầu là reactive, object lồng bên trong là object thường.',
  },
  readonly: {
    decl: ['const state = readonly(reactive({', "  user: { name: 'An', tags: ['vue'] },", '}))'],
    prefix: 'state',
    guards: ['lock', 'lock', 'lock'],
    use: 'Chia sẻ state ra ngoài mà không cho sửa, ví dụ provide một store. Vẫn reactive khi nguồn gốc đổi.',
  },
  markRaw: {
    decl: ['const state = reactive({', "  user: markRaw({ name: 'An', tags: ['vue'] }),", '})'],
    prefix: 'state',
    guards: ['watch', 'none', 'none'],
    use: 'Instance của thư viện (chart, map, editor) cần nằm trong state nhưng không bao giờ được bọc Proxy.',
  },
}

const clone = (d: Data): Data => ({ user: { name: d.user.name, tags: [...d.user.tags] } })

function opCode(api: Api, op: Op) {
  const p = APIS[api].prefix
  if (op === 'triggerRef') return 'triggerRef(state)'
  if (op === 'name') return `${p}.user.name = 'Bình'`
  if (op === 'push') return `${p}.user.tags.push('ts')`
  if (api === 'ref' || api === 'shallowRef') return `${p} = { user: { … } }`
  if (api === 'markRaw') return `${p}.user = markRaw({ … })`
  return `${p}.user = { … }`
}

const LAYER: Record<Exclude<Op, 'triggerRef'>, 0 | 1 | 2> = { replace: 0, name: 1, push: 2 }

export function DepthCompare() {
  const [api, setApi] = useState<Api>('ref')
  const [data, setData] = useState<Data>(INITIAL)
  const [screen, setScreen] = useState<Data>(INITIAL)
  const [renders, setRenders] = useState(1)
  const [message, setMessage] = useState<{ tone: 'ok' | 'silent' | 'warn'; text: string } | null>(null)
  const { flash, isOn } = useFlash()

  const choose = (next: Api) => {
    setApi(next)
    setData(INITIAL)
    setScreen(INITIAL)
    setRenders(1)
    setMessage(null)
  }

  const run = (op: Op) => {
    if (op === 'triggerRef') {
      setScreen(clone(data))
      setRenders((r) => r + 1)
      setMessage({ tone: 'ok', text: 'triggerRef ép trigger bằng tay: màn hình render lại và đọc đúng dữ liệu hiện tại.' })
      flash(['screen'])
      return
    }
    const layer = LAYER[op]
    const guard = APIS[api].guards[layer]
    if (guard === 'lock') {
      const key = op === 'replace' ? 'user' : op === 'name' ? 'name' : '1'
      setMessage({ tone: 'warn', text: `[Vue warn] Set operation on key "${key}" failed: target is readonly.` })
      flash([`layer-${layer}`])
      return
    }
    const next = clone(data)
    if (op === 'replace') next.user = { name: 'Chi', tags: [] }
    if (op === 'name') next.user.name = 'Bình'
    if (op === 'push') next.user.tags.push('ts')
    setData(next)
    flash([`layer-${layer}`])
    if (guard === 'watch') {
      setScreen(clone(next))
      setRenders((r) => r + 1)
      setMessage({ tone: 'ok', text: 'Thao tác đi qua một lớp có gác: trigger, màn hình render lại.' })
      flash(['screen'], 200)
    } else {
      setMessage({
        tone: 'silent',
        text: 'Dữ liệu đã đổi, nhưng lớp này không có gác nên không ai được báo. Màn hình vẫn hiển thị giá trị cũ.',
      })
    }
  }

  const { guards, decl, use } = APIS[api]
  const stale = JSON.stringify(data) !== JSON.stringify(screen)
  const format = (d: Data) => `${d.user.name} · [${d.user.tags.join(', ')}]`

  return (
    <Figure
      kicker="Hình 3 · Độ sâu"
      title="Người gác cổng canh tới lớp nào?"
      caption={
        <>
          Với mỗi API, thử ba thao tác ở ba độ sâu khác nhau. <code>ref</code> và{' '}
          <code>reactive</code> canh tới tận đáy. <code>shallowRef</code> và{' '}
          <code>shallowReactive</code> chỉ canh lớp ngoài cùng, nên sửa sâu bên trong là
          sửa trong im lặng. <code>readonly</code> chặn mọi thao tác ghi, còn{' '}
          <code>markRaw</code> dán tem "miễn canh" lên đúng object được đánh dấu.
        </>
      }
    >
      <div className="mb-4">
        <Tabs
          label="Chọn API"
          value={api}
          onChange={choose}
          items={(Object.keys(APIS) as Api[]).map((a) => ({ value: a, label: <span className="font-mono">{a}</span> }))}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3">
          <CodeLines lines={decl.map((text) => ({ text }))} />
          <p className="text-xs leading-5 text-fd-muted-foreground">
            <span className="font-semibold text-fd-foreground">Dùng khi: </span>
            {use}
          </p>
          <Layer guard={guards[0]} label={api === 'ref' || api === 'shallowRef' ? 'state.value' : 'state'} on={isOn('layer-0')}>
            <Layer guard={guards[1]} label="user" on={isOn('layer-1')}>
              <p className="font-mono text-sm text-fd-foreground">name: '{data.user.name}'</p>
              <Layer guard={guards[2]} label="tags" on={isOn('layer-2')}>
                <p className="font-mono text-sm text-fd-foreground">[{data.user.tags.map((t) => `'${t}'`).join(', ')}]</p>
              </Layer>
            </Layer>
          </Layer>
        </div>

        <div className="min-w-0 space-y-3">
          <div className="grid gap-2">
            {(['replace', 'name', 'push'] as const).map((op, i) => (
              <DemoButton key={op} tone="ghost" className="justify-start font-mono text-[0.78rem]" onClick={() => run(op)}>
                <span className="text-fd-muted-foreground">Lớp {i + 1}:</span> {opCode(api, op)}
              </DemoButton>
            ))}
            {api === 'shallowRef' ? (
              <DemoButton className="justify-start font-mono text-[0.78rem]" onClick={() => run('triggerRef')}>
                triggerRef(state)
              </DemoButton>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Stat label="Số lần render" value={renders} tone="vue" flash={isOn('screen')} />
            <Stat label="Trạng thái" value={stale ? 'Lệch' : 'Khớp'} tone={stale ? 'warn' : 'neutral'} />
          </div>
          <div
            className={cx(
              'rounded-xl border p-3 transition-colors duration-300',
              isOn('screen') ? 'border-emerald-500 bg-emerald-500/10' : stale ? 'border-amber-500/60 bg-amber-500/5' : 'border-fd-border bg-fd-background',
            )}
          >
            <p className="text-xs font-semibold text-fd-muted-foreground">Màn hình đang hiển thị</p>
            <p className="mt-1 font-mono text-sm text-fd-foreground">{format(screen)}</p>
            {stale ? (
              <p className="mt-1 font-mono text-[0.72rem] text-amber-700 dark:text-amber-400">Dữ liệu thật: {format(data)}</p>
            ) : null}
          </div>
          <div aria-live="polite">
            {message ? (
              <p
                className={cx(
                  'flex gap-2 rounded-lg border px-3 py-2 text-[0.8rem] leading-5',
                  message.tone === 'ok' && 'border-emerald-500/40 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300',
                  message.tone === 'silent' && 'border-amber-500/40 bg-amber-500/5 text-amber-800 dark:text-amber-300',
                  message.tone === 'warn' && 'border-rose-500/40 bg-rose-500/10 font-mono text-rose-700 dark:text-rose-300',
                )}
              >
                {message.tone === 'ok' ? null : <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />}
                {message.text}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Figure>
  )
}

function Layer({ guard, label, on, children }: { guard: Guard; label: string; on: boolean; children: ReactNode }) {
  const Icon = guard === 'watch' ? ShieldCheck : guard === 'lock' ? Lock : ShieldOff
  return (
    <div
      className={cx(
        'mt-2 rounded-xl border-2 p-2.5 transition-colors duration-300',
        guard === 'watch' && 'border-solid border-emerald-500/60',
        guard === 'none' && 'border-dashed border-fd-border',
        guard === 'lock' && 'border-solid border-amber-500/70',
        on ? (guard === 'none' ? 'bg-amber-400/15' : guard === 'lock' ? 'bg-rose-500/10' : 'bg-emerald-500/10') : 'bg-fd-background',
      )}
    >
      <p
        className={cx(
          'mb-1 flex items-center gap-1.5 font-mono text-[0.72rem] font-bold',
          guard === 'watch' && 'text-emerald-700 dark:text-emerald-400',
          guard === 'none' && 'text-fd-muted-foreground',
          guard === 'lock' && 'text-amber-700 dark:text-amber-400',
        )}
      >
        <Icon className="size-3.5" aria-hidden />
        {label}
        <span className="font-sans font-semibold opacity-80">
          {guard === 'watch' ? '· có gác' : guard === 'lock' ? '· chỉ đọc' : '· không gác'}
        </span>
      </p>
      {children}
    </div>
  )
}
