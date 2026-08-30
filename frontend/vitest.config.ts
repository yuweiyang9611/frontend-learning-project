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
      include: ['src/**/*.{ts,tsx}', 'exercises/typescript/contracts.ts', 'exercises/typescript/reference.ts'],
      exclude: [
        'src/data/**',
        'src/app/**',
        'src/layouts/**',
        'src/screens/**',
        'src/server/issueflow-db.ts',
        'src/features/typescript-lab/catalog.ts',
        'exercises/typescript/workbench.ts',
      ],
      thresholds: {
        lines: 50,
        statements: 50,
        functions: 45,
        branches: 45,
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
