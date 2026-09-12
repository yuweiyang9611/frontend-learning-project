import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
      'cloudflare:workers': fileURLToPath(new URL('./test/cloudflare.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: [
      'src/screens/workspace.test.tsx',
      'src/app/AppProviders.test.tsx',
      'src/features/workspace/**/*.test.ts',
      'src/server/workspace.integration.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html', 'lcov'],
      include: [
        'src/screens/DashboardPage.tsx',
        'src/screens/UsersPage.tsx',
        'src/screens/BoardPage.tsx',
        'src/screens/settings/ProfileSettingsPage.tsx',
        'src/screens/settings/AccountSettingsPage.tsx',
        'src/app/AppProviders.tsx',
        'src/features/workspace/*.{ts,tsx}',
        'src/server/settings.ts',
      ],
      exclude: ['**/*.test.{ts,tsx}'],
      reportsDirectory: 'coverage/workspace',
      thresholds: { lines: 80, statements: 80, functions: 80, branches: 70 },
    },
  },
});
