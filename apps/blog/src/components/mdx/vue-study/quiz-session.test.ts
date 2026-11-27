import { describe, expect, it } from 'vitest'
import { QUIZZES, type QuizQuestion } from './quizzes'
import {
  mulberry32,
  prepareQuizQuestions,
  scoreQuiz,
  shuffle,
} from './quiz-session'

const sample: QuizQuestion[] = [
  {
    q: 'First?',
    options: ['yes', 'no'],
    answer: 0,
    why: 'because',
    review: { label: 'Intro', href: '#intro' },
  },
  {
    q: 'Second?',
    options: ['a', 'b', 'c'],
    answer: 2,
    why: 'because',
    review: { label: 'Deep', href: '#deep' },
  },
]

describe('prepareQuizQuestions', () => {
  it('uses a stable layout for the hydration seed across renders', () => {
    const first = prepareQuizQuestions(sample, 1)
    const second = prepareQuizQuestions(sample, 1)
    expect(second).toEqual(first)
    expect(first.map((q) => q.q)).toEqual(['First?', 'Second?'])
    first.forEach((q) => {
      expect(q.order).toHaveLength(q.options.length)
      expect(new Set(q.order).size).toBe(q.options.length)
    })
  })

  it('shuffles with a non-default seed but stays deterministic', () => {
    const run = prepareQuizQuestions(sample, 42)
    expect(prepareQuizQuestions(sample, 42)).toEqual(run)
    expect(run.some((q, index) => q.q !== sample[index].q || q.order.join() !== '0,1')).toBe(
      true,
    )
  })

  it('preserves the canonical answer index after option shuffle', () => {
    const prepared = prepareQuizQuestions(sample, 99)
    prepared.forEach((q) => {
      expect(q.answer).toBeGreaterThanOrEqual(0)
      expect(q.answer).toBeLessThan(q.options.length)
      expect(q.order).toHaveLength(q.options.length)
      expect(new Set(q.order).size).toBe(q.options.length)
    })
  })
})

describe('scoreQuiz', () => {
  it('counts only picks that match the stored answer index', () => {
    const prepared = prepareQuizQuestions(sample, 1)
    expect(scoreQuiz(prepared, [0, undefined])).toBe(1)
    expect(scoreQuiz(prepared, [0, 2])).toBe(2)
    expect(scoreQuiz(prepared, [1, 0])).toBe(0)
  })
})

describe('mulberry32 + shuffle', () => {
  it('returns a permutation of the original items', () => {
    const items = [0, 1, 2, 3, 4, 5, 6, 7]
    const shuffled = shuffle(items, mulberry32(7))
    expect([...shuffled].sort((a, b) => a - b)).toEqual(items)
    expect(shuffle(items, mulberry32(7))).toEqual(shuffled)
  })
})

describe('published vue-study quiz bank', () => {
  it('has a non-empty quiz for every published lesson slug', () => {
    const lessonIds = Object.keys(QUIZZES)
    expect(lessonIds.length).toBeGreaterThanOrEqual(15)
    for (const id of lessonIds) {
      const questions = QUIZZES[id as keyof typeof QUIZZES]
      expect(questions.length, id).toBeGreaterThan(0)
      for (const question of questions) {
        expect(question.q.length).toBeGreaterThan(0)
        expect(question.options.length).toBeGreaterThanOrEqual(2)
        expect(question.answer).toBeGreaterThanOrEqual(0)
        expect(question.answer).toBeLessThan(question.options.length)
        expect(question.why.length).toBeGreaterThan(0)
        expect(question.review.href.startsWith('#')).toBe(true)
      }
    }
  })
})