import { describe, expect, it } from 'vitest'
import {
  PWA_NETWORK_TIMEOUT_SECONDS,
  PWA_PAGES_CACHE_NAME,
  PWA_WORKBOX_GLOB_PATTERNS,
  createVitePwaPluginOptions,
  isNavigateRequest,
} from './pwa-config'

describe('isNavigateRequest', () => {
  it('matches document navigations for offline page caching', () => {
    expect(isNavigateRequest({ mode: 'navigate' })).toBe(true)
  })

  it('ignores asset and API requests', () => {
    expect(isNavigateRequest({ mode: 'cors' })).toBe(false)
    expect(isNavigateRequest({ mode: 'same-origin' })).toBe(false)
  })
})

describe('createVitePwaPluginOptions', () => {
  it('uses the public manifest and auto-updates the service worker', () => {
    const options = createVitePwaPluginOptions()

    expect(options.registerType).toBe('autoUpdate')
    expect(options.injectRegister).toBe('auto')
    expect(options.manifest).toBe(false)
  })

  it('precaches static assets and caches page navigations with NetworkFirst', () => {
    const options = createVitePwaPluginOptions()
    const [runtimeRule] = options.workbox.runtimeCaching

    expect(options.workbox.globPatterns).toEqual([
      ...PWA_WORKBOX_GLOB_PATTERNS,
    ])
    expect(runtimeRule?.handler).toBe('NetworkFirst')
    expect(runtimeRule?.options).toMatchObject({
      cacheName: PWA_PAGES_CACHE_NAME,
      networkTimeoutSeconds: PWA_NETWORK_TIMEOUT_SECONDS,
      cacheableResponse: { statuses: [0, 200] },
    })
    expect(
      runtimeRule?.urlPattern({
        request: { mode: 'navigate' },
      }),
    ).toBe(true)
    expect(
      runtimeRule?.urlPattern({
        request: { mode: 'cors' },
      }),
    ).toBe(false)
  })

  it('enables the service worker in development', () => {
    expect(createVitePwaPluginOptions().devOptions).toEqual({
      enabled: true,
      type: 'module',
    })
  })
})
