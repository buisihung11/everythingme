import { useState } from 'react'
import { DemoButton, Figure, cx } from './ui'

type Site = 'setup' | 'click' | 'branch'

const SITES: Array<{ id: Site; label: string; ok: boolean; detail: string }> = [
  {
    id: 'setup',
    label: 'Trong setup',
    ok: true,
    detail:
      'Vue đang có active instance. watch rơi vào túi của component. onScopeDispose chạy khi unmount, interval được clear.',
  },
  {
    id: 'click',
    label: 'Trong onClick',
    ok: false,
    detail:
      'Lúc bấm nút không còn active instance. Vue cảnh báo. Watcher không thuộc túi nào, nên unmount không dừng nó.',
  },
  {
    id: 'branch',
    label: 'Trong if (false)',
    ok: false,
    detail:
      'setup chạy một lần. Nhánh sai thì composable không được gọi, và không có lần setup thứ hai để gọi bù. Khác React: Vue không crash, nó chỉ im lặng bỏ sót.',
  },
]

export function CallSiteGate() {
  const [site, setSite] = useState<Site | null>(null)
  const [unmounted, setUnmounted] = useState(false)
  const picked = SITES.find((s) => s.id === site)

  const choose = (id: Site) => {
    setSite(id)
    setUnmounted(false)
  }

  const leaked = site === 'click' && unmounted
  const stopped = site === 'setup' && unmounted

  return (
    <Figure
      kicker="Hình 3 · Đúng chỗ"
      title="Composable chỉ gọi đồng bộ trong setup"
      caption="script setup là chỗ duy nhất Vue tự khôi phục active instance sau await. Options API thì gọi trong setup() và return các ref ra ngoài."
    >
      <div className="flex flex-wrap gap-2">
        {SITES.map((s) => (
          <DemoButton key={s.id} tone={site === s.id ? 'primary' : 'ghost'} onClick={() => choose(s.id)}>
            {s.label}
          </DemoButton>
        ))}
        <DemoButton tone="danger" disabled={site === null || site === 'branch'} onClick={() => setUnmounted(true)}>
          Unmount
        </DemoButton>
      </div>

      <div
        className={cx(
          'mt-4 rounded-xl border p-4',
          !picked && 'border-fd-border bg-fd-background',
          picked?.ok && !unmounted && 'border-emerald-500/40 bg-emerald-500/10',
          stopped && 'border-fd-border bg-fd-muted/40',
          picked && !picked.ok && 'border-rose-500/40 bg-rose-500/10',
        )}
      >
        <p className="font-mono text-sm font-bold">
          {!picked && 'Chưa gọi useTicker()'}
          {picked && !unmounted && (picked.ok ? 'interval đang chạy, nằm trong scope' : 'không đăng ký được')}
          {stopped && 'onScopeDispose đã clear interval'}
          {leaked && 'interval vẫn chạy sau unmount'}
          {site === 'branch' && unmounted && 'không có gì để dọn'}
        </p>
        <p className="mt-2 text-sm leading-6 text-fd-foreground">{picked?.detail ?? 'Chọn một chỗ gọi.'}</p>
      </div>
    </Figure>
  )
}
