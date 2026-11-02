import { useState } from 'react'
import { CodeLines, DemoButton, Figure, Tabs, cx } from './ui'

type Bug = 'peel' | 'reactive'

const CODE = {
  peel: [
    { text: 'const on = useToggle() // Ref<boolean>' },
    { text: 'const { value } = on    // boolean bị copy' },
    { text: 'on.value = !on.value    // hộp đổi, value thì không' },
  ],
  reactive: [
    { text: 'return reactive({ on: false })' },
    { text: 'const { on } = useToggle()' },
    { text: '// on là boolean, ra khỏi Proxy' },
  ],
}

export function UseToggleLab() {
  const [a, setA] = useState(false)
  const [b, setB] = useState(false)
  const [box, setBox] = useState(false)
  const [stuck, setStuck] = useState(false)
  const [bug, setBug] = useState<Bug>('peel')

  const retake = () => setStuck(box)

  return (
    <Figure
      kicker="Hình 1 · Mỗi lần gọi một bản"
      title="useToggle() không chia sẻ state. Bóc ref thì mất liên kết."
      caption="Hai panel gọi useToggle() hai lần, giống hai custom hook: mỗi nơi một ref. Bẫy phía dưới là lấy .value ra khỏi ref, hoặc return reactive() rồi destructure. Cả hai đều để lại một boolean thường."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <ToggleCard
          title="PanelA"
          note="const { on } = useToggle()"
          on={a}
          onToggle={() => setA((v) => !v)}
        />
        <ToggleCard
          title="PanelB"
          note="const { on } = useToggle()"
          on={b}
          onToggle={() => setB((v) => !v)}
        />
      </div>

      <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-fd-foreground">Bẫy destructure</p>
          <Tabs
            label="Kiểu bẫy"
            value={bug}
            onChange={(next) => {
              setBug(next)
              setBox(false)
              setStuck(false)
            }}
            items={[
              { value: 'peel', label: 'bóc .value' },
              { value: 'reactive', label: 'return reactive()' },
            ]}
          />
        </div>
        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          <CodeLines lines={CODE[bug]} />
          <div className="grid grid-cols-2 gap-2">
            <Readout label="state thật" value={box ? 'true' : 'false'} live />
            <Readout label="template đọc" value={stuck ? 'true' : 'false'} live={false} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <DemoButton onClick={() => setBox((v) => !v)}>toggle()</DemoButton>
          <DemoButton tone="ghost" onClick={retake}>
            destructure lại
          </DemoButton>
        </div>
        <p className="mt-2 text-sm leading-6 text-fd-muted-foreground">
          {bug === 'peel'
            ? 'const { value } = on chụp boolean tại đúng dòng đó. toggle() sửa hộp, value không đi theo. Bấm "destructure lại" để chụp một lần nữa, rồi toggle tiếp.'
            : 'Tài liệu Vue khuyên return object thường chứa ref, để const { on } = useToggle() vẫn giữ ref. return reactive() rồi destructure là ra khỏi Proxy, cùng bệnh với Bài 2.'}
        </p>
      </div>
    </Figure>
  )
}

function ToggleCard({
  title,
  note,
  on,
  onToggle,
}: {
  title: string
  note: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <div className="rounded-xl border border-fd-border bg-fd-background p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-sm font-bold">{title}</p>
        <span
          className={cx(
            'rounded-full px-2 py-0.5 font-mono text-xs font-bold',
            on
              ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
              : 'bg-fd-muted text-fd-muted-foreground',
          )}
        >
          {on ? 'on' : 'off'}
        </span>
      </div>
      <p className="mt-1 font-mono text-[0.7rem] text-fd-muted-foreground">{note}</p>
      <DemoButton className="mt-3" tone="ghost" onClick={onToggle}>
        toggle()
      </DemoButton>
    </div>
  )
}

function Readout({ label, value, live }: { label: string; value: string; live: boolean }) {
  return (
    <div
      className={cx(
        'rounded-lg border px-3 py-2',
        live ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-rose-500/30 bg-rose-500/10',
      )}
    >
      <div className="text-[0.68rem] text-fd-muted-foreground">{label}</div>
      <div className="font-mono text-lg font-bold">{value}</div>
    </div>
  )
}
