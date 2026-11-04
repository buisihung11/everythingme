import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  PWA_APP_TITLE,
  PWA_APPLE_TOUCH_ICON,
  PWA_MANIFEST_PATH,
  PWA_THEME_COLOR,
  buildPwaHeadLinks,
  buildPwaHeadMeta,
  validateWebManifest,
  type WebManifest,
} from './pwa'

const manifestPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../public/manifest.json',
)

describe('buildPwaHeadMeta', () => {
  it('includes installability meta tags for mobile browsers', () => {
    expect(buildPwaHeadMeta()).toEqual([
      { name: 'theme-color', content: PWA_THEME_COLOR },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'black-translucent',
      },
      { name: 'apple-mobile-web-app-title', content: PWA_APP_TITLE },
    ])
  })
})

describe('buildPwaHeadLinks', () => {
  it('links the web manifest and apple touch icon', () => {
    expect(buildPwaHeadLinks()).toEqual([
      { rel: 'manifest', href: PWA_MANIFEST_PATH },
      { rel: 'apple-touch-icon', href: PWA_APPLE_TOUCH_ICON },
    ])
  })
})

describe('validateWebManifest', () => {
  const validManifest: WebManifest = {
    name: 'Everything Me - Blog',
    short_name: 'EverythingMe',
    start_url: '/',
    display: 'standalone',
    icons: [
      { src: 'logo192.png', sizes: '192x192', type: 'image/png' },
      { src: 'logo512.png', sizes: '512x512', type: 'image/png' },
    ],
  }

  it('accepts a valid installable manifest', () => {
    expect(validateWebManifest(validManifest)).toEqual([])
  })

  it('rejects manifests missing required install fields', () => {
    expect(
      validateWebManifest({
        ...validManifest,
        start_url: '.',
        display: 'browser',
        icons: [{ src: 'favicon.ico', sizes: '64x64' }],
      }),
    ).toEqual([
      'start_url must be "/"',
      'display must be "standalone"',
      '192x192 icon is required',
      '512x512 icon is required',
    ])
  })

  it('rejects manifests missing name or short_name', () => {
    expect(
      validateWebManifest({
        ...validManifest,
        name: '',
        short_name: '',
      }),
    ).toEqual(['name is required', 'short_name is required'])
  })
})

describe('public/manifest.json', () => {
  it('satisfies installability requirements', () => {
    const manifest = JSON.parse(
      readFileSync(manifestPath, 'utf8'),
    ) as WebManifest

    expect(validateWebManifest(manifest)).toEqual([])
    expect(manifest.theme_color).toBe(PWA_THEME_COLOR)
  })
})
