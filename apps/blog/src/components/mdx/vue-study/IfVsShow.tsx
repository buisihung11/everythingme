import { useState, type ReactNode } from 'react'
import { Blinds, Hammer } from 'lucide-react'
import { DemoButton, Figure, Stat, cx } from './ui'

export function IfVsShow() {
  const [visible, setVisible] = useState(false)
  const [ifMounts, setIfMounts] = useState(0)
  const [toggles, setToggles] = useState(0)

  const toggle = () => {
    if (!visible) setIfMounts((n) => n + 1)
    setVisible((v) => !v)
    setToggles((n) => n + 1)
  }

  return (
    <Figure
      kicker="Hình 7 · v-if và v-show"
      title="v-if xây rồi đập. v-show chỉ kéo rèm."
      caption="v-if thật sự tạo và hủy phần tử, kèm cả component con và state bên trong. Nếu điều kiện ban đầu là false thì Vue không render gì cả. v-show luôn render một lần rồi chỉ bật tắt display: none. Thứ bật tắt liên tục (tab, dropdown) thì dùng v-show. Thứ hiếm khi hiện (modal lỗi, phần chỉ admin thấy) thì dùng v-if."
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <DemoButton onClick={toggle}>open = {String(!visible)}</DemoButton>
        <span className="text-sm text-fd-muted-foreground">Đã bật tắt {toggles} lần</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Column
          icon={<Hammer className="size-4" aria-hidden />}
          title='<Panel v-if="open" />'
          tone="amber"
          dom={visible ? ['<div class="panel">', '  <p>Nội dung</p>', '</div>'] : ['<!--v-if-->']}
          domNote={visible ? 'Phần tử vừa được xây mới' : 'Chỉ còn một comment giữ chỗ, phần tử đã bị hủy'}
          stats={[
            { label: 'Số lần mount', value: ifMounts },
            { label: 'State bên trong', value: visible ? 'mới tinh' : 'mất' },
          ]}
          visible={visible}
        />
        <Column
          icon={<Blinds className="size-4" aria-hidden />}
          title='<Panel v-show="open" />'
          tone="emerald"
          dom={[`<div class="panel"${visible ? '' : ' style="display: none;"'}>`, '  <p>Nội dung</p>', '</div>']}
          domNote={visible ? 'Rèm đang mở' : 'Phần tử vẫn nằm trong DOM, chỉ bị ẩn'}
          stats={[
            { label: 'Số lần mount', value: 1 },
            { label: 'State bên trong', value: 'giữ nguyên' },
          ]}
          visible={visible}
        />
      </div>
    </Figure>
  )
}

function Column({
  icon, title, tone, dom, domNote, stats, visible,
}: {
  icon: ReactNode
  title: string
  tone: 'amber' | 'emerald'
  dom: string[]
  domNote: string
  stats: Array<{ label: string; value: string | number }>
  visible: boolean
}) {
  return (
    <section className="min-w-0 space-y-3">
      <p className={cx('flex items-center gap-2 font-mono text-sm font-bold', tone === 'amber' ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400')}>
        {icon} {title}
      </p>
      <div className="relative h-24 overflow-hidden rounded-xl border border-fd-border bg-fd-background">
        <div
          className={cx(
            'absolute inset-3 flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-300',
            tone === 'amber' ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200' : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
            visible ? 'scale-100 opacity-100' : tone === 'amber' ? 'scale-75 opacity-0' : 'opacity-0',
          )}
        >
          Panel
        </div>
        {tone === 'emerald' ? (
          <div
            className={cx('absolute inset-x-0 top-0 bg-fd-muted transition-[height] duration-300', visible ? 'h-0' : 'h-full')}
            aria-hidden
          />
        ) : null}
      </div>
      <div className="rounded-xl border border-fd-border bg-fd-background px-3 py-2 font-mono text-[0.75rem] leading-5">
        {dom.map((l) => <div key={l} className="whitespace-pre">{l}</div>)}
        <p className="mt-1 font-sans text-xs text-fd-muted-foreground">{domNote}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => <Stat key={s.label} label={s.label} value={s.value} />)}
      </div>
    </section>
  )
}
