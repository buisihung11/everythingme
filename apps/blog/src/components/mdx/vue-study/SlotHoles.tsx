import { useState, type ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { CodeLines, Figure, Tabs, Toggle, cx } from './ui'

type View = 'parent' | 'child' | 'react'

const CHILD = [
  '<!-- Card.vue -->',
  '<script setup>',
  'const expanded = ref(false)',
  '</script>',
  '',
  '<template>',
  '  <article class="card">',
  '    <header>',
  '      <slot name="header">Không có tiêu đề</slot>',
  '    </header>',
  '    <slot>Nội dung trống</slot>',
  '    <footer v-if="$slots.footer">',
  '      <slot name="footer" />',
  '    </footer>',
  '  </article>',
  '</template>',
]

export function SlotHoles() {
  const [header, setHeader] = useState(true)
  const [body, setBody] = useState(true)
  const [footer, setFooter] = useState(false)
  const [childVar, setChildVar] = useState(false)
  const [view, setView] = useState<View>('parent')

  const bodyLine = childVar ? '<p>Đang mở: {{ expanded }}</p>' : '<p>Bạn có 3 thông báo mới.</p>'
  const parent = [
    '<Card>',
    ...(header ? ['  <template #header>', '    <h3>Xin chào, {{ user.name }}</h3>', '  </template>'] : []),
    ...(body ? [`  ${bodyLine}`] : []),
    ...(footer ? ['  <template #footer>', '    <button>Xem tất cả</button>', '  </template>'] : []),
    '</Card>',
  ]
  const react = [
    '<Card',
    ...(header ? ['  header={<h3>Xin chào, {user.name}</h3>}'] : []),
    ...(footer ? ['  footer={<button>Xem tất cả</button>}'] : []),
    body ? '>' : '/>',
    ...(body ? [childVar ? '  <p>Đang mở: {expanded}</p> // ReferenceError' : '  <p>Bạn có 3 thông báo mới.</p>', '</Card>'] : []),
  ]
  const lines = view === 'parent' ? parent : view === 'child' ? CHILD : react

  return (
    <Figure
      kicker="Hình 5 · Slots"
      title="Con chừa lỗ trên khuôn, cha lắp nội dung vào"
      caption={
        <>
          Bật tắt từng phần cha truyền vào. Lỗ nào cha không lắp thì con hiện nội dung dự phòng
          (fallback) viết sẵn bên trong thẻ <code>slot</code>. Con có thể kiểm tra{' '}
          <code>$slots.footer</code> để bỏ hẳn phần bọc ngoài khi lỗ trống. Thử ô cuối: nội
          dung slot được biên dịch trong scope của <strong>cha</strong>, nên nó đọc được{' '}
          <code>user</code> của cha nhưng không đọc được <code>expanded</code> của con.
        </>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Toggle checked={header} onChange={setHeader} label="#header" />
        <Toggle checked={body} onChange={setBody} label="#default" />
        <Toggle checked={footer} onChange={setFooter} label="#footer" />
        <Toggle checked={childVar} onChange={setChildVar} label="Slot đọc biến của con" disabled={!body} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3">
          <article className="rounded-2xl border-2 border-fd-foreground/25 bg-fd-card p-3">
            <p className="mb-2 font-mono text-[0.7rem] font-bold text-fd-muted-foreground">{'<article class="card">'} · khuôn của Card</p>
            <Hole name='slot name="header"' filled={header}>
              {header ? <span className="text-base font-bold">Xin chào, An</span> : 'Không có tiêu đề'}
            </Hole>
            <Hole name="slot (default)" filled={body}>
              {body ? (childVar ? 'Đang mở: ' : 'Bạn có 3 thông báo mới.') : 'Nội dung trống'}
            </Hole>
            {footer ? (
              <Hole name='slot name="footer"' filled>
                <span className="inline-block rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white dark:bg-emerald-500 dark:text-emerald-950">Xem tất cả</span>
              </Hole>
            ) : (
              <p className="mt-2 rounded-lg border border-dashed border-fd-border px-3 py-2 font-mono text-[0.7rem] text-fd-muted-foreground">
                {'<footer v-if="$slots.footer">'}: cha không lắp nên không render
              </p>
            )}
          </article>
          <div className="flex flex-wrap gap-3 text-[0.7rem] text-fd-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-sky-500" aria-hidden /> cha lắp vào</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm border border-dashed border-fd-muted-foreground" aria-hidden /> fallback của con</span>
          </div>
          {childVar && body ? (
            <p role="alert" className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 font-mono text-[0.7rem] leading-5 text-amber-800 dark:text-amber-300">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span className="min-w-0 break-words">[Vue warn]: Property "expanded" was accessed during render but is not defined on instance.</span>
            </p>
          ) : null}
        </div>

        <div className="min-w-0 space-y-2">
          <Tabs
            label="Xem code"
            value={view}
            onChange={setView}
            items={[
              { value: 'parent', label: 'Cha (Vue)' },
              { value: 'child', label: 'Card.vue' },
              { value: 'react', label: 'React tương đương' },
            ]}
          />
          <CodeLines
            lines={lines.map((text) => ({ text }))}
            lineClass={(l) => (l.text.includes('expanded') && childVar && view !== 'child' ? 'bg-amber-400/20' : undefined)}
          />
          <p className="text-xs leading-5 text-fd-muted-foreground">
            {view === 'react'
              ? 'React: default slot là children, named slot là một prop nhận ReactNode. Fallback phải tự viết: header ?? "Không có tiêu đề".'
              : view === 'child'
                ? 'Nội dung giữa <slot> và </slot> là fallback. #header là viết tắt của v-slot:header.'
                : 'Nội dung không nằm trong <template #…> nào sẽ vào slot default.'}
          </p>
        </div>
      </div>
    </Figure>
  )
}

function Hole({ name, filled, children }: { name: string; filled: boolean; children: ReactNode }) {
  return (
    <div
      className={cx(
        'mt-2 rounded-lg border-2 px-3 py-2 text-sm transition-colors duration-300',
        filled ? 'border-sky-500/60 bg-sky-500/10 text-fd-foreground' : 'border-dashed border-fd-border bg-fd-background text-fd-muted-foreground italic',
      )}
    >
      <span className="block font-mono text-[0.65rem] font-semibold not-italic text-fd-muted-foreground">{`<${name}>`}</span>
      {children}
    </div>
  )
}
