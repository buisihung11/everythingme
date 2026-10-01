import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const publicDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../public',
)

const SLIDE_DECKS = [
  'copilot-token-optimization',
  'copilot-token-optimization-v2',
] as const

function extractImageSources(html: string): string[] {
  return [...html.matchAll(/<img[^>]+src="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((src) => src.length > 0)
}

describe.each(SLIDE_DECKS)('%s slide deck assets', (deckSlug) => {
  const deckDir = path.join(publicDir, 'slides', deckSlug)
  const indexPath = path.join(deckDir, 'index.html')
  const imagePrefix = `/slides/${deckSlug}/images/`

  it('uses root-relative image paths so assets resolve with or without a trailing slash', () => {
    const html = readFileSync(indexPath, 'utf8')
    const imageSources = extractImageSources(html)

    expect(imageSources.length).toBeGreaterThan(0)

    for (const src of imageSources) {
      expect(src, `unexpected image src: ${src}`).toMatch(
        new RegExp(`^${imagePrefix.replace(/\//g, '\\/')}.+`),
      )
      expect(src.startsWith('images/')).toBe(false)
    }
  })

  it('references image files that exist on disk', () => {
    const html = readFileSync(indexPath, 'utf8')
    const imageSources = extractImageSources(html)

    for (const src of imageSources) {
      const filePath = path.join(publicDir, src)
      expect(existsSync(filePath), `missing asset for ${src}`).toBe(true)
    }
  })
})

describe('copilot token optimization v2 slide deck content', () => {
  it('includes ROI and chronicle cost tip slides added in PR #28', () => {
    const html = readFileSync(
      path.join(publicDir, 'slides/copilot-token-optimization-v2/index.html'),
      'utf8',
    )

    expect(html).toContain('/slides/copilot-token-optimization-v2/images/ROI.png')
    expect(html).toContain(
      '/slides/copilot-token-optimization-v2/images/chronical_cost_tip.png',
    )
    expect(html).toContain('Key <span class="accent">takeaways</span>')
  })
})

describe('optimizing-github-copilot-tokens blog post', () => {
  const mdxPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../content/blog/technical/ai-tools/optimizing-github-copilot-tokens.mdx',
  )

  it('links to the v2 slide deck referenced after PR #27', () => {
    const mdx = readFileSync(mdxPath, 'utf8')

    expect(mdx).toContain('/slides/copilot-token-optimization-v2/')
    expect(mdx).not.toContain('](/slides/copilot-token-optimization/)')
  })
})
