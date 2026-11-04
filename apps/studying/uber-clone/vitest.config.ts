import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@studying/uber-clone/shared': path.resolve(
        __dirname,
        'packages/shared/src/index.ts',
      ),
    },
  },
  test: {
    environment: 'node',
    passWithNoTests: false,
    include: [
      'web/src/**/*.test.ts',
      'packages/shared/src/**/*.test.ts',
    ],
  },
});
