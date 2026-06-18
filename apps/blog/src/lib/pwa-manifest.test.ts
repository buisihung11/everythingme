import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

interface ManifestIcon {
  src: string
  sizes?: string
  type?: string
  purpose?: string
}

interface WebManifest {
  name: string
  short_name: string
  description?: string
  start_url: string
  display: string
  theme_color?: string
  background_color?: string
  icons: ManifestIcon[]
}

const manifestPath = path.join(process.cwd(), 'public/manifest.json')

function readManifest(): WebManifest {
  return JSON.parse(readFileSync(manifestPath, 'utf8')) as WebManifest
}

describe('PWA manifest', () => {
  it('declares required installability fields', () => {
    const manifest = readManifest()

    expect(manifest.name).toBe('Everything Me - Blog')
    expect(manifest.short_name).toBe('EverythingMe')
    expect(manifest.start_url).toBe('/')
    expect(manifest.display).toBe('standalone')
    expect(manifest.icons.length).toBeGreaterThanOrEqual(1)
  })

  it('keeps theme colors aligned with the root layout head config', () => {
    const manifest = readManifest()

    expect(manifest.theme_color).toBe('#000000')
    expect(manifest.background_color).toBe('#ffffff')
  })

  it('includes maskable icons for Android home-screen installs', () => {
    const manifest = readManifest()
    const maskableIcons = manifest.icons.filter((icon) =>
      icon.purpose?.includes('maskable'),
    )

    expect(maskableIcons.length).toBeGreaterThanOrEqual(1)
    expect(maskableIcons.some((icon) => icon.sizes?.includes('192x192'))).toBe(
      true,
    )
    expect(maskableIcons.some((icon) => icon.sizes?.includes('512x512'))).toBe(
      true,
    )
  })
})
