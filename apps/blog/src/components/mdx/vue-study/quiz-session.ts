import type { QuizQuestion } from './quizzes'

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(items: T[], random: () => number) {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export type PreparedQuizQuestion = QuizQuestion & { order: number[] }

/** The first round uses a fixed seed so server and client render the same option order. */
export function prepareQuizQuestions(
  questions: QuizQuestion[],
  seed: number,
): PreparedQuizQuestion[] {
  const random = mulberry32(seed)
  const qs = seed === 1 ? questions : shuffle(questions, random)
  return qs.map((q) => ({
    ...q,
    order: shuffle(
      q.options.map((_, i) => i),
      random,
    ),
  }))
}

export function scoreQuiz(
  questions: PreparedQuizQuestion[],
  picks: Array<number | undefined>,
) {
  return questions.filter((q, i) => picks[i] === q.answer).length
}