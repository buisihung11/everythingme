import { useState } from 'react'
import { Bell, Calculator, MousePointerClick, type LucideIcon } from 'lucide-react'
import { DemoButton, Figure, cx } from './ui'

type Tool = 'computed' | 'watch' | 'method'

const TOOLS: Record<Tool, { label: string; icon: LucideIcon; rule: string }> = {
  computed: { label: 'computed', icon: Calculator, rule: 'Cần một giá trị suy ra từ state khác' },
  watch: { label: 'watch', icon: Bell, rule: 'Cần làm một việc mỗi khi dữ liệu đổi' },
  method: { label: 'hàm thường', icon: MousePointerClick, rule: 'Cần làm một việc khi người dùng thao tác' },
}

const SCENARIOS: Array<{ q: string; a: Tool; why: string }> = [
  {
    q: 'Hiển thị fullName ghép từ firstName và lastName.',
    a: 'computed',
    why: 'Đây là giá trị suy ra và không có side effect. computed được cache cho tới khi firstName hoặc lastName đổi.',
  },
  {
    q: 'Lưu bộ lọc vào localStorage mỗi khi người dùng đổi bộ lọc.',
    a: 'watch',
    why: 'Ghi vào localStorage là side effect, và nó được kích hoạt bởi việc dữ liệu thay đổi.',
  },
  {
    q: 'Gửi form khi người dùng bấm nút "Lưu".',
    a: 'method',
    why: 'Việc này được kích hoạt bởi một sự kiện của người dùng, không phải bởi dữ liệu đổi. Gắn @click="save" là đủ.',
  },
  {
    q: 'Đếm số task chưa hoàn thành để hiện trên badge.',
    a: 'computed',
    why: 'Đây là dữ liệu dẫn xuất từ danh sách task. Đừng giữ một ref đếm riêng rồi tự đồng bộ bằng tay.',
  },
  {
    q: 'Gọi lại API khi userId trên route thay đổi.',
    a: 'watch',
    why: 'Gọi API là side effect, nguồn kích hoạt là userId. Dùng watch(() => route.params.id, …) và hủy request cũ trong onCleanup.',
  },
  {
    q: 'Đặt document.title theo tên trang đang xem.',
    a: 'watch',
    why: 'Sửa DOM bên ngoài component là side effect. watchEffect hoặc watch đều hợp lý.',
  },
]

export function ToolPicker() {
  const [answers, setAnswers] = useState<Record<number, Tool>>({})
  const done = Object.keys(answers).length
  const correct = SCENARIOS.filter((s, i) => answers[i] === s.a).length

  return (
    <Figure
      kicker="Hình 5 · Tự kiểm tra"
      title="computed, watch hay hàm thường?"
      caption="Quy tắc một dòng: cần một giá trị thì dùng computed; cần làm việc khi dữ liệu đổi thì dùng watch; cần làm việc khi người dùng bấm thì dùng hàm thường. Nếu đang định gọi API trong computed, bạn đã chọn sai công cụ."
    >
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        {(Object.keys(TOOLS) as Tool[]).map((t) => {
          const { icon: Icon, label, rule } = TOOLS[t]
          return (
            <div key={t} className="flex items-start gap-2 rounded-xl border border-fd-border bg-fd-background p-3">
              <Icon className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
              <div>
                <p className="font-mono text-sm font-bold">{label}</p>
                <p className="text-xs leading-5 text-fd-muted-foreground">{rule}</p>
              </div>
            </div>
          )
        })}
      </div>

      <ol className="space-y-3">
        {SCENARIOS.map((s, i) => {
          const picked = answers[i]
          const ok = picked === s.a
          return (
            <li key={s.q} className="rounded-xl border border-fd-border bg-fd-background p-3">
              <p className="text-sm font-medium text-fd-foreground">
                <span className="mr-2 font-mono text-xs text-fd-muted-foreground">{i + 1}.</span>
                {s.q}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(Object.keys(TOOLS) as Tool[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAnswers((a) => ({ ...a, [i]: t }))}
                    aria-pressed={picked === t}
                    className={cx(
                      'rounded-lg border px-2.5 py-1 font-mono text-xs font-semibold transition-colors',
                      picked !== t && 'border-fd-border text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground',
                      picked === t && ok && 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
                      picked === t && !ok && 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300',
                    )}
                  >
                    {TOOLS[t].label}
                  </button>
                ))}
              </div>
              {picked ? (
                <p className={cx('mt-2 text-sm leading-6', ok ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300')}>
                  {ok ? 'Đúng. ' : `Chưa đúng, nên dùng ${TOOLS[s.a].label}. `}
                  <span className="text-fd-foreground">{s.why}</span>
                </p>
              ) : null}
            </li>
          )
        })}
      </ol>
      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-sm text-fd-muted-foreground">
          {done === 0 ? 'Chọn đáp án cho từng tình huống.' : `Đúng ${correct}/${SCENARIOS.length} · đã trả lời ${done}`}
        </p>
        <DemoButton tone="ghost" disabled={done === 0} onClick={() => setAnswers({})}>
          Làm lại
        </DemoButton>
      </div>
    </Figure>
  )
}
