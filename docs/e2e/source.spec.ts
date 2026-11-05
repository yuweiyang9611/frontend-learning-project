// Source read in place: the panel on a lesson, the source page, the rewritten links, and no sideways
// scroll on a phone.
import { expect, test, type Page } from '@playwright/test';

async function hydrated(page: Page) {
  await page.waitForFunction(() => Boolean((document.querySelector('#app') as { __vue_app__?: unknown } | null)?.__vue_app__));
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

const sideways = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test('源码追踪页把每条路线的文件放进面板，带行号和着色，不再跳 GitHub', async ({ page }) => {
  const problems = await watchPage(page);
  await page.goto('reference/source-traces.html');
  await hydrated(page);

  const panels = page.locator('main .nb-code');
  await expect(panels).toHaveCount(10);
  const first = panels.first();
  await expect(first.locator('.nb-code-tab')).toHaveCount(6);
  await expect(first.locator('.nb-code-tab').first()).toHaveAttribute('aria-selected', 'true');
  await expect(first.locator('.nb-code-tab').first()).toHaveText('app/layout.tsx');
  const lines = first.locator('.nb-code-line');
  await expect(lines.first()).toHaveAttribute('data-line', '1');
  expect(await lines.count()).toBeGreaterThan(5);
  await expect(first.locator('.nb-code-note')).toHaveText(/^\d+ 行$/);
  expect(await first.locator('.tok-keyword').count()).toBeGreaterThan(0);
  // One span per line beside the number: the kit lays the line out as a two-column grid.
  expect(await first.locator('.nb-code-line').first().evaluate((line) => line.children.length)).toBe(1);
  await expect(first.locator('.nb-code-link')).toHaveAttribute('href', /github\.com\/yuweiyang9611\/frontend-learning-project\/blob\/main\/frontend\/app\/layout\.tsx$/);

  await first.locator('.nb-code-tab', { hasText: 'AppProviders.tsx' }).click();
  await expect(first.locator('.nb-code-tab[aria-selected="true"]')).toHaveText('AppProviders.tsx');
  await expect(first.locator('.nb-code-link')).toHaveAttribute('href', /AppProviders\.tsx$/);
  await expect.poll(() => first.locator('.nb-code-line').count()).toBeGreaterThan(50);
  expect(await first.locator('.tok-string').count()).toBeGreaterThan(0);

  // The prose links go to the source page; only the panel's own action still names GitHub.
  const sourceLinks = page.locator('main .fe-prose a[href*="reference/source.html?path="]');
  expect(await sourceLinks.count()).toBeGreaterThan(30);
  await expect(page.locator('main .fe-prose a[href*="github.com/"][href*="/blob/"]:not(.nb-code-link)')).toHaveCount(0);

  await page.waitForTimeout(300);
  expect(await page.evaluate(() => (window as unknown as { __replaced: number }).__replaced)).toBe(0);
  expect(problems).toEqual([]);
});

test('专题页的源码链接进站，点开后在源码页看到同一个文件', async ({ page }) => {
  await page.goto('learning/06-react-components-and-state.html');
  await hydrated(page);
  await expect(page.locator('main .fe-prose a[href*="github.com/"][href*="/blob/"]')).toHaveCount(0);
  const link = page.locator('main .fe-prose a[href*="reference/source.html?path="]').first();
  const target = await link.getAttribute('href');
  await link.click();
  await expect(page).toHaveURL(/reference\/source\.html\?path=/);
  const path = decodeURIComponent(new URL(target ?? '', 'http://x').searchParams.get('path') ?? '');
  await expect(page.locator('.fe-source-title')).toHaveText(path.split('/').pop() ?? '');
  await expect(page.locator('.fe-source .nb-code-line').first()).toHaveAttribute('data-line', '1');
  await expect(page.locator('.fe-source .nb-code-tab')).toHaveAttribute('data-path', path);
});

test('源码页按 ?path= 显示文件并标出行号范围，按 ?dir= 列目录', async ({ page }) => {
  const problems = await watchPage(page);
  await page.goto('reference/source.html?path=frontend/src/api/issueflowApi.ts#L5-L9');
  await hydrated(page);
  await expect(page.locator('.fe-source-title')).toHaveText('issueflowApi.ts');
  await expect(page.locator('.fe-source-crumbs')).toContainText('源码 / frontend / src / api / issueflowApi.ts');
  await expect(page.locator('.fe-source-note').first()).toContainText(/frontend\/src\/api\/issueflowApi\.ts · \d+ 行 · [\d.]+ KB · 仓库提交 [0-9a-f]{7}/);
  const marked = page.locator('.fe-source .nb-code-line[data-marked]');
  await expect(marked).toHaveCount(5);
  await expect(marked.first()).toHaveAttribute('id', 'L5');
  await expect(marked.first()).toBeInViewport();
  await expect(page.locator('.fe-source-siblings li')).toHaveCount(2);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');

  await page.locator('.fe-source-crumbs a', { hasText: 'src' }).click();
  await expect(page).toHaveURL(/reference\/source\.html\?dir=frontend\/src$/);
  await expect(page.locator('.fe-source-title')).toHaveText('src/');
  const rows = page.locator('.fe-source-row');
  expect(await rows.count()).toBeGreaterThanOrEqual(5);
  await expect(rows.first().locator('a')).toHaveText(/\/$/);
  await expect(rows.first().locator('span')).toHaveText(/^\d+ 个文件 · \d+ 行$/);
  await rows.locator('a', { hasText: 'api/' }).click();
  await expect(page).toHaveURL(/\?dir=frontend\/src\/api$/);
  await expect(page.locator('.fe-source-row a', { hasText: 'issueflowApi.ts' })).toBeVisible();
  await expect(page.locator('.fe-source-row span').first()).toHaveText(/^\d+ 行 · [\d.]+ KB$/);
  await page.locator('.fe-source-row a', { hasText: 'issueflowApi.ts' }).click();
  await expect(page).toHaveURL(/\?path=frontend\/src\/api\/issueflowApi\.ts$/);
  await expect(page.locator('.fe-source .nb-code-line').first()).toHaveAttribute('data-line', '1');
  await expect(page.locator('.fe-source .nb-code-line[data-marked]')).toHaveCount(0);

  await page.goBack();
  await expect(page).toHaveURL(/\?dir=frontend\/src\/api$/);
  await expect(page.locator('.fe-source-row a', { hasText: 'issueflowApi.ts' })).toBeVisible();

  await page.goto('reference/source.html?path=nowhere/missing.ts');
  await hydrated(page);
  await expect(page.locator('.fe-source-title')).toHaveText('没有这个文件');
  await expect(page.locator('.fe-source-row').first()).toBeVisible();

  await page.goto('reference/source.html');
  await hydrated(page);
  await expect(page.locator('.fe-source-row a', { hasText: 'frontend/' })).toBeVisible();
  await expect(page.locator('.fe-source-row a', { hasText: 'backend/' })).toBeVisible();

  expect(await page.evaluate(() => (window as unknown as { __replaced: number }).__replaced)).toBe(0);
  expect(problems).toEqual([]);
});

test('390px 下代码在面板里横向滚动，页面本身不横向滚动', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('reference/source-traces.html');
  await hydrated(page);
  await expect(page.locator('main .nb-code .nb-code-line').first()).toBeVisible();
  expect(await sideways(page)).toBe(false);
  const view = page.locator('main .nb-code-view').first();
  expect(await view.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);

  await page.goto('reference/source.html?path=backend/IssueFlow.Api/Features/Issues/IssueEndpoints.cs');
  await hydrated(page);
  await expect(page.locator('.fe-source .nb-code-line').first()).toBeVisible();
  expect(await page.locator('.fe-source .tok-keyword').count()).toBeGreaterThan(0);
  expect(await sideways(page)).toBe(false);

  await page.goto('reference/source.html?dir=backend/IssueFlow.Api/Features');
  await hydrated(page);
  await expect(page.locator('.fe-source-row').first()).toBeVisible();
  expect(await sideways(page)).toBe(false);
});
