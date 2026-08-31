import { defineConfig, devices } from '@playwright/test';

const previewPort = 4175;
const siteUrl = `http://127.0.0.1:${previewPort}/frontend-learning-project/`;

export default defineConfig({
  testDir: './docs/e2e',
  timeout: 30_000,
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  expect: { timeout: 10_000 },
  use: {
    baseURL: siteUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'docs-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run docs:preview -- --port ${previewPort}`,
    url: siteUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
