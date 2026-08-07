import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      '@everythingme/api': path.resolve(
        __dirname,
        '../../../libs/foundation/api/src/index.ts',
      ),
    },
  },
  test: {
    environment: 'jsdom',
    passWithNoTests: true,
    include: ['**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**'],
  },
});
