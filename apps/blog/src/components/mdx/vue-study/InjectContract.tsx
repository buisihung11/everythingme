import { useState } from 'react'
import { DemoButton, Figure, Tabs, cx } from './ui'

type Mode = 'ref' | 'readonly' | 'plain'

export function InjectContract() {
  const [mode, setMode] = useState<Mode>('readonly')
  const [source, setSource] = useState('light')
  const [seen, setSeen] = useState('light')
  const [warning, setWarning] = useState<string | null>(null)

  const reset = (next: Mode) => {
    setMode(next)
    setSource('light')
    setSeen('light')
    setWarning(null)
  }

  const providerWrite = () => {
    const next = source === 'light' ? 'dark' : 'light'
    setSource(next)
    if (mode === 'plain') {
      setWarning('Object thường đã đổi trong bộ nhớ, nhưng không ai bị trigger.')
      return
    }
    setSeen(next)
    setWarning(null)
  }

  const consumerWrite = () => {
    if (mode === 'readonly') {
      setWarning('readonly(theme): consumer ghi .value bị chặn. Dev mode cảnh báo.')
      return
    }
    if (mode === 'plain') {
      setWarning('Consumer sửa property của object thường. Provider không re-render vì không có reactive.')
      return
    }
    const next = source === 'light' ? 'dark' : 'light'
    setSource(next)
    setSeen(next)
    setWarning('Ref được provide thẳng: consumer ghi được, và đó thường là chỗ không muốn.')
  }

  return (
    <Figure
      kicker="Hình 2 · Hợp đồng inject"
      title="readonly cho người đọc. Ref thì reactive. Object thường thì không."
      caption="Giữ chỗ ghi ở provider. Consumer nhận readonly(theme) để đọc và để UI cập nhật khi provider đổi. Provide một object thường thì mutate sau đó không làm con render lại."
    >
      <Tabs
        label="Thứ được provide"
        value={mode}
        onChange={reset}
        items={[
          { value: 'readonly', label: 'readonly(ref)' },
          { value: 'ref', label: 'ref trần' },
          { value: 'plain', label: 'object thường' },
        ]}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Pane title="Provider" value={source} action="đổi theme" onAction={providerWrite} />
        <Pane title="Consumer inject" value={seen} action="tự ghi" onAction={consumerWrite} />
      </div>

      <p
        className={cx(
          'mt-3 text-sm leading-6',
          warning ? 'text-amber-800 dark:text-amber-300' : 'text-fd-muted-foreground',
        )}
      >
        {warning ?? 'Bấm một trong hai nút. Provider và consumer chỉ khớp nhau khi thứ được provide là ref.'}
      </p>
    </Figure>
  )
}

function Pane({
  title,
  value,
  action,
  onAction,
}: {
  title: string
  value: string
  action: string
  onAction: () => void
}) {
  return (
    <div className="rounded-xl border border-fd-border bg-fd-background p-3">
      <p className="text-xs font-semibold text-fd-muted-foreground">{title}</p>
      <p className="mt-1 font-mono text-lg font-bold">{value}</p>
      <DemoButton className="mt-3" tone="ghost" onClick={onAction}>
        {action}
      </DemoButton>
    </div>
  )
}
