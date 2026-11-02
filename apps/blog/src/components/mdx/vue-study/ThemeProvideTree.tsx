import { useState } from 'react'
import { DemoButton, Figure, Tabs, cx } from './ui'

type Theme = 'light' | 'dark'
type KeyMode = 'symbol' | 'string'

export function ThemeProvideTree() {
  const [theme, setTheme] = useState<Theme>('light')
  const [keys, setKeys] = useState<KeyMode>('symbol')
  const sidebar = 'contrast'
  const buttonSees = keys === 'string' ? sidebar : theme

  return (
    <Figure
      kicker="Hình 1 · Không khoan prop"
      title="Layout không khai báo theme, Button vẫn đọc được"
      caption="provide ở App, inject ở Button. Layout ở giữa không có prop theme. Cùng một string key thì component gần hơn thắng. Symbol (InjectionKey) không đụng key của người khác."
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs
          label="Kiểu injection key"
          value={keys}
          onChange={setKeys}
          items={[
            { value: 'symbol', label: 'Symbol' },
            { value: 'string', label: "string 'theme'" },
          ]}
        />
        <DemoButton onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}>
          App đổi theme
        </DemoButton>
      </div>

      <div className="mt-4 space-y-2">
        <Node
          depth={0}
          title="App"
          detail={keys === 'symbol' ? `provide(themeKey, ${theme})` : `provide('theme', '${theme}')`}
        />
        <Node depth={1} title="Layout" detail="không có prop theme" muted />
        <Node
          depth={2}
          title="Sidebar"
          detail={keys === 'string' ? `provide('theme', '${sidebar}')` : 'provide(otherKey) — key khác, bị bỏ qua'}
          warn={keys === 'string'}
        />
        <Node
          depth={3}
          title="Button"
          detail={`inject → ${buttonSees}`}
          hot
          theme={buttonSees}
        />
      </div>
      <p className="mt-3 text-sm leading-6 text-fd-muted-foreground">
        {keys === 'symbol'
          ? 'Button tìm đúng Symbol của App. Sidebar provide một key khác nên không che theme.'
          : "Cả App và Sidebar dùng string 'theme'. inject lấy giá trị của cha gần nhất, tức Sidebar."}
      </p>
    </Figure>
  )
}

function Node({
  depth,
  title,
  detail,
  muted = false,
  warn = false,
  hot = false,
  theme,
}: {
  depth: number
  title: string
  detail: string
  muted?: boolean
  warn?: boolean
  hot?: boolean
  theme?: string
}) {
  return (
    <div style={{ marginLeft: depth * 16 }}>
      <div
        className={cx(
          'rounded-xl border px-3 py-2',
          muted && 'border-fd-border bg-fd-background',
          warn && 'border-amber-500/40 bg-amber-500/10',
          hot && theme === 'dark' && 'border-slate-500 bg-slate-800 text-slate-100',
          hot && theme !== 'dark' && 'border-emerald-500/40 bg-emerald-500/10',
          !muted && !warn && !hot && 'border-fd-border bg-fd-background',
        )}
      >
        <p className="font-mono text-sm font-bold">{title}</p>
        <p className={cx('text-xs leading-5', hot && theme === 'dark' ? 'text-slate-300' : 'text-fd-muted-foreground')}>
          {detail}
        </p>
      </div>
    </div>
  )
}
