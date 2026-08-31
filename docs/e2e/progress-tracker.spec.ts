import { expect, test } from '@playwright/test';

test('进度文件导入控件通过键盘获得可见焦点', async ({ page }) => {
  await page.goto('90-days/progress-and-journal.html');

  const exportButton = page.getByRole('button', { name: '导出 JSON' });
  const fileInput = page.locator('.learning-progress__file input[type="file"]');
  const fileLabel = page.locator('.learning-progress__file');

  await exportButton.focus();
  await page.keyboard.press('Tab');
  await expect(fileInput).toBeFocused();
  await expect(fileLabel).toHaveCSS('outline-style', 'solid');
  await expect(fileLabel).toHaveCSS('outline-width', '3px');
});

test('导入会隔离坏记录、合并有效 Day 并在刷新后保留', async ({ page }) => {
  await page.goto('90-days/progress-and-journal.html');

  const payload = {
    app: 'issueflow-learning-progress',
    schemaVersion: 1,
    exportedAt: '2026-09-01T00:00:00.000Z',
    days: [
      {
        day: 2,
        completed: true,
        completedAt: '2026-09-01T00:00:00.000Z',
        minutes: 120,
        note: '我完成了独立变体、记录了测试输出，并说明了下一步风险。',
        evidence: [{ label: 'Day 02 验收证据', url: '/learning-evidence/day-02/report.json' }],
      },
      { day: 92, completed: false, completedAt: null },
    ],
  };

  await page.locator('.learning-progress__file input[type="file"]').setInputFiles({
    name: 'progress.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(payload)),
  });
  await expect(page.getByRole('status').filter({ hasText: '已隔离或修复 1 条异常记录' })).toBeVisible();
  await page.getByRole('button', { name: '确认导入' }).click();
  await expect(page.getByRole('status').filter({ hasText: '进度已安全合并' })).toBeVisible();
  await expect(page.getByText('1 / 91', { exact: true })).toBeVisible();

  const dayTwo = page.locator('.learning-progress__day').filter({ hasText: 'Day 02' }).first();
  await expect(dayTwo.getByRole('checkbox')).toBeChecked();
  await expect(dayTwo.getByLabel('主动学习分钟')).toHaveValue('120');

  await page.reload();
  await expect(dayTwo.getByRole('checkbox')).toBeChecked();
  await expect(dayTwo.getByLabel('主动学习分钟')).toHaveValue('120');
});

test('完成门槛和编辑撤销状态在刷新后保持一致', async ({ page }) => {
  await page.goto('90-days/progress-and-journal.html');

  const dayOne = page.locator('.learning-progress__day').filter({ hasText: 'Day 01' }).first();
  const completed = dayOne.getByRole('checkbox');

  await completed.click();
  await expect(completed).not.toBeChecked();
  await expect(page.getByRole('status').filter({ hasText: 'Day 01 不能完成' })).toBeVisible();

  await dayOne.getByLabel('主动学习分钟').fill('120');
  const evidence = dayOne.getByLabel('HTTPS 或相对证据链接');
  await evidence.fill('/learning-evidence/day-01/report.json');
  await evidence.press('Tab');
  await dayOne
    .getByLabel('当日复盘（最多 500 字）')
    .fill('我用浏览器网络面板验证了请求路径、响应状态和数据来源，并记录下一步。');
  await completed.click();
  await expect(completed).toBeChecked();
  await expect(page.getByText('1 / 91', { exact: true })).toBeVisible();

  await page.reload();
  await expect(completed).toBeChecked();

  await dayOne.getByLabel('主动学习分钟').fill('115');
  await expect(completed).not.toBeChecked();
  await expect(page.getByRole('status').filter({ hasText: '完成状态已自动撤销' })).toBeVisible();

  await page.reload();
  await expect(completed).not.toBeChecked();
  await expect(dayOne.getByLabel('主动学习分钟')).toHaveValue('115');
});
