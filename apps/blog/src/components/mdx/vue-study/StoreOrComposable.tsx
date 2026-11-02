import { useState } from 'react'
import { DemoButton, Figure, cx } from './ui'

type Tool = 'local' | 'composable' | 'pinia' | 'provide'

const TOOLS: Array<{ id: Tool; label: string }> = [
  { id: 'local', label: 'ref trong component' },
  { id: 'composable', label: 'composable' },
  { id: 'provide', label: 'provide/inject' },
  { id: 'pinia', label: 'Pinia' },
]

const CASES: Array<{ q: string; a: Tool; why: string }> = [
  {
    q: 'Modal chỉ một trang mở. Không component nào khác cần biết.',
    a: 'local',
    why: 'State chết cùng trang. Composable chỉ đáng khi logic này được gọi ở nhiều nơi, và mỗi nơi vẫn muốn một bản riêng.',
  },
  {
    q: 'useToggle cho hai panel, mỗi panel một trạng thái.',
    a: 'composable',
    why: 'Mỗi lần gọi tạo ref mới. Đây là custom hook của Vue: tái sử dụng logic, không dùng chung dữ liệu.',
  },
  {
    q: 'Theme của một form lồng ba tầng, chỉ subtree đó được đọc.',
    a: 'provide',
    why: 'Vòng đời theo cây component. Unmount form là mất theme. Không cần store toàn app.',
  },
  {
    q: 'Header và trang checkout cùng một giỏ hàng.',
    a: 'pinia',
    why: 'Hai cây component không có cha chung tiện để provide. useCartStore() trả về cùng một store, giống store của Zustand.',
  },
]

export function StoreOrComposable() {
  const [picks, setPicks] = useState<Record<number, Tool>>({})
  const done = Object.keys(picks).length
  const correct = CASES.filter((c, i) => picks[i] === c.a).length

  return (
    <Figure
      kicker="Hình 1 · Chọn chỗ để state"
      title="Store thắng composable khi nhiều nơi phải cùng một bản"
      caption="Composable mỗi lần gọi một state. provide/inject đi theo cây. Pinia là singleton: gọi useCartStore() ở đâu cũng ra cùng store. Đừng đưa mọi ref vào store cho có."
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
                {TOOLS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPicks((prev) => ({ ...prev, [i]: t.id }))}
                    className={cx(
                      'rounded-lg border px-2.5 py-1 text-xs font-semibold',
                      picked !== t.id && 'border-fd-border text-fd-muted-foreground hover:bg-fd-accent',
                      picked === t.id && ok && 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
                      picked === t.id && !ok && 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {picked ? (
                <p className="mt-2 text-sm leading-6 text-fd-foreground">
                  <span className={ok ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}>
                    {ok ? 'Đúng. ' : `Nên dùng ${TOOLS.find((t) => t.id === item.a)?.label}. `}
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
          {done === 0 ? 'Chọn một chỗ cho mỗi tình huống.' : `Đúng ${correct}/${CASES.length}`}
        </p>
        <DemoButton tone="ghost" disabled={done === 0} onClick={() => setPicks({})}>
          Làm lại
        </DemoButton>
      </div>
    </Figure>
  )
}
