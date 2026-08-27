import { expect, test } from '@playwright/test';

test('explores a TypeScript lesson and keeps local progress', async ({ page }) => {
  await page.goto('/login');
  const email = page.getByLabel('Email address');
  await expect(email.or(page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ }))).toBeVisible();
  if (await email.isVisible()) {
    await email.fill('demo@issueflow.dev');
    await page.getByLabel('Password', { exact: true }).fill('issueflow');
    await page.getByRole('button', { name: 'Continue to IssueFlow' }).click();
  }

  await page.getByRole('link', { name: 'TypeScript Lab' }).click();
  await expect(page).toHaveURL(/\/labs\/typescript/);
  await page.getByRole('button', { name: /as const, unions, and never/ }).click();

  const status = page.getByLabel('Issue status');
  await status.fill('blocked');
  await page.getByRole('button', { name: 'Run example' }).click();
  await expect(page.getByText('Invalid union member')).toBeVisible();

  await status.fill('in_progress');
  await page.getByRole('button', { name: 'Run example' }).click();
  await expect(page.getByText('Union narrowed')).toBeVisible();
  await page.getByRole('button', { name: 'Mark complete' }).click();
  await page.reload();

  await expect(page).toHaveURL(/lesson=literal-unions/);
  await expect(page.getByRole('button', { name: 'Completed' })).toHaveAttribute('aria-pressed', 'true');
});
