import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['services/**/*.test.ts', 'web/src/**/*.test.ts'],
  },
});
