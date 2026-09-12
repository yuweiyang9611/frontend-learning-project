import { expect, test } from '@playwright/test';
test('workspace settings persist after reload and profile email is readonly', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email address').fill('demo@issueflow.dev');
  await page.getByLabel('Password', { exact: true }).fill('issueflow');
  await page.getByRole('button', { name: 'Continue to IssueFlow' }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.goto('/settings/profile');
  await page.getByLabel('Display name').fill('Browser Profile');
  await expect(page.getByLabel('Email', { exact: true })).toHaveAttribute('readonly');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Profile saved', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Display name')).toHaveValue('Browser Profile');
  await page.goto('/settings/account');
  await page.getByRole('checkbox', { name: /Weekly digest/ }).check();
  await page.getByRole('button', { name: 'Save preferences' }).click();
  await expect(page.getByText('Preferences saved', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('checkbox', { name: /Weekly digest/ })).toBeChecked();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Request export' }).click();
  expect((await download).suggestedFilename()).toBe('issueflow-preferences.json');
  await page.request.patch('/api/me/profile', { data: { displayName: 'Jordan Davis' } });
  await page.request.put('/api/me/preferences', { data: { assigned: true, mentions: true, digest: false } });
});
test('board loads beyond 100 and remains operable with the keyboard on a narrow viewport', async ({ page }) => {
  test.setTimeout(180_000);
  await page.request.post('/api/auth/login', { data: { email: 'demo@issueflow.dev', password: 'issueflow' } });
  const ids: number[] = [];
  try {
    for (let i = 0; i < 105; i++) {
      const response = await page.request.post('/api/issues', {
        data: {
          title: 'Board bulk ' + Date.now() + ' ' + i,
          description: 'Pagination regression',
          status: 'open',
          priority: 'low',
          assigneeId: null,
          tags: [],
          dueDate: null,
        },
      });
      expect(response.status()).toBe(201);
      ids.push((await response.json()).id);
    }
    const overview = await (await page.request.get('/api/workspace/overview')).json();
    expect(overview.total).toBeGreaterThan(100);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/board');
    const open = page.getByRole('region', { name: 'Open' });
    await expect(open.getByRole('combobox').first()).toBeVisible();
    while (await page.getByRole('button', { name: 'Load more Open' }).count()) {
      const button = page.getByRole('button', { name: 'Load more Open' });
      await expect(button).toBeEnabled();
      const before = await open.getByRole('combobox').count();
      await button.click();
      await expect.poll(() => open.getByRole('combobox').count()).toBeGreaterThan(before);
    }
    expect(await open.getByRole('combobox').count()).toBe(overview.byStatus.open);
    const id = ids[0],
      select = page.getByRole('combobox', { name: 'Change status for IF-' + id });
    await select.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('combobox', { name: 'Change status for IF-' + id })).toHaveValue('in_progress');
    await expect(page.getByRole('combobox', { name: 'Change status for IF-' + id })).toBeEnabled();
  } finally {
    for (const id of ids) await page.request.delete('/api/issues/' + id);
  }
});
