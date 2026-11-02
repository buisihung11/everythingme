import { useState } from 'react'
import { Check, Link2, TriangleAlert, Unlink, X } from 'lucide-react'
import { CodeLines, DemoButton, Figure, cx, useFlash } from './ui'

type Case = {
  id: string
  label: string
  source: string
  start: number
  action: string
  bad: string[]
  good: string[]
  badKind: 'frozen' | 'warn' | 'compile'
  badValue: (n: number, start: number) => string
  goodValue: (n: number, start: number) => string
  badNote: string
  goodNote: string
  error?: string
}

const CASES: Case[] = [
  {
    id: 'destructure',
    label: 'Destructure reactive',
    source: 'state.count',
    start: 0,
    action: 'state.count++',
    bad: ['const state = reactive({ count: 0 })', 'const { count } = state', '// template: {{ count }}'],
    good: ['const state = reactive({ count: 0 })', 'const { count } = toRefs(state)', '// template: {{ count }}'],
    badKind: 'frozen',
    badValue: (_, s) => String(s),
    goodValue: (n) => String(n),
    badNote: 'count là con số lấy ra đúng một lần, lúc setup chạy.',
    goodNote: 'count là một ref trỏ thẳng về state.count.',
  },
  {
    id: 'watch',
    label: 'watch một giá trị',
    source: 'state.count',
    start: 0,
    action: 'state.count++',
    bad: ['watch(state.count, (n) => save(n))'],
    good: ['watch(() => state.count, (n) => save(n))'],
    badKind: 'warn',
    badValue: () => 'save chạy 0×',
    goodValue: (n, s) => `save chạy ${n - s}×`,
    badNote: 'Vue nhận được số 0, không phải một nguồn để theo dõi.',
    goodNote: 'Getter được chạy trong effect, nên lần đọc state.count được ghi sổ.',
    error: '[Vue warn]: Invalid watch source: 0 A watch source can only be a getter/effect function, a ref, a reactive object, or an array of these types.',
  },
  {
    id: 'composable',
    label: 'Truyền giá trị vào composable',
    source: 'state.count',
    start: 0,
    action: 'state.count++',
    bad: ['const doubled = useDouble(state.count)'],
    good: ['const doubled = useDouble(() => state.count)', '// bên trong: computed(() => toValue(src) * 2)'],
    badKind: 'frozen',
    badValue: () => 'doubled = 0',
    goodValue: (n) => `doubled = ${n * 2}`,
    badNote: 'useDouble nhận số 0 lúc gọi, và giữ con số đó mãi.',
    goodNote: 'useDouble nhận một hàm, gọi lại nó mỗi khi cần giá trị mới.',
  },
  {
    id: 'reassign',
    label: 'Gán lại cả reactive',
    source: 'số trong object mới',
    start: 0,
    action: 'thay cả object',
    bad: ['let state = reactive({ count: 0 })', 'state = reactive({ count: n })'],
    good: ['const state = ref({ count: 0 })', 'state.value = { count: n }'],
    badKind: 'frozen',
    badValue: (_, s) => `{{ state.count }} = ${s}`,
    goodValue: (n) => `{{ state.count }} = ${n}`,
    badNote: 'Biến state trỏ sang proxy mới, nhưng không ai được báo. Template vẫn đứng ở proxy cũ.',
    goodNote: 'Gán .value đi qua cửa của ref, nên template được báo.',
  },
  {
    id: 'props',
    label: 'Destructure props (3.5)',
    source: 'props.id',
    start: 1,
    action: 'cha đổi :id',
    bad: ['const { id } = defineProps<{ id: number }>()', 'watch(id, loadUser)'],
    good: ['const { id } = defineProps<{ id: number }>()', 'watch(() => id, loadUser)'],
    badKind: 'compile',
    badValue: () => 'không biên dịch được',
    goodValue: (n, s) => `loadUser chạy ${n - s}×`,
    badNote: '{{ id }} trong template vẫn reactive, vì compiler đổi id thành props.id. Nhưng truyền id thẳng vào watch là truyền một giá trị.',
    goodNote: 'Getter () => id được compiler đổi thành () => props.id.',
    error: '[@vue/compiler-sfc] "id" is a destructured prop and should not be passed directly to watch(). Pass a getter () => id instead.',
  },
]

export function DestructureTraps() {
  const [caseId, setCaseId] = useState(CASES[0].id)
  const c = CASES.find((x) => x.id === caseId)!
  const [n, setN] = useState(c.start)
  const { flash, isOn } = useFlash()

  const pick = (id: string) => {
    const next = CASES.find((x) => x.id === id)!
    setCaseId(id)
    setN(next.start)
  }

  const act = () => {
    setN((v) => v + 1)
    flash(['source', 'good'])
  }

  const changed = n !== c.start

  return (
    <Figure
      kicker="Hình 6 · Bẫy destructure"
      title="Mang giá trị ra khỏi cổng là mất liên lạc"
      caption={
        <>
          Chọn một tình huống rồi đổi nguồn vài lần. Cột trái là cách viết hay gặp, cột phải
          là cách sửa. Cả năm tình huống có chung một gốc: biểu thức như{' '}
          <code>state.count</code> được tính ngay tại chỗ và cho ra một giá trị thường.
          Muốn giữ liên kết thì truyền <strong>cái hộp</strong> (ref), một{' '}
          <strong>hàm getter</strong>, hoặc dùng <code>toRefs</code> / <code>toRef</code>.
        </>
      }
    >
      <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Chọn tình huống">
        {CASES.map((x, i) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={x.id === caseId}
            onClick={() => pick(x.id)}
            className={cx(
              'rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors',
              x.id === caseId
                ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-emerald-950'
                : 'border-fd-border bg-fd-background text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground',
            )}
          >
            {i + 1}. {x.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <DemoButton onClick={act}>{c.action}</DemoButton>
        <DemoButton tone="ghost" disabled={!changed} onClick={() => setN(c.start)}>Làm lại</DemoButton>
        <span
          className={cx(
            'rounded-lg border px-3 py-1 font-mono text-sm transition-colors duration-300',
            isOn('source') ? 'border-amber-500 bg-amber-400/15' : 'border-fd-border bg-fd-background',
          )}
        >
          {c.source} = {n}
        </span>
      </div>

      <div className="grid gap-4">
        <Side
          tone="bad"
          lines={c.bad}
          value={c.badValue(n, c.start)}
          note={c.badNote}
          on={false}
          kind={c.badKind}
          error={c.error}
          changed={changed}
        />
        <Side tone="good" lines={c.good} value={c.goodValue(n, c.start)} note={c.goodNote} on={isOn('good')} changed={changed} />
      </div>
    </Figure>
  )
}

function Side({
  tone,
  lines,
  value,
  note,
  on,
  kind,
  error,
  changed,
}: {
  tone: 'bad' | 'good'
  lines: string[]
  value: string
  note: string
  on: boolean
  kind?: Case['badKind']
  error?: string
  changed: boolean
}) {
  const bad = tone === 'bad'
  return (
    <div
      className={cx(
        'min-w-0 rounded-xl border p-3 transition-colors duration-300',
        bad ? 'border-rose-500/40 bg-rose-500/5' : on ? 'border-emerald-500 bg-emerald-500/10' : 'border-emerald-500/40 bg-emerald-500/5',
      )}
    >
      <p className={cx('mb-2 flex items-center gap-1.5 text-xs font-bold', bad ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-400')}>
        {bad ? <X className="size-3.5" aria-hidden /> : <Check className="size-3.5" aria-hidden />}
        {bad ? 'Hay gặp' : 'Cách sửa'}
      </p>
      <CodeLines lines={lines.map((text) => ({ text }))} />
      {bad && kind !== 'frozen' && error ? (
        <p className="mt-2 flex gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1.5 font-mono text-[0.7rem] leading-5 text-rose-700 dark:text-rose-300">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span className="min-w-0 break-words">{error}</span>
        </p>
      ) : null}
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-fd-border bg-fd-background px-3 py-2">
        {bad ? <Unlink className="size-4 shrink-0 text-rose-600" aria-hidden /> : <Link2 className="size-4 shrink-0 text-emerald-600" aria-hidden />}
        <span className="font-mono text-base font-bold tabular-nums text-fd-foreground">{value}</span>
        {bad && kind === 'frozen' && changed ? (
          <span className="ml-auto text-[0.7rem] font-semibold text-rose-700 dark:text-rose-300">đứng yên</span>
        ) : null}
      </div>
      <p className="mt-2 text-xs leading-5 text-fd-muted-foreground">{note}</p>
    </div>
  )
}
