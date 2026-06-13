import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import mdx from 'fumadocs-mdx/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { docs } from './source.config.ts'

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
  plugins: [
    devtools(),
    tailwindcss(),
    mdx(
      Promise.resolve({
        docs,
      }),
      { index: false },
    ),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
