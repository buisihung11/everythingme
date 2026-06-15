import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import mdx from 'fumadocs-mdx/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import { docs } from './source.config.ts'

const isVercelBuild = Boolean(process.env.VERCEL || process.env.CI)

const config = defineConfig({
  root: path.resolve(__dirname),
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@everythingme/auth': path.resolve(
        __dirname,
        '../../libs/foundation/auth/src/index.ts',
      ),
      '@everythingme/config': path.resolve(
        __dirname,
        '../../libs/foundation/config/src/index.ts',
      ),
      '@everythingme/db': path.resolve(
        __dirname,
        '../../libs/foundation/db/src/index.ts',
      ),
      '@everythingme/ui': path.resolve(
        __dirname,
        '../../libs/foundation/ui/src/index.ts',
      ),
    },
  },
  ssr: {
    external: ['tslib'],
  },
  plugins: [
    devtools({ removeDevtoolsOnBuild: true }),
    tailwindcss(),
    mdx(
      Promise.resolve({
        docs,
      }),
      { index: false },
    ),
    tanstackStart(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false, // use public/manifest.json as-is
      workbox: {
        globPatterns: ['**/*.{js,css,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              networkTimeoutSeconds: 3,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
    nitro(
      isVercelBuild
        ? {
            preset: 'vercel',
            traceDeps: ['tslib*'],
            vercel: {
              entryFormat: 'node',
            },
          }
        : {},
    ),
    viteReact(),
  ],
})

export default config
