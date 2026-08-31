import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'exercises/**/*.test.{ts,tsx}', 'contract-tests/**/*.test.{ts,mjs}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html', 'lcov'],
      reportsDirectory: 'coverage/product',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/data/**',
        'src/app/**',
        'src/layouts/**',
        'src/screens/**',
        'src/server/issueflow-db.ts',
        'src/features/typescript-lab/catalog.ts',
      ],
      thresholds: {
        lines: 67,
        statements: 63,
        functions: 62,
        branches: 60,
        'src/api/issueflowApi.ts': {
          lines: 40,
          statements: 35,
          functions: 35,
          branches: 28,
        },
        'src/server/auth.ts': {
          lines: 95,
          statements: 95,
          functions: 100,
          branches: 90,
        },
        'src/server/problem.ts': {
          lines: 100,
          statements: 100,
          functions: 100,
          branches: 100,
        },
        'src/features/issues/runtime-contracts.ts': {
          lines: 80,
          statements: 75,
          functions: 80,
          branches: 70,
        },
        'src/server/request-contract.ts': {
          lines: 100,
          statements: 100,
          functions: 100,
          branches: 80,
        },
      },
    },
  },
});
