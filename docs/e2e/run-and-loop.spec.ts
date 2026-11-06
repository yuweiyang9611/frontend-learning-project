// Run in the browser and the loop band: a fence runs in the sandbox and prints its output, a block that
// cannot run keeps the plain rendering, the band reads the records step by step, the index continues at
// the earliest 停在这里, and nothing scrolls sideways at 390px.
import { expect, test, type Page } from '@playwright/test';

const visitsKey = 'issueflow:frontend-learning-project:visits:v1';
const progressKey = 'issueflow:frontend-learning-project:progress:v1';
const reviewKey = 'issueflow:frontend-learning-project:review:v1';
const lesson = 'typescript/01-from-csharp-to-typescript.html';

async function hydrated(page: Page) {
  await page.waitForFunction(() => Boolean((document.querySelector('#app') as { __vue_app__?: unknown } | null)?.__vue_app__));
}

const sideways = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
const states = (page: Page) => page.locator('.fe-steps li').evaluateAll((items) => items.map((item) => `${item.dataset.step}:${item.dataset.state}`));

function progressRecord(completedDays: number) {
  return {
    app: 'issueflow-learning-progress',
    schemaVersion: 1,
    exportedAt: '2026-10-30T00:00:00.000Z',
    days: Array.from({ length: 91 }, (_, index) => {
      const day = index + 1;
      const done = day <= completedDays;
      return {
        day,
        completed: done,
        completedAt: done ? `2026-10-${String(day + 10).padStart(2, '0')}T08:00:00.000Z` : null,
        minutes: done ? 120 : 0,
        note: done ? '先预测请求路径，再用 Network 面板核对状态码和响应，记录了下一步。' : '',
        evidence: done ? [{ label: `Day ${String(day).padStart(2, '0')} 验收证据`, url: `/learning-evidence/day-${String(day).padStart(2, '0')}/report.json` }] : [],
      };
    }),
  };
}

test.describe.configure({ mode: 'serial' });

test('一个代码块在浏览器里运行并打印结果，改一改再跑后输出改动的副本', async ({ page }) => {
  test.setTimeout(120_000);
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(error.message));
  await page.goto('90-days/week-04-javascript-dom-async.html');
  await hydrated(page);

  const panels = page.locator('main .fe-code');
  await expect(panels).toHaveCount(3);
  const panel = panels.first();
  await expect(panel).toHaveAttribute('id', 'fe-code-1');
  await expect(panel.locator('.nb-code-tab')).toHaveText('JavaScript');
  await expect(panel.locator('.nb-code-line').first()).toHaveAttribute('data-line', '1');
  expect(await panel.locator('.tok-keyword').count()).toBeGreaterThan(0);
  expect(await panel.locator('.nb-code-line').first().evaluate((line) => line.children.length)).toBe(1);
  await expect(panel.locator('.nb-code-output')).toHaveCount(0);
  // A block the rule keeps out stays VitePress's own code block.
  expect(await page.locator('main div[class*="language-"]').count()).toBeGreaterThan(0);

  // The first 运行 loads the transpiler (the stage word shows), then prints the block's own output.
  await panel.locator('.fe-code-run').click();
  await expect(panel.locator('.nb-code-output')).toHaveAttribute('data-state', 'running');
  await expect(panel.locator('.nb-code-output')).toHaveAttribute('data-state', 'done', { timeout: 90_000 });
  await expect(panel.locator('.nb-code-output-label')).toHaveText('运行结果 · 浏览器内 JavaScript');
  await expect(panel.locator('.nb-code-output pre')).toHaveText('{rawPage: "02", page: 2, isInteger: true}\ntrue false false');
  await expect(panel.locator('.nb-code-status')).toHaveText('运行完成。');
  expect(await panel.locator('iframe').count()).toBe(0);

  // The band saw the run: read and code and run are done.
  expect(await states(page)).toEqual(['read:done', 'code:done', 'run:done', 'quiz:now', 'note:pending']);
  const visits = JSON.parse(await page.evaluate((key) => localStorage.getItem(key) ?? 'null', visitsKey));
  expect(Object.keys(visits.pages['90-days/week-04-javascript-dom-async']).sort()).toEqual(['codeAt', 'ranAt', 'readAt']);

  // 改一改再跑: the draft is a copy; the output says so; the original lines come back on 恢复原文.
  await panel.locator('.fe-code-edit').click();
  const editor = panel.locator('.nb-code-editor');
  await expect(editor).toBeVisible();
  await editor.fill('const items = ["a", "b"];\nconsole.log(items.length, { ok: true }, [1, "2"]);\nconsole.warn("careful");\nthrow new Error("boom");\n');
  await panel.locator('.fe-code-run').click();
  await expect(panel.locator('.nb-code-output')).toHaveAttribute('data-state', 'wrong', { timeout: 30_000 });
  await expect(panel.locator('.nb-code-output-label')).toHaveText('运行失败');
  await expect(panel.locator('.nb-code-output pre')).toContainText('2 {ok: true} [1, "2"]');
  await expect(panel.locator('.nb-code-output pre')).toContainText('[warn] careful');
  await expect(panel.locator('.nb-code-output pre')).toContainText('运行异常：Error: boom');

  await editor.fill('let n = 0;\nsetTimeout(() => console.log("later", n), 200);\nn = 1;\nconsole.log("first");\n');
  await panel.locator('.fe-code-run').click();
  await expect(panel.locator('.nb-code-output')).toHaveAttribute('data-state', 'done', { timeout: 30_000 });
  await expect(panel.locator('.nb-code-output-label')).toHaveText('运行结果 · 浏览器内 JavaScript · 已改动的副本');
  await expect(panel.locator('.nb-code-output pre')).toHaveText('first\nlater 1');

  // A transpile error names the line; a busy loop hits the 5 second wall clock and says 运行超时.
  await editor.fill('const = 1;\n');
  await panel.locator('.fe-code-run').click();
  await expect(panel.locator('.nb-code-output')).toHaveAttribute('data-state', 'wrong', { timeout: 30_000 });
  await expect(panel.locator('.nb-code-output-label')).toHaveText('转译失败');
  await expect(panel.locator('.nb-code-output pre')).toContainText('(1,6)');

  await editor.fill('console.log("spinning");\nfor (;;) {}\n');
  await panel.locator('.fe-code-run').click();
  await expect(panel.locator('.nb-code-output')).toHaveAttribute('data-state', 'wrong', { timeout: 30_000 });
  await expect(panel.locator('.nb-code-output-label')).toHaveText('运行超时');
  await expect(panel.locator('.nb-code-output pre')).toContainText('执行超时（5 秒），已停止。');
  expect(await panel.locator('iframe').count()).toBe(0);
  // The page itself stayed responsive while the loop spun.
  await expect(panel.locator('.fe-code-run')).toBeEnabled();

  await panel.locator('.fe-code-reset').click();
  await expect(panel.locator('.nb-code-editor')).toHaveCount(0);
  await expect(panel.locator('.nb-code-line').first()).toContainText('const rawPage');
  expect(problems).toEqual([]);
});

test('每一课顶部的五步带子按记录标注完成和停在这里，没有的步骤画成虚线', async ({ page }) => {
  await page.goto('learning/00-getting-started.html');
  await hydrated(page);
  // Opening the page is the 读 step; this lesson has no code, no quiz and no notes.
  await expect(page.locator('.fe-steps li')).toHaveCount(5);
  await expect(page.locator('.fe-steps li[data-state="now"]')).toHaveCount(0);
  expect(await states(page)).toEqual(['read:done', 'code:none', 'run:none', 'quiz:none', 'note:none']);
  await expect(page.locator('.fe-steps li[data-step="code"] a')).toHaveCount(0);
  await expect(page.locator('.fe-steps li').first().locator('a')).toHaveAttribute('href', '#main');

  // A page with runnable fences: after reading, 看代码 is 停在这里; a click on the tab finishes it.
  await page.goto(lesson);
  await hydrated(page);
  await expect(page.locator('main .fe-code')).toHaveCount(7);
  await expect(page.locator('main .fe-code').first().locator('.nb-code-tab')).toHaveText('TypeScript');
  expect(await states(page)).toEqual(['read:done', 'code:now', 'run:pending', 'quiz:none', 'note:none']);
  await expect(page.locator('.fe-steps li[data-step="code"] a')).toHaveAttribute('href', '#fe-code-1');
  await page.locator('main .fe-code').first().locator('.nb-code-tab').click();
  expect(await states(page)).toEqual(['read:done', 'code:done', 'run:now', 'quiz:none', 'note:none']);

  // A week page carries its band on the fill and the quiz count from the review record.
  await page.goto('90-days/week-05-typescript-foundations.html');
  await hydrated(page);
  const band = page.locator('.fe-band');
  await expect(band.locator('.fe-steps')).toHaveClass(/nb-steps--on-fill/);
  expect(await states(page)).toEqual(['read:done', 'code:now', 'run:pending', 'quiz:pending', 'note:pending']);
  await expect(page.locator('.fe-steps li[data-step="quiz"] .nb-steps-count')).toHaveText('0 / 12');
  await expect(page.locator('.fe-steps li[data-step="quiz"] a')).toHaveAttribute('href', '#weekly-check-5');
  await expect(page.locator('.fe-steps li[data-step="note"] a')).toHaveAttribute('href', /progress-and-journal\.html$/);

  // The server render shows every step pending and never 停在这里.
  const served = await page.evaluate(async () => (await (await fetch(location.href)).text()).match(/<ol class="nb-steps[\s\S]*?<\/ol>/)?.[0] ?? '');
  expect(served).not.toContain('data-state="now"');
  expect(served).not.toContain('data-state="done"');
  expect((served.match(/data-state="pending"/g) ?? []).length).toBe(5);
});

test('首页接着做指向最早停在这里的一课，周卡片同步标出停在这里', async ({ page }) => {
  await page.goto('./');
  await hydrated(page);
  await expect(page.locator('.fe-continue')).toHaveText('第 1 周 · 环境、Git、浏览器、HTTP 与项目地图 · 读');
  await expect(page.locator('.fe-continue')).toHaveAttribute('href', /week-01-foundations\.html$/);
  await expect(page.locator('.fe-resume-go')).toHaveText('开始第 1 周');
  await expect(page.locator('.fe-week[aria-current]')).toHaveCount(0);

  await page.addInitScript(
    ({ progress, review, progressValue, reviewValue }) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem(progress, progressValue);
        localStorage.setItem(review, reviewValue);
      }
      sessionStorage.setItem('seeded', '1');
    },
    {
      progress: progressKey,
      review: reviewKey,
      progressValue: JSON.stringify(progressRecord(8)),
      reviewValue: JSON.stringify({
        app: 'issueflow-learning-review',
        schemaVersion: 1,
        records: Object.fromEntries(
          Array.from({ length: 12 }, (_, index) => [`w01-q${String(index + 1).padStart(2, '0')}`, { stage: 0, lastCorrect: true, lastAnsweredAt: '2026-10-20T00:00:00.000Z', dueAt: '2026-10-21T00:00:00.000Z', attempts: 1 }]),
        ),
      }),
    },
  );
  await page.goto('./');
  await hydrated(page);
  // Week 1 is read, quizzed and noted; week 2 has day 8 read and a note, so its quiz is where to continue.
  await expect(page.locator('.fe-continue')).toHaveText('第 2 周 · 语义 HTML、表单与可访问性 · 自测');
  await expect(page.locator('.fe-continue')).toHaveAttribute('href', /week-02-html-accessibility\.html#weekly-check-2$/);
  await expect(page.locator('.fe-resume-go')).toHaveText('继续学习');
  await expect(page.locator('.fe-record-line')).toContainText('8 / 91 天');
  await expect(page.locator('.fe-next-day')).toHaveText('下一天：第 9 天');
  const stopped = page.locator('.fe-week[aria-current="step"]');
  await expect(stopped).toHaveCount(1);
  await expect(stopped).toContainText('第 2 周');
  await expect(page.locator('.fe-stats .nb-stat').nth(1)).toContainText('第 2 周');
});

test('390px 下带子换行、面板在自己的框里滚动，页面不横向滚动', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('90-days/week-05-typescript-foundations.html');
  await hydrated(page);
  await expect(page.locator('.fe-steps li')).toHaveCount(5);
  const rows = await page.locator('.fe-steps li').evaluateAll((items) => new Set(items.map((item) => Math.round(item.getBoundingClientRect().top))).size);
  expect(rows).toBeGreaterThan(1);
  expect(await sideways(page)).toBe(false);
  const view = page.locator('main .fe-code .nb-code-view').first();
  await expect(view).toBeVisible();
  expect(await sideways(page)).toBe(false);

  await page.goto('typescript/07-pattern-cookbook.html');
  await hydrated(page);
  await expect(page.locator('main .fe-code').first()).toBeVisible();
  expect(await sideways(page)).toBe(false);
});
