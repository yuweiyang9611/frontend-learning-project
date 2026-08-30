import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function expectNoSeriousViolations(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const blocking = result.violations.filter((violation) =>
    violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
}

test('@a11y login, dashboard, and TypeScript Lab have no serious or critical axe violations', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Sign in to your workspace' })).toBeVisible();
  await expectNoSeriousViolations(page);

  await page.getByLabel('Email address').fill('demo@issueflow.dev');
  await page.getByLabel('Password', { exact: true }).fill('issueflow');
  await page.getByRole('button', { name: 'Continue to IssueFlow' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expectNoSeriousViolations(page);

  await page.goto('/labs/typescript');
  await expect(page.getByRole('heading', { name: 'TypeScript Lab' })).toBeVisible();
  await expectNoSeriousViolations(page);
});
