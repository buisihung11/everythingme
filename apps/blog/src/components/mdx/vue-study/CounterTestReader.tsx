import { useState } from 'react'
import { CodeLines, Figure, cx, type CodeLine } from './ui'

const LINES: Array<CodeLine & { note: string }> = [
  { text: "const wrapper = mount(Counter, {", note: 'Render Counter với props của cha. Chưa có DOM thật của trình duyệt nếu dùng happy-dom.' },
  { text: "  props: { label: 'Điểm', modelValue: 2 },", note: 'defineProps nhận label. defineModel nhận modelValue. Đây là props(), không phải text.' },
  { text: '})', note: 'mount trả wrapper. Từ đây tìm node, đọc text, đọc emitted.' },
  { text: "expect(wrapper.text()).toContain('Điểm')", note: 'text() là những gì người dùng đọc được. Testing Library cũng assert theo hướng này, qua getByRole.' },
  { text: "expect(wrapper.text()).toContain('2')", note: 'Số trên màn hình còn là 2. Cha chưa setProps lại.' },
  { text: "await wrapper.get('[data-testid=inc]').trigger('click')", note: 'get ném lỗi nếu không thấy đúng một node. trigger phát click lên node đó.' },
  { text: "expect(wrapper.emitted('update:modelValue')?.[0])", note: 'emitted trả mảng các lần gọi. Phần tử 0 là mảng đối số của lần đầu: [3].' },
  { text: '  .toEqual([3])', note: 'defineModel ghi bằng emit update:modelValue. Số trên màn hình vẫn là 2 cho tới khi cha setProps.' },
]

export function CounterTestReader() {
  const [active, setActive] = useState(0)
  const [guess, setGuess] = useState<string | null>(null)
  const line = LINES[active]

  return (
    <Figure
      kicker="Hình 1 · Đọc test"
      title="Sau click, emitted là 3, chữ trên màn hình vẫn là 2"
      caption="Vue Test Utils nhìn hợp đồng của component: props, text, emitted. Testing Library nhìn vai trò trên màn hình và thường né emitted. Cả hai đều chạy bằng Vitest. Repo này chưa có @vue/test-utils, nên test ở lại trong bài."
    >
      <div className="grid gap-3 xl:grid-cols-2">
        <div>
          {LINES.map((item, index) => (
            <button
              key={item.text}
              type="button"
              onClick={() => setActive(index)}
              className={cx(
                'block w-full rounded-md px-2 py-1 text-left font-mono text-[0.72rem] leading-5',
                index === active ? 'bg-emerald-500/15 text-fd-foreground' : 'text-fd-muted-foreground hover:bg-fd-accent',
              )}
            >
              {item.text}
            </button>
          ))}
        </div>
        <div className="rounded-xl border border-fd-border bg-fd-background p-3 text-sm leading-6">
          <p className="font-mono text-xs text-emerald-700 dark:text-emerald-400">dòng {active + 1}</p>
          <p className="mt-2 text-fd-foreground">{line.note}</p>
        </div>
      </div>
      <CodeLines className="mt-3 xl:hidden" lines={[{ text: line.text }]} />

      <div className="mt-4 rounded-xl border border-fd-border bg-fd-background p-3">
        <p className="text-sm font-medium">Sau trigger click, assertion nào đúng?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            ['emit', 'emitted update:modelValue là [[3]], text vẫn có "2"'],
            ['text', 'text() đổi thành "3" ngay'],
            ['props', 'props().modelValue tự thành 3'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setGuess(id)}
              className={cx(
                'rounded-lg border px-2.5 py-1 text-left text-xs font-semibold',
                guess !== id && 'border-fd-border text-fd-muted-foreground',
                guess === id && id === 'emit' && 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
                guess === id && id !== 'emit' && 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {guess ? (
          <p className="mt-2 text-sm leading-6 text-fd-foreground">
            {guess === 'emit'
              ? 'Đúng. mount không giữ v-model hộ cha. Muốn thấy số 3 trên màn hình thì await wrapper.setProps({ modelValue: 3 }).'
              : 'Chưa đúng. Con chỉ emit. Cha (ở đây là test) phải setProps nếu muốn text đổi.'}
          </p>
        ) : null}
      </div>
    </Figure>
  )
}
