import { useState } from 'react'
import { DemoButton, Figure, cx } from './ui'

type Tool = 'text' | 'emitted' | 'props' | 'get'

const TOOLS: Array<{ id: Tool; label: string }> = [
  { id: 'text', label: 'wrapper.text()' },
  { id: 'emitted', label: "wrapper.emitted()" },
  { id: 'props', label: 'wrapper.props()' },
  { id: 'get', label: 'wrapper.get()' },
]

const CASES: Array<{ q: string; a: Tool; why: string }> = [
  {
    q: 'Nút reset có phát sự kiện reset không?',
    a: 'emitted',
    why: 'reset là hợp đồng emit của Bài 4. emitted("reset") là mảng các lần gọi. Testing Library không có API này vì nó né chi tiết implement.',
  },
  {
    q: 'Người dùng có đọc được chữ "Điểm" không?',
    a: 'text',
    why: 'Đây là thứ hiện trên màn hình. text() hoặc getByRole của Testing Library đều hợp. Đừng assert cây DOM nếu một câu chữ là đủ.',
  },
  {
    q: 'Cha truyền modelValue = 2, con có nhận đúng không?',
    a: 'props',
    why: 'props() đọc prop sau khi mount. Hữu ích khi prop không hiện thành chữ, ví dụ một id.',
  },
  {
    q: 'Trong Counter có đúng một nút inc không?',
    a: 'get',
    why: 'get() thành công khi có đúng một node. Không thấy, hoặc thấy hai, là test ném lỗi. find() trả node hoặc null.',
  },
]

export function AssertionPicker() {
  const [picks, setPicks] = useState<Record<number, Tool>>({})
  const done = Object.keys(picks).length
  const correct = CASES.filter((c, i) => picks[i] === c.a).length

  return (
    <Figure
      kicker="Hình 2 · Chọn assertion"
      title="Nhìn hợp đồng rồi mới chọn hàm"
      caption="Bốn câu hỏi, bốn cửa của wrapper. Chọn nhầm emitted khi chỉ cần đọc chữ là test dính vào chi tiết component không cần thiết."
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
                      'rounded-lg border px-2.5 py-1 font-mono text-[0.7rem] font-semibold',
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
          {done === 0 ? 'Chọn một assertion cho mỗi câu.' : `Đúng ${correct}/${CASES.length}`}
        </p>
        <DemoButton tone="ghost" disabled={done === 0} onClick={() => setPicks({})}>
          Làm lại
        </DemoButton>
      </div>
    </Figure>
  )
}
