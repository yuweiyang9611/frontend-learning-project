import { expect, test, type Page } from '@playwright/test';

const progressKey = 'issueflow:frontend-learning-project:progress:v1';

function progressRecord(completedDays: number, startedDay?: number) {
  return {
    app: 'issueflow-learning-progress',
    schemaVersion: 1,
    exportedAt: '2026-10-30T00:00:00.000Z',
    days: Array.from({ length: 91 }, (_, index) => {
      const day = index + 1;
      const done = day <= completedDays;
      const started = done || day === startedDay;
      return {
        day,
        completed: done,
        completedAt: done ? `2026-10-${String(day + 10).padStart(2, '0')}T08:00:00.000Z` : null,
        minutes: done ? 120 : started ? 45 : 0,
        note: started ? '先预测请求路径，再用 Network 面板核对状态码和响应，记录了下一步。' : '',
        evidence: done ? [{ label: `Day ${String(day).padStart(2, '0')} 验收证据`, url: `/learning-evidence/day-${String(day).padStart(2, '0')}/report.json` }] : [],
      };
    }),
  };
}

/** Counts text nodes replaced by the kit's runtime squeeze, and collects console problems. */
async function watchPage(page: Page) {
  await page.addInitScript(() => {
    const original = CharacterData.prototype.replaceWith;
    (window as unknown as { __replaced: number }).__replaced = 0;
    CharacterData.prototype.replaceWith = function (...nodes) {
      (window as unknown as { __replaced: number }).__replaced += 1;
      return original.apply(this, nodes);
    };
  });
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(error.message));
  return problems;
}

async function hydrated(page: Page) {
  await page.waitForFunction(() => Boolean((document.querySelector('#app') as { __vue_app__?: unknown } | null)?.__vue_app__));
}

async function openPairs(page: Page) {
  return page.evaluate(() => {
    const loose = /[”’][，。、；：？！]|[，。、；：？！][“‘]/;
    const walker = document.createTreeWalker(document.querySelector('main') ?? document.body, NodeFilter.SHOW_TEXT);
    let open = 0;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (loose.test(node.data) && !node.parentElement?.closest('code, pre, textarea')) open += 1;
    }
    return open;
  });
}

test('没有学习记录时首页从第 1 天开始，不画停止标记', async ({ page }) => {
  await page.goto('./');
  await hydrated(page);

  const continueLink = page.locator('.fe-continue');
  await expect(continueLink).toHaveText(/^第 1 天 · /);
  await expect(continueLink).toHaveAttribute('href', /week-01-foundations\.html#day-01$/);
  await expect(page.locator('.fe-resume .nb-banner-eyebrow')).toHaveText('接着做');
  await expect(page.locator('.fe-record-line')).toContainText('还没有学习记录');
  await expect(page.locator('.fe-resume-go')).toHaveText('开始第 1 天');
  await expect(page.locator('.fe-stats .nb-stat').first()).toContainText('0');
  await expect(page.locator('.fe-week')).toHaveCount(13);
  await expect(page.locator('.fe-week .nb-ring')).toHaveCount(13);
  await expect(page.locator('.fe-week .nb-ring[aria-label="完成 0%"]')).toHaveCount(13);
  await expect(page.locator('.fe-week[aria-current]')).toHaveCount(0);
  await expect(page.locator('.fe-week[data-record="done"]')).toHaveCount(0);
  await expect(page.locator('main .nb-stopped')).toHaveCount(0);
  await expect(page.getByRole('progressbar', { name: '91 天课程进度' })).toHaveAttribute('aria-valuenow', '0');
  await expect(page.getByRole('heading', { name: '第 1 天的验收命令' })).toBeVisible();
});

test('首页按本机记录接着做下一天，并保持记录原样', async ({ page }) => {
  const stored = JSON.stringify(progressRecord(8, 9));
  await page.addInitScript(
    ({ key, value }) => {
      if (!sessionStorage.getItem('seeded')) localStorage.setItem(key, value);
      sessionStorage.setItem('seeded', '1');
    },
    { key: progressKey, value: stored },
  );
  await page.goto('./');
  await hydrated(page);

  const continueLink = page.locator('.fe-continue');
  await expect(continueLink).toHaveText(/^第 9 天 · /);
  await expect(page.locator('.fe-resume .nb-banner-eyebrow')).toHaveText('接着做');
  await expect(page.locator('.fe-resume-go')).toHaveText('继续学习');
  await expect(page.locator('.fe-stats .nb-stat').nth(1)).toContainText('第 2 周');
  await expect(continueLink).toHaveAttribute('href', /week-02-html-accessibility\.html#day-09$/);
  await expect(page.locator('.fe-record-line')).toContainText('8 / 91 天');
  await expect(page.locator('.fe-week').first()).toHaveAttribute('data-record', 'done');
  const stopped = page.locator('.fe-week[aria-current="step"]');
  await expect(stopped).toHaveCount(1);
  await expect(stopped).toContainText('第 2 周');
  await expect(stopped.locator('.nb-stopped')).toHaveText('停在这里');
  await expect(stopped.locator('.nb-ring')).toHaveAttribute('aria-label', '完成 14%');
  await expect(page.locator('.fe-week').first().locator('.nb-ring')).toHaveAttribute('aria-label', '完成 100%');
  await expect(page.locator('main .nb-stopped')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: '第 9 天的验收命令' })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), progressKey)).toBe(stored);

  // A week page opens with its band: the phase's hue, the week and the days done from the same record.
  await page.goto('90-days/week-02-html-accessibility.html');
  await hydrated(page);
  const band = page.locator('.fe-band');
  await expect(band).toHaveAttribute('data-hue', 'green');
  await expect(band.locator('.fe-band-eyebrow')).toHaveText('第 2 周 · Web 基础');
  await expect(band.getByRole('progressbar', { name: '第 2 周进度' })).toHaveAttribute('aria-valuenow', '1');
  await expect(band).toContainText('1 / 7 天');
  await page.goto('90-days/how-to-study.html');
  await hydrated(page);
  await expect(page.locator('.fe-band')).toHaveCount(0);
});

test('白天和晚上写入 site-theme，并让 VitePress 的 dark 类同步', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) localStorage.setItem('site-theme', 'dark');
    sessionStorage.setItem('seeded', '1');
  });
  await page.goto('90-days/review-center.html');
  await hydrated(page);
  const root = page.locator('html');
  await expect(root).toHaveAttribute('data-theme', 'dark');
  await expect(root).toHaveClass(/\bdark\b/);
  await expect(page.getByRole('button', { name: '晚上' })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: '白天' }).click();
  await expect(root).toHaveAttribute('data-theme', 'light');
  await expect(root).not.toHaveClass(/\bdark\b/);
  await expect(page.getByRole('button', { name: '白天' })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => localStorage.getItem('site-theme'))).toBe('light');

  await page.reload();
  await hydrated(page);
  await expect(root).toHaveAttribute('data-theme', 'light');
  await expect(root).not.toHaveClass(/\bdark\b/);

  // The other direction: anything that sets VitePress's class moves the kit's tokens with it.
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await expect(root).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => localStorage.getItem('site-theme'))).toBe('light');
});

test('服务端已排好相邻标点，水合不报不匹配，运行时不再替换文本', async ({ page }) => {
  const problems = await watchPage(page);
  await page.goto('90-days/how-to-study.html');
  await hydrated(page);
  await page.waitForTimeout(300);

  const served = await page.evaluate(async () => {
    const html = await (await fetch(location.href)).text();
    return (html.split('<div id="app">')[1] ?? '').split('class="nb-halt"').length - 1;
  });
  expect(served).toBeGreaterThan(0);
  await expect(page.locator('main .nb-halt')).toHaveCount(served);
  expect(await page.evaluate(() => (window as unknown as { __replaced: number }).__replaced)).toBe(0);
  expect(await openPairs(page)).toBe(0);

  for (const path of ['./', '90-days/week-01-foundations.html', '90-days/progress-and-journal.html', '90-days/review-center.html']) {
    await page.goto(path);
    await hydrated(page);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => (window as unknown as { __replaced: number }).__replaced), path).toBe(0);
    expect(await openPairs(page), path).toBe(0);
  }
  expect(problems.filter((text) => /hydrat|mismatch/i.test(text))).toEqual([]);
});

test('站内跳转后没有残留内容，组件文字也不需要运行时替换', async ({ page }) => {
  const problems = await watchPage(page);
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) localStorage.setItem('site-theme', 'dark');
    sessionStorage.setItem('seeded', '1');
  });
  await page.goto('90-days/how-to-study.html');
  await hydrated(page);
  // Marks this document, so a full reload instead of client-side navigation would be caught.
  await page.evaluate(() => ((window as unknown as { __sameDocument: boolean }).__sameDocument = true));

  await page.locator('.fe-contents').getByRole('link', { name: '第 1 周 · 环境与 Web 地图' }).click();
  await expect(page).toHaveURL(/week-01-foundations\.html$/);
  await expect(page.locator('main h1')).toHaveCount(1);
  await expect(page.locator('main h1')).toHaveText(/第 1 周/);
  await expect(page.locator('.knowledge-check')).toBeVisible();
  await expect(page.locator('main')).not.toContainText('什么时候可以进入下一天');

  await page.locator('#site-nav').getByRole('link', { name: '复习' }).click();
  await expect(page).toHaveURL(/review-center\.html$/);
  await expect(page.locator('main h1')).toHaveCount(1);
  await expect(page.locator('.review-center')).toHaveCount(1);
  await expect(page.locator('.knowledge-check')).toHaveCount(0);

  await page.locator('.nb-brand').click();
  await expect(page.locator('.fe-continue')).toBeVisible();
  await expect(page.locator('main h1')).toHaveCount(1);
  await expect(page.locator('.review-center')).toHaveCount(0);

  expect(await page.evaluate(() => (window as unknown as { __sameDocument?: boolean }).__sameDocument)).toBe(true);
  expect(await page.evaluate(() => (window as unknown as { __replaced: number }).__replaced)).toBe(0);
  expect(await openPairs(page)).toBe(0);
  // VitePress's head manager leaves the kit's tags alone: one theme.js, one theme colour, still night.
  const head = await page.evaluate(() => ({
    themeScripts: document.querySelectorAll('script[src$="kit/theme.js"]').length,
    themeColors: [...document.querySelectorAll('meta[name="theme-color"]')].map((meta) => meta.getAttribute('content')),
    theme: document.documentElement.dataset.theme,
    dark: document.documentElement.classList.contains('dark'),
  }));
  expect(head).toEqual({ themeScripts: 1, themeColors: ['#1c1a17'], theme: 'dark', dark: true });
  expect(problems).toEqual([]);
});

test('窄屏页头保留配色词，菜单和目录可以展开', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('90-days/week-01-foundations.html');
  await hydrated(page);

  await expect(page.getByRole('button', { name: '白天' })).toBeVisible();
  const menu = page.getByRole('button', { name: '菜单' });
  await expect(page.locator('#site-nav')).toBeHidden();
  await menu.click();
  await expect(page.locator('#site-nav').getByRole('link', { name: '进度' })).toBeVisible();

  await page.getByRole('button', { name: '展开目录' }).click();
  await expect(page.locator('#fe-contents-list').getByRole('link', { name: /Day 01/ })).toBeVisible();
  const sideways = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(sideways).toBe(false);
});
