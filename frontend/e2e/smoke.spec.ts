import { expect, test } from '@playwright/test';

test('@smoke loads the sign-in surface at desktop and mobile widths', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Sign in to your workspace' })).toBeVisible();
  await expect(page.getByLabel('Email address')).toHaveValue('demo@issueflow.dev');
  await expect(page.getByRole('button', { name: 'Continue to IssueFlow' })).toBeVisible();
});
