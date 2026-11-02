import { useState } from 'react'
import { DemoButton, Figure, cx } from './ui'

type Path = '/' | '/login' | '/orders'

export function AuthGuardFlow() {
  const [authed, setAuthed] = useState(false)
  const [path, setPath] = useState<Path>('/')
  const [chunk, setChunk] = useState(false)
  const [trace, setTrace] = useState<string[]>(['Chưa điều hướng.'])

  const go = (target: '/orders' | '/') => {
    if (target === '/') {
      setPath('/')
      setTrace(['Về /. beforeEnter của /orders không chạy.'])
      return
    }
    if (!authed) {
      setPath('/login')
      setChunk(false)
      setTrace([
        'to.path = /orders',
        'from.path = ' + path,
        'isAuthenticated = false',
        'return { name: "Login" }',
        'Orders chưa được tạo. Chunk chưa tải.',
      ])
      return
    }
    setPath('/orders')
    setChunk(true)
    setTrace([
      'to.path = /orders',
      'isAuthenticated = true',
      'return undefined',
      'resolve async component',
      'import("./OrdersPage.vue")',
    ])
  }

  return (
    <Figure
      kicker="Hình 2 · beforeEnter"
      title="Guard thấy route. Component chưa tồn tại."
      caption="beforeEnter chạy trước khi async component được resolve. Redirect thì chunk của trang không tải. Guard đọc to và auth store, không đọc được ref bên trong Orders."
    >
      <div className="flex flex-wrap gap-2">
        <DemoButton tone={authed ? 'primary' : 'ghost'} onClick={() => setAuthed((v) => !v)}>
          {authed ? 'Đã đăng nhập' : 'Khách'}
        </DemoButton>
        <DemoButton tone="ghost" onClick={() => go('/orders')}>
          Vào /orders
        </DemoButton>
        <DemoButton tone="ghost" onClick={() => go('/')}>
          Về /
        </DemoButton>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <div className="rounded-xl border border-fd-border bg-fd-background p-3">
          <p className="text-xs text-fd-muted-foreground">URL đang đứng</p>
          <p className="font-mono text-lg font-bold">{path}</p>
          <p className={cx('mt-2 text-sm', chunk ? 'text-emerald-800 dark:text-emerald-300' : 'text-fd-muted-foreground')}>
            {chunk ? 'OrdersPage.vue đã được import' : 'OrdersPage.vue chưa được import'}
          </p>
          <p className="mt-1 text-sm text-fd-muted-foreground">component state: không có</p>
        </div>
        <ol className="space-y-1 rounded-xl border border-fd-border bg-fd-background p-3 font-mono text-xs leading-5">
          {trace.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </div>
    </Figure>
  )
}
