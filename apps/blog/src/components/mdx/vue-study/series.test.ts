import { describe, expect, it } from 'vitest'
import { QUIZZES } from './quizzes'
import { VUE_STUDY_HOME, VUE_STUDY_LESSONS, lessonHref } from './series'

describe('vue-study series navigation', () => {
  it('links each published lesson under the series home', () => {
    const published = VUE_STUDY_LESSONS.filter((lesson) => lesson.status === 'published')
    expect(published.length).toBeGreaterThanOrEqual(15)
    for (const lesson of published) {
      expect(lessonHref(lesson.slug)).toBe(`${VUE_STUDY_HOME}/${lesson.slug}`)
      expect(QUIZZES[lesson.slug as keyof typeof QUIZZES]?.length).toBeGreaterThan(0)
    }
  })

  it('does not advertise quizzes for lessons that are still planned', () => {
    const planned = VUE_STUDY_LESSONS.filter((lesson) => lesson.status === 'planned')
    for (const lesson of planned) {
      expect(QUIZZES[lesson.slug as keyof typeof QUIZZES]).toBeUndefined()
    }
  })
})