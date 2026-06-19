import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import mdx from 'fumadocs-mdx/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import { createVitePwaPluginOptions } from './src/lib/pwa-config.ts'
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
    VitePWA(createVitePwaPluginOptions()),
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
