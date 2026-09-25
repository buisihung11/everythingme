import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const packageRoot = resolve(import.meta.dirname);

export default defineConfig({
  resolve: {
    alias: {
      '@studying/uber-clone/shared': resolve(
        packageRoot,
        'packages/shared/src/index.ts',
      ),
    },
  },
  test: {
    environment: 'node',
    passWithNoTests: false,
    include: ['web/src/**/*.{test,spec}.ts'],
  },
});
