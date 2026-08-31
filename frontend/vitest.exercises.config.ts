import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['exercises/typescript/exercise.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html', 'lcov'],
      reportsDirectory: 'coverage/exercises',
      include: ['exercises/typescript/contracts.ts', 'exercises/typescript/reference.ts'],
      exclude: ['exercises/typescript/workbench.ts'],
      thresholds: {
        lines: 94,
        statements: 91,
        functions: 100,
        branches: 87,
      },
    },
  },
});
