import { useState } from 'react'
import { RotateCw } from 'lucide-react'
import { DemoButton, Figure, cx } from './ui'
import { FLASHCARDS, type ReviewId } from './review'

export function Flashcards({ id = 'vue-fundamentals' }: { id?: ReviewId }) {
  const cards = FLASHCARDS[id]
  const [flipped, setFlipped] = useState<Set<number>>(new Set())
  const toggle = (i: number) =>
    setFlipped((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  return (
    <Figure
      kicker="Ôn tập · Active recall"
      title="Thẻ nhớ: tự trả lời trước, rồi mới lật thẻ"
      caption="Trả lời thành tiếng trước khi lật. Cố nhớ lại giúp bạn nhớ lâu hơn nhiều so với đọc lại bài. Ngày mai và tuần sau quay lại làm thêm một lượt."
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm text-fd-muted-foreground">Đã lật {flipped.size}/{cards.length}</p>
        <DemoButton tone="ghost" disabled={flipped.size === 0} onClick={() => setFlipped(new Set())}>
          <RotateCw className="size-3.5" aria-hidden /> Úp lại tất cả
        </DemoButton>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card, i) => {
          const isFlipped = flipped.has(i)
          return (
            <button
              key={card.q}
              type="button"
              onClick={() => toggle(i)}
              aria-pressed={isFlipped}
              aria-label={isFlipped ? `${card.q} Đáp án: ${card.a}` : `${card.q} Bấm để xem đáp án`}
              className="group h-36 text-left perspective-[900px]"
            >
              <span
                className={cx(
                  'relative block size-full transition-transform duration-500 transform-3d motion-reduce:transition-none',
                  isFlipped && 'rotate-y-180',
                )}
              >
                <span className="absolute inset-0 flex flex-col justify-between rounded-xl border border-fd-border bg-fd-background p-3 backface-hidden group-hover:border-emerald-500/50">
                  <span className="text-sm font-semibold leading-6 text-fd-foreground">{card.q}</span>
                  <span className="text-[0.7rem] font-semibold text-emerald-700 dark:text-emerald-400">Bấm để lật</span>
                </span>
                <span className="absolute inset-0 overflow-auto rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-3 text-sm leading-6 text-fd-foreground backface-hidden rotate-y-180">
                  {card.a}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </Figure>
  )
}
