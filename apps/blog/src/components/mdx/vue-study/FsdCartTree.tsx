import { useState } from 'react'
import { Figure, cx } from './ui'

const NODES = [
  {
    id: 'page',
    path: 'pages/cart/ui/CartPage.vue',
    layer: 'pages',
    job: 'Ghép widget và feature cho route /cart. Việc chỉ một màn thì để ở đây trước.',
    ban: 'Không bị tầng dưới import.',
  },
  {
    id: 'widget',
    path: 'widgets/cart-summary/ui/CartSummary.vue',
    layer: 'widgets',
    job: 'Khối giỏ dùng lại ở header và ở trang cart.',
    ban: 'Không import pages, không import widget khác.',
  },
  {
    id: 'feature',
    path: 'features/add-to-cart/ui/AddButton.vue',
    layer: 'features',
    job: 'Một hành động của người dùng: thêm món. Store của hành động này nằm ở model nếu chỉ feature này sửa giỏ.',
    ban: 'Không import pages, widgets, hay feature remove-line.',
  },
  {
    id: 'entity',
    path: 'entities/product/ui/ProductCard.vue',
    layer: 'entities',
    job: 'Danh từ Product: type và cách hiển thị. Cart line giữ productId, không import entity khác.',
    ban: 'Không import feature add-to-cart.',
  },
  {
    id: 'shared',
    path: 'shared/ui/Button.vue',
    layer: 'shared',
    job: 'Nút không biết cart là gì. app/ cài Pinia, không để store ở đây.',
    ban: 'Không import pages, widgets, features, entities.',
  },
]

export function FsdCartTree() {
  const [id, setId] = useState(NODES[0].id)
  const node = NODES.find((item) => item.id === id) ?? NODES[0]

  return (
    <Figure
      kicker="Hình 1 · Cây cart"
      title="Mỗi tầng một việc. Public API là index.ts"
      caption="Feature-Sliced Design xếp theo hướng phụ thuộc, không theo đuôi file .vue. app và shared dùng segment thẳng. Tầng còn lại có slice. Nếu giỏ chỉ một trang dùng, hãy để trong pages/cart cho tới khi header cũng cần."
    >
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ol className="space-y-1.5">
          {NODES.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setId(item.id)}
                className={cx(
                  'w-full rounded-lg border px-3 py-2 text-left font-mono text-[0.72rem] leading-5',
                  item.id === id
                    ? 'border-emerald-500 bg-emerald-500/10 text-fd-foreground'
                    : 'border-fd-border bg-fd-background text-fd-muted-foreground hover:bg-fd-accent',
                )}
                style={{ marginLeft: index * 10 }}
              >
                {item.path}
              </button>
            </li>
          ))}
        </ol>
        <div className="rounded-xl border border-fd-border bg-fd-background p-3">
          <p className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">{node.layer}</p>
          <p className="mt-2 text-sm leading-6 text-fd-foreground">{node.job}</p>
          <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-300">{node.ban}</p>
        </div>
      </div>
    </Figure>
  )
}
