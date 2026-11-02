import { useState } from 'react'
import { DemoButton, Figure, Tabs, cx } from './ui'

type Mode = 'vif' | 'keep' | 'wrap'

const COPY: Record<Mode, { label: string; off: string; on: string }> = {
  vif: {
    label: 'v-if',
    off: 'Unmount. State của editor bị hủy.',
    on: 'Mount instance mới, bản nháp về 0.',
  },
  keep: {
    label: 'KeepAlive',
    off: 'onDeactivated. Instance nằm trong cache.',
    on: 'onActivated. Bản nháp còn nguyên.',
  },
  wrap: {
    label: 'v-if bọc KeepAlive',
    off: 'KeepAlive bị unmount theo. Cache mất.',
    on: 'KeepAlive mới, cache trống, bản nháp về 0.',
  },
}

export function KeepAliveSwitch() {
  const [mode, setMode] = useState<Mode>('keep')
  const [open, setOpen] = useState(true)
  const [draft, setDraft] = useState(0)
  const [cache, setCache] = useState<number | null>(null)
  const [note, setNote] = useState(COPY.keep.on)

  const changeMode = (next: Mode) => {
    setMode(next)
    setOpen(true)
    setDraft(0)
    setCache(null)
    setNote(COPY[next].on)
  }

  const toggle = () => {
    if (open) {
      if (mode === 'keep') setCache(draft)
      else setCache(null)
      if (mode !== 'keep') setDraft(0)
      setOpen(false)
      setNote(COPY[mode].off)
      return
    }
    if (mode === 'keep') setDraft(cache ?? 0)
    else setDraft(0)
    setOpen(true)
    setNote(COPY[mode].on)
  }

  return (
    <Figure
      kicker="Hình 2 · KeepAlive"
      title="Cache sống cùng KeepAlive, không sống cùng v-if bên ngoài"
      caption="KeepAlive bọc component động: tắt là deactivated, bật lại là activated. Đặt v-if lên chính KeepAlive thì cả cache bị unmount. v-show không cần KeepAlive vì instance không rời DOM."
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs
          label="Cách bật tắt"
          value={mode}
          onChange={changeMode}
          items={[
            { value: 'vif', label: 'v-if' },
            { value: 'keep', label: 'KeepAlive' },
            { value: 'wrap', label: 'v-if ngoài' },
          ]}
        />
        <DemoButton tone="ghost" onClick={toggle}>
          {open ? 'Tắt editor' : 'Mở editor'}
        </DemoButton>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div
          className={cx(
            'rounded-xl border p-3',
            open ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-fd-border bg-fd-muted/40',
          )}
        >
          <p className="text-xs text-fd-muted-foreground">{open ? 'Editor đang mở' : 'Editor không trong DOM'}</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums">{open ? draft : '—'}</p>
          {open ? (
            <DemoButton className="mt-3" onClick={() => setDraft((n) => n + 1)}>
              Sửa nháp +1
            </DemoButton>
          ) : null}
        </div>
        <div className="rounded-xl border border-fd-border bg-fd-background p-3">
          <p className="text-xs text-fd-muted-foreground">cache của KeepAlive</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums">{cache === null ? 'trống' : cache}</p>
          <p className="mt-2 text-sm leading-6 text-fd-foreground">{note}</p>
        </div>
      </div>
    </Figure>
  )
}
