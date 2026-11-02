import { useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { CodeLines, Figure, Tabs, cx } from './ui'

type Mode = 'default' | 'fixed' | 'multi'
type Seg = { text: string; from?: 'parent' | 'child' }

const PARENT = [
  '<BaseInput',
  '  label="Email"',
  '  v-model="email"',
  '  class="w-full"',
  '  placeholder="a@b.c"',
  '  data-test="email"',
  '  @focus="onFocus"',
  '/>',
]

const CHILD: Record<Mode, string[]> = {
  default: [
    'defineProps<{ label: string }>()',
    'const model = defineModel<string>()',
    '',
    '<label class="field">',
    '  <span>{{ label }}</span>',
    '  <input v-model="model" />',
    '</label>',
  ],
  fixed: [
    'defineProps<{ label: string }>()',
    'const model = defineModel<string>()',
    'defineOptions({ inheritAttrs: false })',
    '',
    '<label class="field">',
    '  <span>{{ label }}</span>',
    '  <input v-model="model" v-bind="$attrs" />',
    '</label>',
  ],
  multi: [
    'defineProps<{ label: string }>()',
    'const model = defineModel<string>()',
    '',
    '<!-- hai root, không có phần tử bọc -->',
    '<span>{{ label }}</span>',
    '<input v-model="model" />',
  ],
}

const P = (text: string): Seg => ({ text, from: 'parent' })
const C = (text: string): Seg => ({ text, from: 'child' })
const T = (text: string): Seg => ({ text })

const DOM: Record<Mode, Seg[][]> = {
  default: [
    [T('<label class="'), C('field'), T(' '), P('w-full'), T('" '), P('placeholder="a@b.c"'), T(' '), P('data-test="email"'), T('>')],
    [T('  '), P('⚡ focus listener (trên label)')],
    [T('  <span>Email</span>')],
    [T('  <input>')],
    [T('</label>')],
  ],
  fixed: [
    [T('<label class="'), C('field'), T('">')],
    [T('  <span>Email</span>')],
    [T('  <input class="'), P('w-full'), T('" '), P('placeholder="a@b.c"'), T(' '), P('data-test="email"'), T('>')],
    [T('  '), P('⚡ focus listener (trên input)')],
    [T('</label>')],
  ],
  multi: [[T('<span>Email</span>')], [T('<input>')]],
}

const VERDICT: Record<Mode, string> = {
  default:
    'class được gộp vào root (field + w-full), nhưng placeholder và listener focus cũng rơi lên <label>, nơi chúng vô dụng. focus không nổi bọt nên onFocus không bao giờ chạy.',
  fixed:
    'inheritAttrs: false tắt việc tự gắn lên root. v-bind="$attrs" đặt mọi thứ, kể cả class, lên đúng <input>. Thử bấm vào ô input ở bên.',
  multi:
    'Component có nhiều root thì Vue không biết gắn attrs vào đâu, nên bỏ qua và cảnh báo. Hãy chỉ định rõ bằng v-bind="$attrs".',
}

export function AttrsFallthrough() {
  const [mode, setMode] = useState<Mode>('default')
  const [focusCount, setFocusCount] = useState(0)
  const [email, setEmail] = useState('')

  const choose = (m: Mode) => {
    setMode(m)
    setFocusCount(0)
  }

  return (
    <Figure
      kicker="Hình 7 · Fallthrough attributes"
      title="Thứ không khai báo sẽ rơi xuống phần tử root"
      caption={
        <>
          Cha truyền sáu thứ, con chỉ khai báo <code>label</code> (prop) và{' '}
          <code>v-model</code>. Bốn thứ còn lại nằm trong <code>$attrs</code> và mặc định rơi
          xuống phần tử root. Với component bọc một input, root thường là chỗ sai. So ba chế
          độ, để ý ô input thật bên dưới có placeholder không và bộ đếm focus có tăng không.
        </>
      }
    >
      <div className="mb-4">
        <Tabs
          label="Chế độ"
          value={mode}
          onChange={choose}
          items={[
            { value: 'default', label: 'Mặc định' },
            { value: 'fixed', label: 'inheritAttrs: false' },
            { value: 'multi', label: 'Nhiều root' },
          ]}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <p className="mb-1 text-xs font-bold text-fd-muted-foreground">Cha truyền</p>
              <CodeLines
                lines={PARENT.map((text) => ({ text }))}
                lineClass={(l) => (/class|placeholder|data-test|@focus/.test(l.text) ? 'text-sky-700 dark:text-sky-300' : undefined)}
              />
            </div>
            <div className="min-w-0">
              <p className="mb-1 text-xs font-bold text-fd-muted-foreground">$attrs con nhận</p>
              <CodeLines
                lines={[
                  { text: '{' },
                  { text: "  class: 'w-full'," },
                  { text: "  placeholder: 'a@b.c'," },
                  { text: "  'data-test': 'email'," },
                  { text: '  onFocus: fn,' },
                  { text: '}' },
                ]}
                lineClass={(_, i) => (i > 0 && i < 5 ? 'text-sky-700 dark:text-sky-300' : undefined)}
              />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold text-fd-muted-foreground">Con: BaseInput.vue</p>
            <CodeLines
              lines={CHILD[mode].map((text) => ({ text }))}
              lineClass={(l) => (/inheritAttrs|\$attrs/.test(l.text) ? 'bg-emerald-500/15' : undefined)}
            />
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          <div>
            <p className="mb-1 text-xs font-bold text-fd-muted-foreground">DOM thật sau khi render</p>
            <div className="overflow-x-auto rounded-xl border border-fd-border bg-fd-background py-2 font-mono text-[0.75rem] leading-6">
              {DOM[mode].map((line, i) => (
                <div key={i} className="whitespace-pre px-3">
                  {line.map((seg, j) => (
                    <span
                      key={j}
                      className={cx(
                        seg.from === 'parent' && 'rounded bg-sky-500/15 text-sky-800 dark:text-sky-200',
                        seg.from === 'child' && 'rounded bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
                      )}
                    >
                      {seg.text}
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-3 text-[0.7rem] text-fd-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-sky-500" aria-hidden /> từ $attrs của cha</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-emerald-500" aria-hidden /> của con</span>
            </div>
          </div>

          <div className="rounded-xl border border-fd-border bg-fd-background p-3">
            <p className="text-xs font-semibold text-fd-muted-foreground">Ô input thật</p>
            {mode === 'multi' ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span>Email</span>
                <input value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email (nhiều root)" className="rounded-md border border-fd-border bg-fd-card px-2 py-1 text-fd-foreground outline-none focus:border-emerald-500" />
              </div>
            ) : (
              <label className={cx('mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-fd-border p-2 text-sm', mode === 'default' && 'w-full')}>
                <span>Email</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mode === 'fixed' ? 'a@b.c' : undefined}
                  onFocus={mode === 'fixed' ? () => setFocusCount((n) => n + 1) : undefined}
                  className={cx('min-w-0 rounded-md border border-fd-border bg-fd-card px-2 py-1 text-fd-foreground outline-none focus:border-emerald-500', mode === 'fixed' && 'w-full')}
                />
              </label>
            )}
            <p className="mt-2 font-mono text-[0.72rem] text-fd-muted-foreground">onFocus đã chạy: {focusCount} lần</p>
          </div>

          <p className={cx('rounded-lg border px-3 py-2 text-sm leading-6', mode === 'fixed' ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-amber-500/40 bg-amber-500/5')}>
            {VERDICT[mode]}
          </p>
          {mode === 'multi' ? (
            <div role="alert" className="space-y-1.5">
              {[
                '[Vue warn]: Extraneous non-props attributes (class, placeholder, data-test) were passed to component but could not be automatically inherited because component renders fragment or text or teleport root nodes.',
                '[Vue warn]: Extraneous non-emits event listeners (focus) were passed to component but could not be automatically inherited because component renders fragment or text root nodes.',
              ].map((w) => (
                <p key={w} className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 font-mono text-[0.7rem] leading-5 text-amber-800 dark:text-amber-300">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span className="min-w-0 break-words">{w}</span>
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Figure>
  )
}
