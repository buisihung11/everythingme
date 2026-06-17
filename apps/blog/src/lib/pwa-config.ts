export const PWA_WORKBOX_GLOB_PATTERNS = [
  '**/*.{js,css,ico,png,svg,woff,woff2}',
] as const

export const PWA_PAGES_CACHE_NAME = 'pages-cache'
export const PWA_NETWORK_TIMEOUT_SECONDS = 3

export function isNavigateRequest(request: { mode: string }): boolean {
  return request.mode === 'navigate'
}

export function createVitePwaPluginOptions() {
  return {
    registerType: 'autoUpdate' as const,
    injectRegister: 'auto' as const,
    manifest: false,
    workbox: {
      globPatterns: [...PWA_WORKBOX_GLOB_PATTERNS],
      runtimeCaching: [
        {
          urlPattern: ({ request }: { request: { mode: string } }) =>
            isNavigateRequest(request),
          handler: 'NetworkFirst' as const,
          options: {
            cacheName: PWA_PAGES_CACHE_NAME,
            networkTimeoutSeconds: PWA_NETWORK_TIMEOUT_SECONDS,
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    },
    devOptions: {
      enabled: true,
      type: 'module' as const,
    },
  }
}
