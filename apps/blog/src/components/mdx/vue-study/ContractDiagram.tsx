import { useState, type ReactNode } from 'react'
import { ArrowDown, ArrowRight, ArrowUpDown, Lightbulb, PlugZap, Puzzle, Spotlight } from 'lucide-react'
import { CodeLines, Figure, cx, type CodeLine } from './ui'

type Part = 'props' | 'model' | 'emits' | 'slots' | 'scoped' | 'attrs'

const PARTS: Record<Part, { label: string; tone: string; ring: string; vue: string; react: string }> = {
  props: {
    label: 'props',
    tone: 'text-sky-700 dark:text-sky-300',
    ring: 'border-sky-500 bg-sky-500/15',
    vue: 'Ổ cắm vào. Con khai báo tên và kiểu bằng defineProps. Props chỉ đọc: con không được sửa.',
    react: 'Giống props của React, nhưng phải khai báo. Attribute không khai báo sẽ không thành prop.',
  },
  model: {
    label: 'v-model',
    tone: 'text-emerald-700 dark:text-emerald-300',
    ring: 'border-emerald-500 bg-emerald-500/15',
    vue: 'Ống hai chiều. defineModel tạo một prop và một event update:…, gói trong một ref.',
    react: 'Cặp value + onChange của controlled component, gộp lại thành một cú pháp.',
  },
  emits: {
    label: 'emits',
    tone: 'text-violet-700 dark:text-violet-300',
    ring: 'border-violet-500 bg-violet-500/15',
    vue: 'Đèn báo ra. Con emit("search", q), cha nghe bằng @search. Chỉ cha trực tiếp nghe thấy.',
    react: 'Callback onSearch cha truyền xuống. Ở Vue, cha không phải truyền hàm, chỉ cần nghe.',
  },
  slots: {
    label: 'slot',
    tone: 'text-amber-700 dark:text-amber-300',
    ring: 'border-amber-500 bg-amber-500/15',
    vue: 'Lỗ trên khuôn. Con chừa chỗ bằng <slot name="empty">, cha lắp nội dung bằng #empty.',
    react: 'Prop nhận ReactNode, ví dụ empty={<p>Không có kết quả</p>}. Default slot giống children.',
  },
  scoped: {
    label: 'scoped slot',
    tone: 'text-orange-700 dark:text-orange-300',
    ring: 'border-orange-500 bg-orange-500/15',
    vue: 'Lỗ có đèn chiếu ngược. Con đưa dữ liệu lên (:result="r"), cha quyết định vẽ thế nào.',
    react: 'Render prop: renderItem={(result) => <ProductRow product={result} />}.',
  },
  attrs: {
    label: 'attrs',
    tone: 'text-rose-700 dark:text-rose-300',
    ring: 'border-rose-500 bg-rose-500/15',
    vue: 'Thứ không khai báo (class, data-*, id…) tự rơi xuống phần tử root của con.',
    react: 'Phải tự gom ...rest rồi rải lên phần tử. Vue làm việc đó mặc định.',
  },
}

const PARENT: Array<{ text: string; part?: Part }> = [
  { text: '<SearchBox' },
  { text: '  placeholder="Tìm sản phẩm"', part: 'props' },
  { text: '  :limit="5"', part: 'props' },
  { text: '  v-model="query"', part: 'model' },
  { text: '  @search="runSearch"', part: 'emits' },
  { text: '  class="mt-4" data-test="search"', part: 'attrs' },
  { text: '>' },
  { text: '  <template #item="{ result }">', part: 'scoped' },
  { text: '    <ProductRow :product="result" />', part: 'scoped' },
  { text: '  </template>', part: 'scoped' },
  { text: '  <template #empty>Không có kết quả</template>', part: 'slots' },
  { text: '</SearchBox>' },
]

const CHILD: CodeLine[] = [
  { text: '<script setup lang="ts">' },
  { text: 'const { placeholder, limit = 10 } =', id: 'props' },
  { text: '  defineProps<{', id: 'props' },
  { text: '    placeholder?: string', id: 'props' },
  { text: '    limit?: number', id: 'props' },
  { text: '  }>()', id: 'props' },
  { text: "const query = defineModel<string>({ default: '' })", id: 'model' },
  { text: 'const emit = defineEmits<{ search: [q: string] }>()', id: 'emits' },
  { text: '</script>' },
  { text: '' },
  { text: '<template>' },
  { text: '  <div class="search">', id: 'attrs' },
  { text: '    <input v-model="query" :placeholder', id: 'model' },
  { text: '      @keydown.enter="emit(\'search\', query)" />', id: 'emits' },
  { text: '    <ul v-if="results.length">' },
  { text: '      <li v-for="r in results" :key="r.id">' },
  { text: '        <slot name="item" :result="r" />', id: 'scoped' },
  { text: '      </li>' },
  { text: '    </ul>' },
  { text: '    <slot v-else name="empty">Trống</slot>', id: 'slots' },
  { text: '  </div>', id: 'attrs' },
  { text: '</template>' },
]

export function ContractDiagram() {
  const [part, setPart] = useState<Part>('props')
  const info = PARTS[part]
  const socket = (id: Part) => ({ id, active: part === id, onSelect: setPart })

  return (
    <Figure
      kicker="Hình 1 · Hợp đồng"
      title="Một component là một thiết bị có ổ cắm"
      caption={
        <>
          Bấm vào từng ổ cắm trên thiết bị, hoặc từng dòng trong code của cha. Mỗi phần của
          hợp đồng nằm ở hai nơi: cha dùng nó ra sao, và con khai báo nó thế nào. Nhìn khối
          script của con là biết toàn bộ giao diện của component, không cần đọc tới template.
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-fd-border bg-fd-background p-3">
            <div className="flex flex-wrap items-end justify-center gap-2">
              <SocketButton {...socket('props')}><ArrowDown className="size-3.5" aria-hidden />placeholder, limit</SocketButton>
              <SocketButton {...socket('model')}><ArrowUpDown className="size-3.5" aria-hidden />v-model</SocketButton>
            </div>
            <div className="mt-2 flex items-stretch gap-2">
              <div
                className={cx(
                  'min-w-0 flex-1 rounded-2xl border-2 p-3 transition-colors',
                  part === 'attrs' ? PARTS.attrs.ring : 'border-fd-foreground/25 bg-fd-card',
                )}
              >
                <p className="font-mono text-xs font-bold text-fd-foreground">{'<SearchBox>'}</p>
                <p className="mt-0.5 font-mono text-[0.68rem] text-fd-muted-foreground">
                  root: {'<div class="search'}
                  <span className={cx(part === 'attrs' && 'font-bold text-rose-700 dark:text-rose-300')}> mt-4" data-test="search"</span>
                  {'>'}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <SocketButton {...socket('scoped')} className="justify-center border-dashed py-3">
                    <Spotlight className="size-3.5" aria-hidden />#item ↑ result
                  </SocketButton>
                  <SocketButton {...socket('slots')} className="justify-center border-dashed py-3">
                    <Puzzle className="size-3.5" aria-hidden />#empty
                  </SocketButton>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center gap-1">
                <ArrowRight className={cx('size-4', PARTS.emits.tone)} aria-hidden />
                <SocketButton {...socket('emits')}><Lightbulb className="size-3.5" aria-hidden />@search</SocketButton>
              </div>
            </div>
            <div className="mt-2 flex justify-center">
              <SocketButton {...socket('attrs')}><PlugZap className="size-3.5" aria-hidden />class, data-test → root</SocketButton>
            </div>
          </div>

          <div aria-live="polite" className={cx('rounded-xl border-2 p-3 transition-colors', info.ring)}>
            <p className={cx('font-mono text-sm font-bold', info.tone)}>{info.label}</p>
            <p className="mt-1 text-sm leading-6 text-fd-foreground">{info.vue}</p>
            <p className="mt-1 text-sm leading-6 text-fd-muted-foreground">
              <span className="font-semibold text-sky-700 dark:text-sky-400">React: </span>
              {info.react}
            </p>
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          <div>
            <p className="mb-1 text-xs font-bold text-fd-muted-foreground">Cha dùng (App.vue)</p>
            <div className="overflow-x-auto rounded-xl border border-fd-border bg-fd-background py-2 font-mono text-[0.75rem] leading-6">
              {PARENT.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={!line.part}
                  onClick={() => line.part && setPart(line.part)}
                  className={cx(
                    'block w-full whitespace-pre px-3 text-left transition-colors duration-300 disabled:cursor-default',
                    line.part === part ? 'bg-amber-400/20' : line.part ? 'hover:bg-fd-accent' : '',
                    line.part ? PARTS[line.part].tone : 'text-fd-foreground',
                  )}
                >
                  {line.text}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold text-fd-muted-foreground">Con khai báo (SearchBox.vue)</p>
            <CodeLines lines={CHILD} lineClass={(l) => (l.id === part ? 'bg-amber-400/20' : undefined)} />
          </div>
        </div>
      </div>
    </Figure>
  )
}

function SocketButton({
  id,
  active,
  onSelect,
  className,
  children,
}: {
  id: Part
  active: boolean
  onSelect: (id: Part) => void
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-pressed={active}
      className={cx(
        'inline-flex items-center gap-1.5 rounded-lg border-2 px-2 py-1 font-mono text-[0.72rem] font-semibold transition-colors',
        active ? PARTS[id].ring : 'border-fd-border bg-fd-card hover:bg-fd-accent',
        PARTS[id].tone,
        className,
      )}
    >
      {children}
    </button>
  )
}
