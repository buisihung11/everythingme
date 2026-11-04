import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@studying/uber-clone/shared': resolve(
        __dirname,
        'packages/shared/src/index.ts',
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['web/src/**/*.test.ts', 'packages/shared/src/**/*.test.ts'],
  },
});
