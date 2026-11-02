import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, RotateCcw, Trophy, X } from 'lucide-react'
import { CodeLines, DemoButton, Figure, cx } from './ui'
import { QUIZZES, type QuizId, type QuizQuestion } from './quizzes'

const LETTERS = ['A', 'B', 'C', 'D', 'E']

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(items: T[], random: () => number) {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

type Prepared = QuizQuestion & { order: number[] }

/** The first round uses a fixed seed so server and client render the same option order. */
function prepare(questions: QuizQuestion[], seed: number): Prepared[] {
  const random = mulberry32(seed)
  const qs = seed === 1 ? questions : shuffle(questions, random)
  return qs.map((q) => ({ ...q, order: shuffle(q.options.map((_, i) => i), random) }))
}

export function Quiz({ id }: { id: QuizId }) {
  const storageKey = `vue-study:quiz:${id}`
  const [seed, setSeed] = useState(1)
  const questions = useMemo(() => prepare(QUIZZES[id], seed), [id, seed])
  const [index, setIndex] = useState(0)
  const [picks, setPicks] = useState<Array<number | undefined>>([])
  const [best, setBest] = useState<number | null>(null)

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey)
    if (stored !== null) setBest(Number(stored))
  }, [storageKey])

  const total = questions.length
  const finished = index >= total
  const score = questions.filter((q, i) => picks[i] === q.answer).length

  useEffect(() => {
    if (!finished) return
    if (best === null || score > best) {
      window.localStorage.setItem(storageKey, String(score))
      setBest(score)
    }
  }, [finished, score, best, storageKey])

  const restart = () => {
    setSeed(Date.now())
    setIndex(0)
    setPicks([])
  }

  return (
    <Figure
      kicker={`Quiz cuối bài · ${total} câu`}
      title="Kiểm tra lại mental model của bạn"
      caption="Chọn đáp án là thấy ngay đúng hay sai, kèm giải thích và link về phần cần xem lại. Mỗi lần làm lại, thứ tự câu hỏi và đáp án được xáo, nên bạn không thể chỉ nhớ vị trí. Điểm cao nhất được lưu trên trình duyệt này."
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-fd-foreground">
          {finished ? 'Hoàn thành' : `Câu ${index + 1}/${total}`}
        </span>
        <span className="text-fd-muted-foreground">
          Đúng {score}/{picks.filter((p) => p !== undefined).length}
          {best !== null ? ` · Cao nhất: ${best}/${total}` : ''}
        </span>
      </div>
      <div className="mb-5 flex gap-1" aria-hidden>
        {questions.map((q, i) => (
          <span
            key={q.q}
            className={cx(
              'h-1.5 flex-1 rounded-full transition-colors',
              picks[i] === undefined
                ? i === index
                  ? 'bg-fd-foreground/30'
                  : 'bg-fd-muted'
                : picks[i] === q.answer
                  ? 'bg-emerald-500'
                  : 'bg-rose-500',
            )}
          />
        ))}
      </div>

      {finished ? (
        <Result questions={questions} picks={picks} score={score} onRestart={restart} />
      ) : (
        <Question
          key={`${seed}-${index}`}
          question={questions[index]}
          pick={picks[index]}
          onPick={(option) =>
            setPicks((p) => {
              const next = [...p]
              next[index] = option
              return next
            })
          }
          isLast={index === total - 1}
          onNext={() => setIndex((i) => i + 1)}
        />
      )}
    </Figure>
  )
}

function Question({
  question,
  pick,
  onPick,
  isLast,
  onNext,
}: {
  question: Prepared
  pick: number | undefined
  onPick: (option: number) => void
  isLast: boolean
  onNext: () => void
}) {
  const answered = pick !== undefined
  const correct = pick === question.answer

  return (
    <div>
      <p className="text-base font-semibold leading-7 text-fd-foreground">{question.q}</p>
      {question.code ? (
        <CodeLines className="mt-3" lines={question.code.map((text) => ({ text }))} />
      ) : null}

      <div className="mt-4 grid gap-2" role="group" aria-label="Các đáp án">
        {question.order.map((option, i) => {
          const isAnswer = option === question.answer
          const isPicked = option === pick
          return (
            <button
              key={option}
              type="button"
              disabled={answered}
              onClick={() => onPick(option)}
              className={cx(
                'flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm leading-6 transition-colors disabled:cursor-default',
                !answered && 'border-fd-border bg-fd-background hover:border-emerald-500/50 hover:bg-emerald-500/5',
                answered && isAnswer && 'border-emerald-500 bg-emerald-500/10',
                answered && isPicked && !isAnswer && 'border-rose-500 bg-rose-500/10',
                answered && !isAnswer && !isPicked && 'border-fd-border bg-fd-background opacity-55',
              )}
            >
              <span
                className={cx(
                  'flex size-6 shrink-0 items-center justify-center rounded-md border font-mono text-xs font-bold',
                  answered && isAnswer
                    ? 'border-emerald-500 bg-emerald-500 text-white dark:text-emerald-950'
                    : answered && isPicked
                      ? 'border-rose-500 bg-rose-500 text-white'
                      : 'border-fd-border text-fd-muted-foreground',
                )}
              >
                {answered && isAnswer ? <Check className="size-3.5" aria-hidden /> : answered && isPicked ? <X className="size-3.5" aria-hidden /> : LETTERS[i]}
              </span>
              <span className="text-fd-foreground">{question.options[option]}</span>
            </button>
          )
        })}
      </div>

      <div aria-live="polite">
        {answered ? (
          <div
            className={cx(
              'mt-4 rounded-xl border px-4 py-3 text-sm leading-6',
              correct ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-rose-500/40 bg-rose-500/5',
            )}
          >
            <p className={cx('font-bold', correct ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400')}>
              {correct ? 'Chính xác.' : 'Chưa đúng.'}
            </p>
            <p className="mt-1 text-fd-foreground">{question.why}</p>
            <a href={question.review.href} className="mt-1 inline-block text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Xem lại: {question.review.label}
            </a>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex justify-end">
        <DemoButton onClick={onNext} disabled={!answered}>
          {isLast ? 'Xem kết quả' : 'Câu tiếp'} <ArrowRight className="size-3.5" aria-hidden />
        </DemoButton>
      </div>
    </div>
  )
}

function Result({
  questions,
  picks,
  score,
  onRestart,
}: {
  questions: Prepared[]
  picks: Array<number | undefined>
  score: number
  onRestart: () => void
}) {
  const total = questions.length
  const ratio = score / total
  const wrong = questions.filter((q, i) => picks[i] !== q.answer)
  const verdict =
    ratio === 1
      ? 'Tuyệt đối. Mental model của bạn đã vững, sẵn sàng sang bài tiếp theo.'
      : ratio >= 0.75
        ? 'Rất tốt. Xem lại vài câu sai bên dưới rồi làm lại vào ngày mai.'
        : ratio >= 0.5
          ? 'Ổn, nhưng còn lỗ hổng. Đọc lại các phần được liệt kê, rồi làm lại quiz.'
          : 'Nên đọc lại bài. Hãy tập trung vào các hình minh hoạ, bấm thử từng cái, rồi quay lại đây.'

  const reviews = [...new Map(wrong.map((q) => [q.review.href, q.review])).values()]

  return (
    <div>
      <div className="flex items-center gap-4 rounded-xl border border-fd-border bg-fd-background p-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
          <Trophy className="size-7" aria-hidden />
        </span>
        <div>
          <p className="font-mono text-2xl font-bold text-fd-foreground">
            {score}/{total}
          </p>
          <p className="text-sm leading-6 text-fd-muted-foreground">{verdict}</p>
        </div>
      </div>

      {wrong.length ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-fd-foreground">Câu trả lời sai</p>
          <ul className="mt-2 space-y-2">
            {wrong.map((q) => (
              <li key={q.q} className="rounded-xl border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-sm leading-6">
                <p className="font-medium text-fd-foreground">{q.q}</p>
                <p className="text-fd-muted-foreground">
                  Đáp án: <span className="font-semibold text-emerald-700 dark:text-emerald-400">{q.options[q.answer]}</span>
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-fd-muted-foreground">
            Nên xem lại:{' '}
            {reviews.map((r, i) => (
              <span key={r.href}>
                {i > 0 ? ', ' : ''}
                <a href={r.href} className="font-semibold text-emerald-700 dark:text-emerald-400">{r.label}</a>
              </span>
            ))}
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex justify-end">
        <DemoButton onClick={onRestart}>
          <RotateCcw className="size-3.5" aria-hidden /> Làm lại với thứ tự mới
        </DemoButton>
      </div>
    </div>
  )
}
