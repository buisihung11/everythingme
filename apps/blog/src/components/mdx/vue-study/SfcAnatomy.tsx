import { useState } from 'react'
import { Brain, Palette, ScanFace, type LucideIcon } from 'lucide-react'
import { CodeLines, Figure, cx, type CodeLine } from './ui'

type Zone = 'script' | 'template' | 'style'

const ZONES: Record<
  Zone,
  {
    icon: LucideIcon
    name: string
    metaphor: string
    color: string
    line: string
    points: string[]
    react: string
  }
> = {
  script: {
    icon: Brain,
    name: '<script setup>',
    metaphor: 'Bộ não',
    color: 'text-violet-700 dark:text-violet-300',
    line: 'bg-violet-500/15',
    points: [
      'Chạy một lần khi component instance được tạo, không chạy lại mỗi lần render.',
      'Mọi biến, hàm và import ở top-level đều dùng được ngay trong template.',
      'Nơi khai báo state (ref), dữ liệu dẫn xuất (computed), side effect (watch) và props/emits.',
    ],
    react:
      'Gần với thân hàm component cộng các hook, nhưng chỉ chạy một lần. Vì vậy Vue không có stale closure kiểu React.',
  },
  template: {
    icon: ScanFace,
    name: '<template>',
    metaphor: 'Khuôn mặt',
    color: 'text-emerald-700 dark:text-emerald-300',
    line: 'bg-emerald-500/15',
    points: [
      'HTML cộng directive (v-if, v-for, :prop, @event). Compiler biến nó thành render function.',
      'Ref ở top-level được tự mở: viết {{ count }}, không cần {{ count.value }}.',
      'Compiler biết phần nào tĩnh, phần nào động, nên lúc patch có thể bỏ qua phần tĩnh.',
    ],
    react:
      'Tương đương phần JSX trong return. Khác ở chỗ đây là một DSL mà compiler phân tích được, không phải JavaScript tùy ý.',
  },
  style: {
    icon: Palette,
    name: '<style scoped>',
    metaphor: 'Bộ áo',
    color: 'text-amber-700 dark:text-amber-300',
    line: 'bg-amber-500/15',
    points: [
      'Có scoped thì Vue gắn attribute dạng data-v-xxxx, nên CSS chỉ áp dụng trong component này.',
      'Dùng được v-bind() trong CSS để lấy giá trị từ state.',
      'Không bắt buộc. Tailwind hay CSS Modules vẫn dùng bình thường.',
    ],
    react:
      'Giống CSS Modules hoặc CSS-in-JS, nhưng có sẵn trong file mà không cần cấu hình thêm.',
  },
}

const LINES: Array<CodeLine & { id: Zone }> = [
  { id: 'script', text: '<script setup lang="ts">' },
  { id: 'script', text: "import { ref, computed } from 'vue'" },
  { id: 'script', text: '' },
  { id: 'script', text: "const name = ref('Vue')" },
  { id: 'script', text: 'const shout = computed(() =>' },
  { id: 'script', text: '  name.value.toUpperCase())' },
  { id: 'script', text: '</script>' },
  { id: 'template', text: '' },
  { id: 'template', text: '<template>' },
  { id: 'template', text: '  <input v-model="name" />' },
  { id: 'template', text: '  <h1 class="title">Xin chào, {{ shout }}!</h1>' },
  { id: 'template', text: '</template>' },
  { id: 'style', text: '' },
  { id: 'style', text: '<style scoped>' },
  { id: 'style', text: '.title { color: #42b883; }' },
  { id: 'style', text: '</style>' },
]

export function SfcAnatomy() {
  const [zone, setZone] = useState<Zone>('script')
  const active = ZONES[zone]
  const Icon = active.icon

  return (
    <Figure
      kicker="Hình 2 · Giải phẫu SFC"
      title="Một file .vue có ba phần: Não, Mặt, Áo"
      caption="Chọn từng phần để xem nó làm gì. Cách nhớ: não (script) nghĩ và giữ dữ liệu, mặt (template) hiển thị dữ liệu, áo (style) chỉ lo trang trí."
    >
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Các phần của SFC">
        {(Object.keys(ZONES) as Zone[]).map((key) => {
          const z = ZONES[key]
          const ZIcon = z.icon
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={zone === key}
              onClick={() => setZone(key)}
              onMouseEnter={() => setZone(key)}
              className={cx(
                'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
                zone === key
                  ? 'border-fd-foreground/20 bg-fd-accent text-fd-foreground'
                  : 'border-fd-border bg-fd-background text-fd-muted-foreground hover:text-fd-foreground',
              )}
            >
              <ZIcon className={cx('size-4', z.color)} aria-hidden />
              {z.metaphor}
              <span className="font-mono text-xs opacity-70">{z.name}</span>
            </button>
          )
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <CodeLines
          lines={LINES}
          lineClass={(line) =>
            (line as (typeof LINES)[number]).id === zone
              ? ZONES[zone].line
              : 'opacity-45'
          }
        />
        <div className="rounded-xl border border-fd-border bg-fd-background p-4">
          <p className={cx('flex items-center gap-2 text-base font-bold', active.color)}>
            <Icon className="size-5" aria-hidden /> {active.metaphor}{' '}
            <span className="font-mono text-sm">{active.name}</span>
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-fd-foreground">
            {active.points.map((p) => (
              <li key={p} className="flex gap-2">
                <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-current opacity-50" aria-hidden />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 rounded-lg bg-sky-500/10 px-3 py-2 text-sm leading-6 text-sky-900 dark:text-sky-200">
            <strong>So với React:</strong> {active.react}
          </p>
        </div>
      </div>
    </Figure>
  )
}
