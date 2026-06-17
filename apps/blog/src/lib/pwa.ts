export const PWA_THEME_COLOR = '#000000'
export const PWA_APP_TITLE = 'EverythingMe'
export const PWA_MANIFEST_PATH = '/manifest.json'
export const PWA_APPLE_TOUCH_ICON = '/logo192.png'

export interface HeadMetaTag {
  name?: string
  content?: string
}

export interface HeadLink {
  rel: string
  href: string
}

export function buildPwaHeadMeta(): HeadMetaTag[] {
  return [
    { name: 'theme-color', content: PWA_THEME_COLOR },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    {
      name: 'apple-mobile-web-app-status-bar-style',
      content: 'black-translucent',
    },
    { name: 'apple-mobile-web-app-title', content: PWA_APP_TITLE },
  ]
}

export function buildPwaHeadLinks(): HeadLink[] {
  return [
    { rel: 'manifest', href: PWA_MANIFEST_PATH },
    { rel: 'apple-touch-icon', href: PWA_APPLE_TOUCH_ICON },
  ]
}

export interface WebManifestIcon {
  src: string
  sizes?: string
  type?: string
  purpose?: string
}

export interface WebManifest {
  name: string
  short_name: string
  start_url: string
  display: string
  icons: WebManifestIcon[]
  theme_color?: string
}

export function validateWebManifest(manifest: WebManifest): string[] {
  const errors: string[] = []

  if (!manifest.name) {
    errors.push('name is required')
  }
  if (!manifest.short_name) {
    errors.push('short_name is required')
  }
  if (manifest.start_url !== '/') {
    errors.push('start_url must be "/"')
  }
  if (manifest.display !== 'standalone') {
    errors.push('display must be "standalone"')
  }

  const has192 = manifest.icons.some((icon) => icon.sizes?.includes('192'))
  const has512 = manifest.icons.some((icon) => icon.sizes?.includes('512'))
  if (!has192) {
    errors.push('192x192 icon is required')
  }
  if (!has512) {
    errors.push('512x512 icon is required')
  }

  return errors
}
