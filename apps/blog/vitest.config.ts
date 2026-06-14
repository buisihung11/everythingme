import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '#': path.resolve(__dirname, './src'),
      '@everythingme/auth': path.resolve(
        __dirname,
        '../../libs/foundation/auth/src/index.ts',
      ),
      '@everythingme/config': path.resolve(
        __dirname,
        '../../libs/foundation/config/src/index.ts',
      ),
      '@everythingme/ui': path.resolve(
        __dirname,
        '../../libs/foundation/ui/src/index.ts',
      ),
    },
  },
  test: {
    environment: 'jsdom',
    passWithNoTests: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'json', 'lcov'],
      reportOnFailure: true,
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/test/**',
        'src/routeTree.gen.ts',
      ],
    },
  },
})
