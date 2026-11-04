import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const slideDeckPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../public/slides/copilot-token-optimization/index.html',
)

const SLIDE_DECK_IMAGE_PREFIX = '/slides/copilot-token-optimization/images/'

describe('copilot token optimization slide deck assets', () => {
  it('uses root-relative image paths so assets resolve with or without a trailing slash', () => {
    const html = readFileSync(slideDeckPath, 'utf8')
    const imageSources = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(
      (match) => match[1],
    )

    expect(imageSources.length).toBeGreaterThan(0)

    for (const src of imageSources) {
      expect(src).toMatch(
        new RegExp(
          `^${SLIDE_DECK_IMAGE_PREFIX.replace(/\//g, '\\/')}[a-z0-9_]+\\.png$`,
        ),
      )
      expect(src.startsWith('images/')).toBe(false)
    }
  })
})
