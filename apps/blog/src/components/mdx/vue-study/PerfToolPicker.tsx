import { useState } from 'react'
import { DemoButton, Figure, cx } from './ui'

type Tool = 'key' | 'keep' | 'shallow' | 'memo'

const TOOLS: Array<{ id: Tool; label: string }> = [
  { id: 'key', label: ':key ổn định' },
  { id: 'keep', label: 'KeepAlive' },
  { id: 'shallow', label: 'shallowRef' },
  { id: 'memo', label: 'v-memo' },
]

const CASES: Array<{ q: string; a: Tool; why: string }> = [
  {
    q: 'Ba dòng có ô input. Bấm đảo thứ tự thì chữ phải đi theo món, không dính vào vị trí.',
    a: 'key',
    why: 'v-for mặc định vá tại chỗ. :key="item.id" bảo Vue chuyển đúng node. :key="index" giữ input ở index cũ. React cùng quy tắc này với key.',
  },
  {
    q: 'Bật tắt một editor nặng. Bản nháp phải còn khi mở lại.',
    a: 'keep',
    why: 'KeepAlive giữ instance khi đổi component động. v-if trần thì unmount, state mất. v-show cũng giữ state, nhưng editor vẫn nằm trong DOM.',
  },
  {
    q: 'API trả 5.000 dòng, mỗi lần là một mảng mới, không sửa từng phần tử.',
    a: 'shallow',
    why: 'Bài 6: shallowRef chỉ canh .value. Gán cả mảng mới là đủ, khỏi Proxy sâu từng dòng. v-memo không giảm chi phí đó.',
  },
]

export function PerfToolPicker() {
  const [picks, setPicks] = useState<Record<number, Tool>>({})
  const done = Object.keys(picks).length
  const correct = CASES.filter((c, i) => picks[i] === c.a).length

  return (
    <Figure
      kicker="Hình 1 · Chọn công cụ"
      title="Ba tình huống, một công cụ đúng"
      caption="v-memo chỉ khi bạn kể được dependency. Vue đã không render lại con nếu props của con không đổi, nên hiếm khi cần một lớp giống React.memo. v-memo bỏ qua một khúc template của chính component đang render."
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
                {TOOLS.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setPicks((prev) => ({ ...prev, [i]: tool.id }))}
                    className={cx(
                      'rounded-lg border px-2.5 py-1 text-xs font-semibold',
                      picked !== tool.id && 'border-fd-border text-fd-muted-foreground hover:bg-fd-accent',
                      picked === tool.id && ok && 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
                      picked === tool.id && !ok && 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300',
                    )}
                  >
                    {tool.label}
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
          {done === 0 ? 'Chọn công cụ cho từng tình huống.' : `Đúng ${correct}/${CASES.length}`}
        </p>
        <DemoButton tone="ghost" disabled={done === 0} onClick={() => setPicks({})}>
          Làm lại
        </DemoButton>
      </div>
    </Figure>
  )
}
