import { MAX_QUOTE_LENGTH, type TextAnchor } from './reading-notes'

const EXCLUDED =
  'button, input, textarea, select, script, style, svg, [hidden], [aria-hidden="true"], [contenteditable="true"], [data-note-ignore]'

function textNodes(root: Node): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement?.closest(EXCLUDED)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  })
  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)
  return nodes
}

function textBefore(root: HTMLElement, container: Node, offset: number) {
  const prefix = document.createRange()
  prefix.selectNodeContents(root)
  prefix.setEnd(container, offset)
  return textNodes(prefix.cloneContents())
    .map((node) => node.data)
    .join('').length
}

export function captureAnchor(
  root: HTMLElement,
  range: Range,
): TextAnchor | null {
  if (
    range.collapsed ||
    !root.contains(range.startContainer) ||
    !root.contains(range.endContainer)
  )
    return null
  if (
    range.startContainer.parentElement?.closest(EXCLUDED) ||
    range.endContainer.parentElement?.closest(EXCLUDED)
  )
    return null
  const text = textNodes(root)
    .map((node) => node.data)
    .join('')
  const start = textBefore(root, range.startContainer, range.startOffset)
  const end = textBefore(root, range.endContainer, range.endOffset)
  const quote = text.slice(start, end)
  if (!quote.trim() || quote.length > MAX_QUOTE_LENGTH) return null
  return {
    start,
    end,
    quote,
    prefix: text.slice(Math.max(0, start - 32), start),
    suffix: text.slice(end, end + 32),
  }
}

export function locateAnchor(text: string, anchor: TextAnchor): number | null {
  const matchesContext = (start: number) =>
    text.slice(Math.max(0, start - anchor.prefix.length), start) ===
      anchor.prefix &&
    text.slice(
      start + anchor.quote.length,
      start + anchor.quote.length + anchor.suffix.length,
    ) === anchor.suffix
  if (
    text.slice(anchor.start, anchor.end) === anchor.quote &&
    matchesContext(anchor.start)
  )
    return anchor.start
  const matches: number[] = []
  let index = text.indexOf(anchor.quote)
  while (index !== -1) {
    matches.push(index)
    index = text.indexOf(anchor.quote, index + 1)
  }
  if (matches.length === 1) return matches[0]
  const contextual = matches.filter(matchesContext)
  return contextual.length === 1 ? contextual[0] : null
}

export function resolveAnchor(
  root: HTMLElement,
  anchor: TextAnchor,
): Range | null {
  const nodes = textNodes(root)
  const start = locateAnchor(nodes.map((node) => node.data).join(''), anchor)
  if (start === null) return null
  const end = start + anchor.quote.length
  const range = document.createRange()
  let offset = 0
  let started = false
  for (const node of nodes) {
    const next = offset + node.length
    if (!started && start < next) {
      range.setStart(node, start - offset)
      started = true
    }
    if (started && end <= next) {
      range.setEnd(node, end - offset)
      return range
    }
    offset = next
  }
  return null
}
