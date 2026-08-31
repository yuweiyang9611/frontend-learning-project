import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const reviewUrl = '90-days/review-center.html';
const reviewStorageKey = 'issueflow:frontend-learning-project:review:v1';
const reviewQuestion = '页面显示了数据，最先用什么证据确认数据来自哪种模式？';

async function seedDueReview(page: Page) {
  await page.addInitScript(
    ({ key }) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          app: 'issueflow-learning-review',
          schemaVersion: 1,
          records: {
            'w01-q01': {
              stage: 0,
              lastCorrect: false,
              lastAnsweredAt: '2026-01-01T00:00:00.000Z',
              dueAt: '2026-01-01T00:00:00.000Z',
              attempts: 1,
            },
          },
        }),
      );
    },
    { key: reviewStorageKey },
  );
}

async function expectNoBlockingAxeViolations(page: Page, selector = '.review-center') {
  const results = await new AxeBuilder({ page })
    .include(selector)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const blocking = results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical');
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
}

test('复习答案使用带题目名称的原生单选组', async ({ page }) => {
  await seedDueReview(page);
  await page.goto(reviewUrl);

  const answerGroup = page.getByRole('group', { name: reviewQuestion });
  await expect(answerGroup).toBeVisible();
  await expect(answerGroup.getByRole('radio')).toHaveCount(3);

  const firstAnswer = answerGroup.getByRole('radio', { name: '看页面配色' });
  const secondAnswer = answerGroup.getByRole('radio', {
    name: '检查环境配置与 Network 请求',
  });
  await firstAnswer.focus();
  await page.keyboard.press('ArrowDown');
  await expect(secondAnswer).toBeChecked();
  await page.keyboard.press('ArrowUp');
  await expect(firstAnswer).toBeChecked();
  await page.getByRole('button', { name: '提交复习答案' }).click();
  await expect(page.getByText('仍需订正；请读解释后重新作答。')).toBeVisible();
  await expectNoBlockingAxeViolations(page);
});

test('周测错题写入复习队列并可在复习中心继续作答', async ({ page }) => {
  await page.goto('90-days/week-01-foundations.html');

  const quiz = page.locator('.knowledge-check');
  await quiz.getByRole('radio', { name: '看页面配色' }).check();
  await quiz.getByRole('radio', { name: 'Promise fulfilled，但 response.ok 为 false' }).check();
  await quiz.getByRole('radio', { name: '能说明一个假设和一个结果的小提交' }).check();
  await quiz.getByRole('button', { name: '提交本周测验' }).click();
  await expect(quiz.getByText('本周得分 2 / 3；错题已进入复习中心。')).toBeVisible();
  await expectNoBlockingAxeViolations(page, '.knowledge-check');

  await page.goto(reviewUrl);
  await expect(page.getByRole('group', { name: reviewQuestion })).toBeVisible();
});

test('深色主题的复习控件通过严重级别无障碍检查', async ({ page }) => {
  await seedDueReview(page);
  await page.addInitScript(() => {
    localStorage.setItem('vitepress-theme-appearance', 'dark');
  });
  await page.goto(reviewUrl);

  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByRole('group', { name: reviewQuestion })).toBeVisible();
  await expectNoBlockingAxeViolations(page);
});

test('360px 窄屏不产生横向溢出且复习操作仍可见', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await seedDueReview(page);
  await page.goto(reviewUrl);

  await expect(page.getByRole('button', { name: '导出复习 JSON' })).toBeVisible();
  await expect(page.getByRole('button', { name: '清空本机复习' })).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(hasHorizontalOverflow).toBe(false);
  await expectNoBlockingAxeViolations(page);
});
