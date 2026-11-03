import { describe, expect, it } from 'vitest'
import { captureAnchor, locateAnchor, resolveAnchor } from './text-anchors'

function article(html: string) {
  const root = document.createElement('div')
  root.innerHTML = html
  return root
}

describe('text anchors', () => {
  it('restores a selection across inline markup and paragraphs after reload', () => {
    const root = article(
      '<p>Hello <strong>beautiful</strong> world.</p><p>Read on.</p>',
    )
    const range = document.createRange()
    range.setStart(root.querySelector('strong')!.firstChild!, 2)
    range.setEnd(root.querySelectorAll('p')[1].firstChild!, 4)
    const anchor = captureAnchor(root, range)!
    const reloaded = article(root.innerHTML)
    expect(resolveAnchor(reloaded, anchor)?.toString()).toBe(range.toString())
  })
  it('ignores article controls in offsets', () => {
    const root = article(
      '<p>Before</p><button>Copy code</button><p>Keep this</p>',
    )
    const range = document.createRange()
    range.selectNodeContents(root.lastChild!)
    const anchor = captureAnchor(root, range)!
    expect(anchor.start).toBe(6)
    expect(resolveAnchor(root, anchor)?.toString()).toBe('Keep this')
  })
  it('relocates the correct occurrence after preceding content changes', () => {
    const root = article(
      '<p>First repeated quote.</p><p>Second repeated quote.</p>',
    )
    const range = document.createRange()
    range.setStart(root.lastChild!.firstChild!, 7)
    range.setEnd(root.lastChild!.firstChild!, 21)
    const anchor = captureAnchor(root, range)!
    root.prepend(document.createTextNode('An introduction. '))
    expect(resolveAnchor(root, anchor)?.startContainer).toBe(
      root.lastChild!.firstChild,
    )
  })
  it('keeps an ambiguous or removed quote unresolved', () => {
    const anchor = {
      start: 0,
      end: 4,
      quote: 'idea',
      prefix: 'old',
      suffix: 'old',
    }
    expect(locateAnchor('idea and another idea', anchor)).toBeNull()
    expect(locateAnchor('Something entirely new', anchor)).toBeNull()
  })
  it('rejects selections outside the article, empty selections and oversized quotes', () => {
    const root = article('<p>Inside</p>')
    const outside = article('<p>Outside</p>')
    const range = document.createRange()
    range.selectNodeContents(outside)
    expect(captureAnchor(root, range)).toBeNull()
    range.selectNodeContents(root)
    range.collapse()
    expect(captureAnchor(root, range)).toBeNull()
    root.textContent = 'a'.repeat(10001)
    range.selectNodeContents(root)
    expect(captureAnchor(root, range)).toBeNull()
  })
})
