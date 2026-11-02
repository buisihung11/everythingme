import { useState } from 'react'
import { DemoButton, Figure, cx } from './ui'

type Home = 'pinia' | 'query' | 'local' | 'provide'

const HOMES: Array<{ id: Home; label: string }> = [
  { id: 'local', label: 'ref local' },
  { id: 'provide', label: 'provide/inject' },
  { id: 'pinia', label: 'Pinia' },
  { id: 'query', label: 'useUser(id)' },
]

const CASES: Array<{ q: string; a: Home; why: string }> = [
  {
    q: 'Danh sách user vừa fetch, kèm loading và error.',
    a: 'query',
    why: 'Đây là cache của một request. Pinia không biết khi nào dữ liệu cũ, và loading để trong store dễ bị request khác ghi đè.',
  },
  {
    q: 'Số lượng trong giỏ, header và checkout cùng đọc.',
    a: 'pinia',
    why: 'Đây là client state người dùng đang sửa, chưa phải response của server. Store là đúng chỗ.',
  },
  {
    q: 'Ô search chỉ tồn tại trên một trang.',
    a: 'local',
    why: 'Không ai ở ngoài trang cần chuỗi này. Đưa vào Pinia là thêm chỗ phải nhớ reset.',
  },
  {
    q: 'disabled của một field, mọi input trong form cần đọc.',
    a: 'provide',
    why: 'State theo cây của form. Unmount form là hết. Bài provide/inject vừa làm đúng việc này.',
  },
]

export function StateHomePicker() {
  const [picks, setPicks] = useState<Record<number, Home>>({})
  const done = Object.keys(picks).length
  const correct = CASES.filter((c, i) => picks[i] === c.a).length

  return (
    <Figure
      kicker="Hình 2 · Không nhét cache vào store"
      title="Pinia giữ client state. Request giữ cache của nó."
      caption="Khi cần dedupe, retry và invalidate ở nhiều màn, một query library (bài tổng quan nhắc TanStack Query) gánh việc đó. Bài này dừng ở useUser(id). Đừng cài thêm package chỉ để có cache."
    >
      <ol className="space-y-3">
        {CASES.map((item, i) => {
          const picked = picks[i]
          const ok = picked === item.a
          return (
            <li key={item.q} className="rounded-xl border border-fd-border bg-fd-background p-3">
              <p className="text-sm font-medium">
                <span className="mr-2 font-mono text-xs text-fd-muted-foreground">{i + 1}.</span>
                {item.q}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {HOMES.map((home) => (
                  <button
                    key={home.id}
                    type="button"
                    onClick={() => setPicks((prev) => ({ ...prev, [i]: home.id }))}
                    className={cx(
                      'rounded-lg border px-2.5 py-1 text-xs font-semibold',
                      picked !== home.id && 'border-fd-border text-fd-muted-foreground hover:bg-fd-accent',
                      picked === home.id && ok && 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
                      picked === home.id && !ok && 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300',
                    )}
                  >
                    {home.label}
                  </button>
                ))}
              </div>
              {picked ? (
                <p className="mt-2 text-sm leading-6 text-fd-foreground">
                  <span className={ok ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}>
                    {ok ? 'Đúng. ' : `Nên dùng ${HOMES.find((h) => h.id === item.a)?.label}. `}
                  </span>
                  {item.why}
                </p>
              ) : null}
            </li>
          )
        })}
      </ol>
      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-sm text-fd-muted-foreground">
          {done === 0 ? 'Chọn nhà cho từng dữ liệu.' : `Đúng ${correct}/${CASES.length}`}
        </p>
        <DemoButton tone="ghost" disabled={done === 0} onClick={() => setPicks({})}>
          Làm lại
        </DemoButton>
      </div>
    </Figure>
  )
}
