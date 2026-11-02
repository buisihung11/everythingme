import { useState } from 'react'
import { DemoButton, Figure, Toggle, cx } from './ui'

const NAMES = ['An', 'Bảo', 'Chi']

export function MemoDepGap() {
  const [name, setName] = useState(NAMES[0])
  const [selected, setSelected] = useState(false)
  const [trackName, setTrackName] = useState(false)
  const [painted, setPainted] = useState({ name: NAMES[0], selected: false })

  const paint = (nextName: string, nextSelected: boolean, track: boolean) => {
    const selectedChanged = nextSelected !== painted.selected
    const nameChanged = nextName !== painted.name
    setName(nextName)
    setSelected(nextSelected)
    setTrackName(track)
    if (selectedChanged || (track && nameChanged)) {
      setPainted({ name: nextName, selected: nextSelected })
    }
  }

  const rename = () => {
    const next = NAMES[(NAMES.indexOf(name) + 1) % NAMES.length]
    paint(next, selected, trackName)
  }

  return (
    <Figure
      kicker="Hình 3 · v-memo"
      title="Thiếu một dependency là UI đứng yên"
      caption="v-memo nhận một mảng deps. Mảng rỗng thì giống v-once. Đặt trên cùng element với v-for, không đặt ở con bên trong. Chỉ dùng khi bạn kể được hết thứ làm khúc template đó đổi."
    >
      <p className="font-mono text-xs text-fd-muted-foreground">
        {trackName ? 'v-memo="[selected, name]"' : 'v-memo="[selected]"'}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Card title="state" name={name} selected={selected} fresh />
        <Card title="DOM đã memo" name={painted.name} selected={painted.selected} fresh={painted.name === name && painted.selected === selected} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <DemoButton onClick={rename}>Đổi tên</DemoButton>
        <DemoButton tone="ghost" onClick={() => paint(name, !selected, trackName)}>
          Đổi selected
        </DemoButton>
        <Toggle
          checked={trackName}
          onChange={(checked) => paint(name, selected, checked)}
          label="thêm name vào deps"
        />
      </div>
      <p className="mt-3 text-sm leading-6 text-fd-muted-foreground">
        {painted.name === name
          ? 'DOM khớp state. Đổi selected cũng kéo name mới vào, vì cả khúc template được vẽ lại.'
          : 'name đã đổi nhưng không nằm trong mảng deps, nên DOM giữ chữ cũ. Thêm name vào deps rồi đổi tên lại.'}
      </p>
    </Figure>
  )
}

function Card({ title, name, selected, fresh }: { title: string; name: string; selected: boolean; fresh: boolean }) {
  return (
    <div
      className={cx(
        'rounded-xl border p-3',
        fresh ? 'border-fd-border bg-fd-background' : 'border-rose-500/40 bg-rose-500/10',
      )}
    >
      <p className="text-xs text-fd-muted-foreground">{title}</p>
      <p className="mt-1 font-mono text-lg font-bold">{name}</p>
      <p className="font-mono text-xs">{selected ? 'selected' : 'idle'}</p>
    </div>
  )
}
