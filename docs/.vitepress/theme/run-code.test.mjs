// Run in the browser: which fences run, how the markdown rule renders them, and the sandbox document.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createMarkdownRenderer } from 'vitepress';
import { notebookMarkdown } from './notebook-text.mjs';
import { OUTPUT_LIMIT, STAGES, sandboxDocument } from './run-code-browser.mjs';
import { dryRunReason, fenceInfo, fenceRun, markdownFences, runnableFences, staticReason } from './run-code.mjs';

test('a fence runs when it is plain TypeScript or JavaScript that a transpile-only run can honour', () => {
  assert.deepEqual(fenceInfo('ts run'), { language: 'ts', words: ['run'] });
  assert.deepEqual(fenceInfo('ts{1,3} no-run'), { language: 'ts', words: ['no-run'] });
  assert.deepEqual(fenceInfo('tsx'), { language: 'tsx', words: [] });
  assert.equal(staticReason('ts', 'console.log(1);\n'), null);
  assert.equal(staticReason('js', 'console.log(1);\n'), null);
  assert.equal(staticReason('tsx', 'const a = <div />;\n'), '是 TSX');
  assert.equal(staticReason('bash', 'npm test\n'), '不是 TypeScript 或 JavaScript');
  assert.equal(staticReason('ts', "import { x } from './x';\n"), '含 import / export');
  assert.equal(staticReason('ts', "const fs = require('node:fs');\n"), '含 require');
  assert.equal(staticReason('ts', 'document.title = "x";\n'), '用到 DOM 或浏览器存储');
  assert.equal(staticReason('ts', 'await fetch("/api");\n'), '用到网络');
  assert.equal(staticReason('ts', 'const [n] = useState(0);\n'), '用到 React');
  assert.equal(staticReason('ts', '// @ts-expect-error\nf("12");\n'), '含 @ts-expect-error（转译不会报类型错误）');
  assert.equal(staticReason('ts no-run', 'console.log(1);\n'), '标注了 no-run');
  assert.equal(staticReason('ts run', 'document.title;\n'), null, 'run forces the panel');

  assert.equal(dryRunReason('const n: number = 1;\nconsole.log(n * 2);\n'), null);
  assert.equal(dryRunReason('type A = string;\ninterface B { a: A }\n'), '只有类型声明，没有可运行的语句');
  assert.match(dryRunReason('raw.title;\n'), /^运行出错：raw is not defined/);
  assert.match(dryRunReason('declare const raw: unknown;\nconsole.log(raw);\n'), /^运行出错：raw is not defined/);
  assert.match(dryRunReason('const = 1;\n'), /^转译失败：/);
  assert.match(dryRunReason('throw new Error("boom");\n'), /^运行出错：boom/);
  assert.equal(dryRunReason('setTimeout(() => console.log("later"), 10);\n'), null, 'a timer is left to the browser');
  assert.equal(dryRunReason('await Promise.resolve(1);\nconsole.log("ok");\n'), null, 'top-level await is awaited');
  assert.match(dryRunReason('await Promise.reject(new Error("late"));\n'), /^运行出错：late/);
  assert.match(dryRunReason('let i = 0;\nwhile (true) { i += 1; }\n'), /^运行出错：Script execution timed out/);

  assert.deepEqual(fenceRun('ts', 'console.log(1);\n'), { run: true, language: 'ts' });
  assert.deepEqual(fenceRun('tsx', 'x\n'), { run: false, reason: '是 TSX', language: 'tsx' });
  assert.equal(fenceRun('ts run', 'raw.title;\n').run, true, 'run skips the dry run');
});

test('the fence scanner finds the same blocks the renderer sees', () => {
  const fences = markdownFences(
    ['# T', '', '```ts', 'const a = 1;', '```', '', '- item', '', '  ~~~js', '  console.log(1);', '  ~~~', '', '````md', '```ts', 'nested', '```', '````'].join('\n'),
  );
  assert.deepEqual(
    fences.map((fence) => [fence.info, fence.content, fence.line]),
    [
      ['ts', 'const a = 1;\n', 3],
      ['js', 'console.log(1);\n', 9],
      ['md', '```ts\nnested\n```\n', 13],
    ],
  );
});

test('markdown turns a runnable fence into the panel with its id and leaves the others to VitePress', async () => {
  const md = await createMarkdownRenderer(process.cwd(), {
    config: (instance) => {
      notebookMarkdown(instance);
      runnableFences(instance);
    },
  });
  const env = {};
  const html = md.render(
    ['```ts', 'const a = "<b>&</b>";', 'console.log(a, `${a}`);', '```', '', '```ts', '// @ts-expect-error', 'f("12");', '```', '', '```js', 'console.log(2);', '```'].join('\n'),
    env,
  );
  assert.equal(env.runnableFences, 2);
  assert.match(html, /<RunPanel id="fe-code-1" lang="ts" code="const a = &quot;&lt;b&gt;&amp;&lt;\/b&gt;&quot;;\nconsole\.log\(a, `\$\{a\}`\);\n"><\/RunPanel>/);
  assert.match(html, /<RunPanel id="fe-code-2" lang="js" code="console\.log\(2\);\n"><\/RunPanel>/);
  assert.match(html, /<div class="language-ts vp-adaptive-theme[^"]*"><button/);
  assert.equal((html.match(/<RunPanel/g) ?? []).length, 2);
});

test('the sandbox document relays console and errors and the parent keeps the clocks', () => {
  const doc = sandboxDocument('console.log("a </script> b");\n');
  assert.ok(doc.includes('new Worker('), 'the block runs in a worker inside the sandboxed frame');
  assert.ok(!doc.includes('a </script> b'), 'a closing tag inside the code cannot end anything');
  assert.ok(doc.includes('a &lt;/script> b'));
  assert.ok(doc.includes("post({ type: 'main' })"));
  assert.ok(doc.includes("event.data.type === 'stop'"));
  assert.ok(doc.includes("'unhandledrejection'"));
  assert.ok(!/\beval\(|new Function\(/.test(doc));
  assert.deepEqual(Object.keys(STAGES), ['load', 'compile', 'execute']);
  assert.equal(STAGES.execute.timeout, 5000);
  assert.equal(STAGES.load.label, '加载转译器');
  assert.equal(OUTPUT_LIMIT, 64 * 1024);
});
