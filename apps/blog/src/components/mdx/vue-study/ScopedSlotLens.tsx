import { useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { CodeLines, Figure, Tabs, cx } from './ui'

type Variant = 'compact' | 'price' | 'stock'
type View = 'parent' | 'child' | 'react'

const PRODUCTS = [
  { id: 7, name: 'Áo thun', price: 120, stock: 3 },
  { id: 9, name: 'Mũ lưỡi trai', price: 90, stock: 0 },
  { id: 12, name: 'Túi tote', price: 150, stock: 8 },
]

type Product = (typeof PRODUCTS)[number]

const PARENT: Record<Variant, string[]> = {
  compact: [
    '<DataList :items="products" v-slot="{ item, selected }">',
    "  <span :class=\"{ 'font-bold': selected }\">",
    '    {{ item.name }}',
    '  </span>',
    '</DataList>',
  ],
  price: [
    '<DataList :items="products">',
    '  <template #default="{ item, index }">',
    '    <b>{{ index + 1 }}. {{ item.name }}</b>',
    '    <em>{{ item.price }}k</em>',
    '  </template>',
    '</DataList>',
  ],
  stock: [
    '<DataList :items="products" v-slot="{ item }">',
    '  <Badge v-if="item.stock === 0">Hết hàng</Badge>',
    '  <span v-else>Còn {{ item.stock }}</span>',
    '</DataList>',
  ],
}

const REACT: Record<Variant, string[]> = {
  compact: [
    '<DataList',
    '  items={products}',
    '  renderItem={({ item, selected }) => (',
    "    <span className={selected ? 'font-bold' : ''}>",
    '      {item.name}',
    '    </span>',
    '  )}',
    '/>',
  ],
  price: [
    '<DataList',
    '  items={products}',
    '  renderItem={({ item, index }) => (',
    '    <><b>{index + 1}. {item.name}</b>',
    '    <em>{item.price}k</em></>',
    '  )}',
    '/>',
  ],
  stock: [
    '<DataList',
    '  items={products}',
    '  renderItem={({ item }) =>',
    '    item.stock === 0',
    '      ? <Badge>Hết hàng</Badge>',
    '      : <span>Còn {item.stock}</span>',
    '  }',
    '/>',
  ],
}

const CHILD = [
  '<script setup lang="ts" generic="T extends { id: number }">',
  'defineProps<{ items: T[] }>()',
  'defineSlots<{',
  '  default(props: {',
  '    item: T; index: number; selected: boolean',
  '  }): any',
  '}>()',
  'const selected = ref(0)',
  '</script>',
  '',
  '<template>',
  '  <ul>',
  '    <li v-for="(item, index) in items" :key="item.id"',
  '        @click="selected = index">',
  '      <slot :item="item" :index="index"',
  '            :selected="index === selected" />',
  '    </li>',
  '  </ul>',
  '</template>',
]

function Render({ variant, item, index, selected }: { variant: Variant; item: Product; index: number; selected: boolean }) {
  if (variant === 'compact') return <span className={cx(selected && 'font-bold')}>{item.name}</span>
  if (variant === 'price')
    return (
      <span className="flex flex-wrap items-baseline gap-2">
        <b>
          {index + 1}. {item.name}
        </b>
        <em className="text-fd-muted-foreground">{item.price}k</em>
      </span>
    )
  return item.stock === 0 ? (
    <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-bold text-rose-700 dark:text-rose-300">Hết hàng</span>
  ) : (
    <span>Còn {item.stock}</span>
  )
}

export function ScopedSlotLens() {
  const [variant, setVariant] = useState<Variant>('compact')
  const [view, setView] = useState<View>('parent')
  const [selected, setSelected] = useState(0)

  const lines = view === 'parent' ? PARENT[variant] : view === 'child' ? CHILD : REACT[variant]

  return (
    <Figure
      kicker="Hình 6 · Scoped slots"
      title="Lỗ có đèn chiếu ngược: con đưa dữ liệu lên, cha quyết định vẽ"
      caption={
        <>
          DataList lo phần lặp, key và trạng thái <code>selected</code>. Cha chỉ lo mỗi dòng
          trông thế nào. Đổi giao diện ở trên, rồi bấm vào một dòng: <code>selected</code> là
          state của con, được chiếu lên qua slot props để template của cha dùng. Đây đúng là
          render prop của React, chỉ khác là bạn viết bằng template thay vì một hàm.
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-fd-muted-foreground">Cha chọn giao diện:</span>
        <Tabs
          label="Giao diện cha chọn"
          value={variant}
          onChange={setVariant}
          items={[
            { value: 'compact', label: 'Tên gọn' },
            { value: 'price', label: 'Số thứ tự + giá' },
            { value: 'stock', label: 'Tồn kho' },
          ]}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="rounded-2xl border-2 border-fd-foreground/25 bg-fd-card p-3">
            <p className="mb-2 font-mono text-[0.7rem] font-bold text-fd-muted-foreground">
              {'<DataList>'} · selected = {selected}
            </p>
            <ul className="space-y-2">
              {PRODUCTS.map((item, index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(index)}
                    aria-pressed={index === selected}
                    className={cx(
                      'w-full rounded-xl border-2 p-2 text-left transition-colors',
                      index === selected ? 'border-emerald-500 bg-emerald-500/5' : 'border-fd-border bg-fd-background hover:bg-fd-accent',
                    )}
                  >
                    <span className="flex flex-wrap items-center gap-1.5 font-mono text-[0.68rem] text-orange-700 dark:text-orange-300">
                      <ArrowUp className="size-3" aria-hidden />
                      {`{ item: #${item.id}, index: ${index}, selected: ${index === selected} }`}
                    </span>
                    <span className="mt-1.5 block rounded-lg border border-sky-500/50 bg-sky-500/10 px-2.5 py-1.5 text-sm text-fd-foreground">
                      <Render variant={variant} item={item} index={index} selected={index === selected} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-[0.7rem] text-fd-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-orange-500" aria-hidden /> slot props con đưa lên</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-sky-500" aria-hidden /> nội dung cha vẽ</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-emerald-500" aria-hidden /> state của con</span>
          </div>
        </div>

        <div className="min-w-0 space-y-2">
          <Tabs
            label="Xem code"
            value={view}
            onChange={setView}
            items={[
              { value: 'parent', label: 'Cha (Vue)' },
              { value: 'child', label: 'DataList.vue' },
              { value: 'react', label: 'React render prop' },
            ]}
          />
          <CodeLines lines={lines.map((text) => ({ text }))} />
          <p className="text-xs leading-5 text-fd-muted-foreground">
            {view === 'child'
              ? 'generic="T" (Vue 3.3+) giúp item trong template của cha có đúng kiểu Product. defineSlots khai báo kiểu cho slot props.'
              : view === 'react'
                ? 'Cùng một ý tưởng: con gọi hàm cha truyền vào, kèm dữ liệu của con.'
                : 'v-slot đặt thẳng trên component là cách viết gọn khi chỉ có slot default.'}
          </p>
        </div>
      </div>
    </Figure>
  )
}
