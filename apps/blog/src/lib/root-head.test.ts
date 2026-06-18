import { describe, expect, it } from 'vitest'
import { getRootHead } from './root-head'

describe('getRootHead', () => {
  it('includes PWA installability meta tags added in the PWA rollout', () => {
    const { meta } = getRootHead('/styles.css')

    expect(meta).toContainEqual({ name: 'theme-color', content: '#000000' })
    expect(meta).toContainEqual({
      name: 'apple-mobile-web-app-capable',
      content: 'yes',
    })
    expect(meta).toContainEqual({
      name: 'apple-mobile-web-app-status-bar-style',
      content: 'black-translucent',
    })
    expect(meta).toContainEqual({
      name: 'apple-mobile-web-app-title',
      content: 'EverythingMe',
    })
  })

  it('links the web manifest and apple touch icon for install prompts', () => {
    const { links } = getRootHead('/styles.css')

    expect(links).toContainEqual({
      rel: 'manifest',
      href: '/manifest.json',
    })
    expect(links).toContainEqual({
      rel: 'apple-touch-icon',
      href: '/logo192.png',
    })
  })

  it('keeps the stylesheet href wired from the app bundle', () => {
    const { links } = getRootHead('/assets/styles-abc123.css')

    expect(links).toContainEqual({
      rel: 'stylesheet',
      href: '/assets/styles-abc123.css',
    })
  })
})
