import { useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { CodeLines, Figure, Tabs, cx } from './ui'

type Decl = 'type' | 'runtime'
type Choice = { label: string; attr: string | null }

const PROPS = {
  label: [
    { label: 'không truyền', attr: null },
    { label: 'label="Lưu"', attr: 'label="Lưu"' },
  ],
  size: [
    { label: 'không truyền', attr: null },
    { label: 'size="lg"', attr: 'size="lg"' },
    { label: 'size="xl"', attr: 'size="xl"' },
  ],
  disabled: [
    { label: 'không truyền', attr: null },
    { label: 'disabled', attr: 'disabled' },
    { label: ':disabled="false"', attr: ':disabled="false"' },
    { label: 'disabled="false"', attr: 'disabled="false"' },
  ],
  count: [
    { label: 'không truyền', attr: null },
    { label: 'count="3"', attr: 'count="3"' },
    { label: ':count="3"', attr: ':count="3"' },
  ],
} satisfies Record<string, Choice[]>

type PropName = keyof typeof PROPS
type Picks = Record<PropName, number>

const DECLS: Record<Decl, string[]> = {
  type: [
    'const {',
    "  label, size = 'md', disabled, count = 0,",
    '} = defineProps<{',
    '  label: string',
    "  size?: 'sm' | 'md' | 'lg'",
    '  disabled?: boolean',
    '  count?: number',
    '}>()',
  ],
  runtime: [
    'const props = defineProps({',
    '  label: { type: String, required: true },',
    '  size: {',
    "    type: String, default: 'md',",
    "    validator: (v) => ['sm', 'md', 'lg'].includes(v),",
    '  },',
    '  disabled: Boolean,',
    '  count: { type: Number, default: 0 },',
    '})',
  ],
}

type Row = { name: PropName; value: string; type: string; note?: string; warn?: string; bad?: boolean }

function resolve(picks: Picks, decl: Decl): Row[] {
  const p = (name: PropName) => PROPS[name][picks[name]].label
  const rows: Row[] = []

  rows.push(
    p('label') === 'không truyền'
      ? { name: 'label', value: 'undefined', type: 'undefined', warn: '[Vue warn]: Missing required prop: "label"', bad: true }
      : { name: 'label', value: '"Lưu"', type: 'string' },
  )

  const size = p('size')
  if (size === 'không truyền') rows.push({ name: 'size', value: '"md"', type: 'string', note: 'lấy giá trị mặc định' })
  else if (size === 'size="lg"') rows.push({ name: 'size', value: '"lg"', type: 'string' })
  else
    rows.push(
      decl === 'runtime'
        ? { name: 'size', value: '"xl"', type: 'string', warn: '[Vue warn]: Invalid prop: custom validator check failed for prop "size".', bad: true }
        : { name: 'size', value: '"xl"', type: 'string', note: 'vue-tsc và editor báo lỗi kiểu, nhưng lúc chạy Vue chỉ kiểm tra String, không kiểm tra literal union', bad: true },
    )

  const disabled = p('disabled')
  if (disabled === 'không truyền') rows.push({ name: 'disabled', value: 'false', type: 'boolean', note: 'boolean vắng mặt là false, không phải undefined' })
  else if (disabled === 'disabled') rows.push({ name: 'disabled', value: 'true', type: 'boolean', note: 'attribute không có giá trị nghĩa là true, giống HTML' })
  else if (disabled === ':disabled="false"') rows.push({ name: 'disabled', value: 'false', type: 'boolean' })
  else
    rows.push({
      name: 'disabled',
      value: '"false"',
      type: 'string',
      warn: '[Vue warn]: Invalid prop: type check failed for prop "disabled". Expected Boolean, got String with value "false".',
      note: 'chuỗi "false" là truthy: v-if="disabled" vẫn đúng',
      bad: true,
    })

  const count = p('count')
  if (count === 'không truyền') rows.push({ name: 'count', value: '0', type: 'number', note: 'lấy giá trị mặc định' })
  else if (count === ':count="3"') rows.push({ name: 'count', value: '3', type: 'number' })
  else
    rows.push({
      name: 'count',
      value: '"3"',
      type: 'string',
      warn: '[Vue warn]: Invalid prop: type check failed for prop "count". Expected Number with value 3, got String with value "3".',
      note: 'count + 1 sẽ ra "31"',
      bad: true,
    })

  return rows
}

const INITIAL: Picks = { label: 1, size: 0, disabled: 0, count: 0 }

export function PropsPlayground() {
  const [decl, setDecl] = useState<Decl>('type')
  const [picks, setPicks] = useState<Picks>(INITIAL)
  const rows = resolve(picks, decl)
  const value = (name: PropName) => rows.find((r) => r.name === name)!.value
  const attrs = (Object.keys(PROPS) as PropName[]).map((n) => PROPS[n][picks[n]].attr).filter(Boolean) as string[]

  const label = value('label') === 'undefined' ? '' : 'Lưu'
  const size = value('size').replaceAll('"', '')
  const disabledRaw = value('disabled')
  const disabledTruthy = disabledRaw !== 'false'
  const countRaw = value('count')
  const countPlusOne = countRaw.startsWith('"') ? `${countRaw.replaceAll('"', '')}1` : String(Number(countRaw) + 1)

  return (
    <Figure
      kicker="Hình 2 · defineProps"
      title="Cha viết gì, con nhận được gì?"
      caption={
        <>
          Đổi cách cha truyền từng prop và xem con nhận được giá trị nào, kiểu gì. Ba điều
          hay làm người từ React bất ngờ: prop boolean vắng mặt là <code>false</code>;
          thiếu dấu <code>:</code> thì luôn là chuỗi; và kiểu TypeScript dạng{' '}
          <code>'sm' | 'md' | 'lg'</code> chỉ được kiểm tra lúc build. Muốn kiểm tra lúc
          chạy thì cần <code>validator</code> trong khai báo runtime.
        </>
      }
    >
      <div className="mb-4">
        <Tabs
          label="Cách khai báo props"
          value={decl}
          onChange={setDecl}
          items={[
            { value: 'type', label: 'Khai báo bằng type' },
            { value: 'runtime', label: 'Khai báo runtime' },
          ]}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="min-w-0 space-y-3">
          <p className="text-xs font-bold text-fd-muted-foreground">Con khai báo (MyButton.vue)</p>
          <CodeLines lines={DECLS[decl].map((text) => ({ text }))} />
          <p className="text-xs font-bold text-fd-muted-foreground">Cha truyền</p>
          <div className="space-y-2">
            {(Object.keys(PROPS) as PropName[]).map((name) => (
              <div key={name} className="flex flex-wrap items-center gap-1.5">
                <span className="w-16 shrink-0 font-mono text-xs font-bold text-fd-foreground">{name}</span>
                {PROPS[name].map((choice, i) => (
                  <button
                    key={choice.label}
                    type="button"
                    aria-pressed={picks[name] === i}
                    onClick={() => setPicks((prev) => ({ ...prev, [name]: i }))}
                    className={cx(
                      'rounded-md border px-2 py-0.5 font-mono text-[0.72rem] transition-colors',
                      picks[name] === i
                        ? 'border-sky-500 bg-sky-500/15 font-semibold text-sky-800 dark:text-sky-200'
                        : 'border-fd-border text-fd-muted-foreground hover:bg-fd-accent',
                      choice.attr === null && 'italic',
                    )}
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <CodeLines lines={[{ text: `<MyButton${attrs.length ? ' ' : ''}${attrs.join(' ')} />` }]} />
        </div>

        <div className="min-w-0 space-y-3">
          <div className="overflow-x-auto rounded-xl border border-fd-border">
            <table className="w-full text-left text-[0.8rem]">
              <thead className="bg-fd-muted/60 text-[0.7rem] text-fd-muted-foreground">
                <tr>
                  <th className="px-3 py-1.5 font-semibold">prop</th>
                  <th className="px-3 py-1.5 font-semibold">con nhận</th>
                  <th className="px-3 py-1.5 font-semibold">kiểu</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name} className={cx('border-t border-fd-border align-top', r.bad && 'bg-rose-500/5')}>
                    <td className="px-3 py-1.5 font-mono font-bold">{r.name}</td>
                    <td className="px-3 py-1.5">
                      <span className={cx('font-mono', r.bad ? 'text-rose-700 dark:text-rose-300' : 'text-fd-foreground')}>{r.value}</span>
                      {r.note ? <span className="block text-[0.7rem] leading-4 text-fd-muted-foreground">{r.note}</span> : null}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-fd-muted-foreground">{r.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-fd-border bg-fd-background p-3">
            <p className="text-xs font-semibold text-fd-muted-foreground">Kết quả render</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span
                className={cx(
                  'inline-flex items-center rounded-lg font-semibold text-white',
                  size === 'sm' && 'px-2 py-0.5 text-xs',
                  size === 'md' && 'px-3 py-1 text-sm',
                  (size === 'lg' || size === 'xl') && 'px-4 py-1.5 text-base',
                  disabledTruthy ? 'bg-slate-400 dark:bg-slate-600' : 'bg-emerald-600 dark:bg-emerald-500',
                )}
              >
                {label || '\u00a0'} ({value('count').replaceAll('"', '')})
              </span>
              <span className="font-mono text-[0.72rem] text-fd-muted-foreground">
                disabled là {disabledTruthy ? 'truthy' : 'falsy'} · count + 1 = {countPlusOne}
              </span>
            </div>
          </div>

          <div aria-live="polite" className="space-y-1.5">
            {rows.filter((r) => r.warn).map((r) => (
              <p key={r.name} className="flex gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 font-mono text-[0.7rem] leading-5 text-rose-700 dark:text-rose-300">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span className="min-w-0 break-words">{r.warn}</span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </Figure>
  )
}
