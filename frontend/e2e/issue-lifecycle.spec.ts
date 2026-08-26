import { expect, test } from '@playwright/test';

test('sign in and complete an issue lifecycle', async ({ page }) => {
  await page.goto('/login');
  const email = page.getByLabel('Email address');
  await expect(email.or(page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ }))).toBeVisible();
  if (await email.isVisible()) {
    await email.fill('demo@issueflow.dev');
    await page.getByLabel('Password', { exact: true }).fill('issueflow');
    const loginResponse = page.waitForResponse((response) => response.url().endsWith('/api/auth/login'));
    await page.getByRole('button', { name: 'Continue to IssueFlow' }).click();
    expect((await loginResponse).ok()).toBe(true);
  }
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto('/issues');
  await page.getByRole('link', { name: 'New issue' }).click();
  const title = `Playwright lifecycle ${Date.now()}`;
  await page.getByLabel(/Title/).fill(title);
  await page.getByLabel('Description').fill('Created by the IssueFlow end-to-end test.');
  await page.getByLabel('Priority').selectOption('high');
  await page.getByRole('button', { name: 'Create issue' }).click();
  await expect(page).toHaveURL(/\/issues\/\d+$/);
  await expect(page.getByRole('heading', { name: title })).toBeVisible();

  await page.getByLabel('Add a comment').fill('Playwright verified this workflow.');
  await page.getByRole('button', { name: 'Comment' }).click();
  await expect(page.getByText('Playwright verified this workflow.')).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'playwright-note.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('IssueFlow attachment lifecycle test.'),
  });
  await expect(page.getByText('playwright-note.txt')).toBeVisible();

  await page.getByRole('link', { name: 'Edit' }).click();
  await page.getByLabel(/Title/).fill(`${title} edited`);
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('heading', { name: `${title} edited` })).toBeVisible();

  await page.getByRole('button', { name: 'Delete' }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  await expect(page).toHaveURL(/\/issues(?:\?|$)/);
});
