// Source read in place: the bundle, the link rewrite and the highlighter, without a browser.
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createMarkdownRenderer } from 'vitepress';
import { highlight, languageFor, lineHtml, tokenize } from './code-colors.mjs';
import { notebookMarkdown, sourceLinks } from './notebook-text.mjs';
import {
  MAX_SOURCE_BYTES,
  SOURCE_EXTENSIONS,
  bundleLookup,
  collectSourceFiles,
  directoryEntries,
  parseLineRange,
  rewriteRepositoryLink,
  siblingFiles,
  sourceIndex,
} from './source-bundle.mjs';

const repository = 'https://github.com/yuweiyang9611/frontend-learning-project';
const repositoryRoot = fileURLToPath(new URL('../../..', import.meta.url));

test('the bundle carries the learning folders and nothing generated', () => {
  const files = collectSourceFiles(repositoryRoot);
  const paths = files.map((file) => file.path);
  assert.ok(files.length >= 150, `only ${files.length} files`);
  for (const expected of [
    'frontend/src/api/issueflowApi.ts',
    'frontend/app/[...path]/page.tsx',
    'backend/IssueFlow.Api/Features/Issues/IssueEndpoints.cs',
    'labs/web-foundations/README.md',
    'contracts/issueflow/v1/http-cases.json',
    'docs/reference/source-traces.md',
    'docs/archive/original-curriculum/00-overview-and-learning-route.md',
    'README.md',
  ]) {
    assert.ok(paths.includes(expected), `${expected} is not bundled`);
  }
  assert.deepEqual(paths, [...paths].sort());
  for (const file of files) {
    assert.ok(file.bytes <= MAX_SOURCE_BYTES, `${file.path} is over the size cap`);
    assert.ok(SOURCE_EXTENSIONS.has(`.${file.path.split('.').pop().toLowerCase()}`), `${file.path} has an extension outside the allowlist`);
    assert.doesNotMatch(file.path, /(^|\/)(node_modules|bin|obj|TestResults|dist|\.next|\.vitepress|public)\//, file.path);
    assert.ok(!file.text.includes('\r'), `${file.path} keeps CR`);
    assert.equal(file.lines, file.text.length === 0 ? 0 : file.text.replace(/\n$/, '').split('\n').length, file.path);
  }
  const index = sourceIndex({ files, repository, revision: 'abc' });
  assert.equal(index.version, 1);
  assert.equal(index.blobBase, `${repository}/blob/main/`);
  assert.deepEqual(Object.keys(index.files[0]), ['path', 'bytes', 'lines']);
});

test('a GitHub link to a bundled file or folder becomes the source page, others stay', () => {
  const lookup = bundleLookup(['frontend/src/api/issueflowApi.ts', 'frontend/app/[...path]/page.tsx', 'backend/IssueFlow.Api/Program.cs']);
  const rewrite = (href) => rewriteRepositoryLink(href, { repository, ...lookup });
  assert.equal(rewrite(`${repository}/blob/main/frontend/src/api/issueflowApi.ts`), '/reference/source.html?path=frontend/src/api/issueflowApi.ts');
  assert.equal(rewrite(`${repository}/blob/main/frontend/src/api/issueflowApi.ts#L5-L9`), '/reference/source.html?path=frontend/src/api/issueflowApi.ts#L5-L9');
  assert.equal(rewrite(`${repository}/blob/main/frontend/src/api/issueflowApi.ts#L9-5`), '/reference/source.html?path=frontend/src/api/issueflowApi.ts#L5-L9');
  assert.equal(rewrite(`${repository}/blob/main/frontend/src/api/issueflowApi.ts#L7`), '/reference/source.html?path=frontend/src/api/issueflowApi.ts#L7');
  assert.equal(rewrite(`${repository}/blob/main/frontend/src/api/issueflowApi.ts#readme`), '/reference/source.html?path=frontend/src/api/issueflowApi.ts');
  assert.equal(rewrite(`${repository}/blob/main/frontend/app/%5B...path%5D/page.tsx`), '/reference/source.html?path=frontend/app/%5B...path%5D/page.tsx');
  assert.equal(rewrite(`${repository}/blob/v1.0/backend/IssueFlow.Api/Program.cs`), '/reference/source.html?path=backend/IssueFlow.Api/Program.cs');
  assert.equal(rewrite(`${repository}/tree/main/frontend/src`), '/reference/source.html?dir=frontend/src');
  assert.equal(rewrite(`${repository}/tree/main/frontend/src/`), '/reference/source.html?dir=frontend/src');
  assert.equal(rewrite(`${repository}/blob/main/frontend/.env.example`), null);
  assert.equal(rewrite(`${repository}/tree/main/frontend/drizzle`), null);
  assert.equal(rewrite(`${repository}/blob/main/frontend/src`), null);
  assert.equal(rewrite(repository), null);
  assert.equal(rewrite(`${repository}/issues/1`), null);
  assert.equal(rewrite('https://github.com/other/repo/blob/main/frontend/src/api/issueflowApi.ts'), null);
  assert.deepEqual(parseLineRange('#L12-L3'), [3, 12]);
  assert.equal(parseLineRange('#intro'), null);
});

test('markdown rewrites the bundled links in place and counts them', async () => {
  const lookup = bundleLookup(['frontend/src/api/issueflowApi.ts']);
  const md = await createMarkdownRenderer(process.cwd(), {
    config: (instance) => {
      notebookMarkdown(instance);
      sourceLinks(instance, (href) => rewriteRepositoryLink(href, { repository, ...lookup }));
    },
  });
  const env = {};
  const html = md.render(
    [
      `- [issueflowApi.ts](${repository}/blob/main/frontend/src/api/issueflowApi.ts#L5-L9)`,
      `- [ci.yml](${repository}/blob/main/.github/workflows/ci.yml)`,
      `- [仓库](${repository})`,
    ].join('\n'),
    env,
  );
  assert.match(html, /href="\/reference\/source\.html\?path=frontend\/src\/api\/issueflowApi\.ts#L5-L9"/);
  assert.match(html, /href="https:\/\/github\.com\/yuweiyang9611\/frontend-learning-project\/blob\/main\/\.github\/workflows\/ci\.yml"/);
  assert.match(html, /href="https:\/\/github\.com\/yuweiyang9611\/frontend-learning-project"/);
  assert.equal(env.sourceLinks, 1);
});

test('directory listings put folders first and siblings leave the file out', () => {
  const files = [
    { path: 'frontend/src/a.ts', bytes: 10, lines: 1 },
    { path: 'frontend/src/b.ts', bytes: 20, lines: 2 },
    { path: 'frontend/src/screens/c.tsx', bytes: 30, lines: 3 },
    { path: 'frontend/src/screens/d.tsx', bytes: 40, lines: 4 },
    { path: 'backend/Program.cs', bytes: 50, lines: 5 },
  ];
  assert.deepEqual(
    directoryEntries(files, 'frontend/src').map((entry) => [entry.name, entry.directory, entry.files, entry.lines]),
    [
      ['screens', true, 2, 7],
      ['a.ts', false, 1, 1],
      ['b.ts', false, 1, 2],
    ],
  );
  assert.deepEqual(directoryEntries(files, '').map((entry) => entry.name), ['backend', 'frontend']);
  assert.deepEqual(directoryEntries(files, 'nowhere'), []);
  assert.deepEqual(siblingFiles(files, 'frontend/src/a.ts').map((entry) => entry.path), ['frontend/src/b.ts']);
  assert.deepEqual(siblingFiles(files, 'backend/Program.cs'), []);
});

test('the highlighter colours each language with the kit token classes and no red', () => {
  assert.equal(languageFor('frontend/src/app/AppProviders.tsx'), 'typescript');
  assert.equal(languageFor('backend/IssueFlow.Api/Program.cs'), 'csharp');
  assert.equal(languageFor('frontend/app/globals.css'), 'css');
  assert.equal(languageFor('backend/IssueFlow.Api/IssueFlow.Api.csproj'), 'xml');
  assert.equal(languageFor('README.md'), 'markdown');
  assert.equal(languageFor('contracts/issueflow-api-contract.json'), 'json');
  assert.equal(languageFor('labs/run.unknownext'), 'unknownext');

  const ts = tokenize(`import { useState } from 'react'; // hook\nexport function Counter(): JSX.Element { const [n] = useState(0); return <div className="x">{n}</div>; }`, 'typescript');
  const classesOf = (tokens, text) => tokens.filter((token) => token.text === text).map((token) => token.cls);
  assert.deepEqual(classesOf(ts, 'import'), ['tok-keyword']);
  assert.deepEqual(classesOf(ts, "'react'"), ['tok-string']);
  assert.deepEqual(classesOf(ts, '// hook'), ['tok-comment']);
  assert.deepEqual(classesOf(ts, 'Counter'), ['tok-call']);
  assert.ok(classesOf(ts, 'useState').every((cls) => cls === 'tok-call'), 'a called name is a call');
  assert.deepEqual(classesOf(ts, 'JSX'), ['tok-type']);
  assert.deepEqual(classesOf(ts, 'div'), ['tok-meta', 'tok-meta']);
  assert.deepEqual(classesOf(ts, '0'), ['tok-number']);

  const cs = tokenize('public sealed record Issue(int Id, string Title); // one\nvar list = new List<Issue>();', 'csharp');
  assert.deepEqual(classesOf(cs, 'record'), ['tok-keyword']);
  assert.deepEqual(classesOf(cs, 'Issue'), ['tok-call', 'tok-type']);
  assert.deepEqual(classesOf(cs, '// one'), ['tok-comment']);

  const css = tokenize('.nb-code { --nb-code-height: 20rem; color: var(--nb-ink); margin: 0 auto !important; } /* c */ @media print { a { color: #fff; } }', 'css');
  assert.deepEqual(classesOf(css, 'color'), ['tok-type', 'tok-type']);
  assert.deepEqual(classesOf(css, '--nb-code-height'), ['tok-meta']);
  assert.deepEqual(classesOf(css, '20rem'), ['tok-number']);
  assert.deepEqual(classesOf(css, 'var'), ['tok-call']);
  assert.deepEqual(classesOf(css, '!important'), ['tok-keyword']);
  assert.deepEqual(classesOf(css, '@media'), ['tok-keyword']);
  assert.deepEqual(classesOf(css, '#fff'), ['tok-number']);
  assert.deepEqual(classesOf(css, '/* c */'), ['tok-comment']);

  const json = tokenize('{ "name": "x", "count": 3, "ok": true }', 'json');
  assert.deepEqual(classesOf(json, '"name"'), ['tok-type']);
  assert.deepEqual(classesOf(json, '"x"'), ['tok-string']);
  assert.deepEqual(classesOf(json, 'true'), ['tok-keyword']);

  const allowed = new Set(['', 'tok-keyword', 'tok-number', 'tok-type', 'tok-call', 'tok-string', 'tok-comment', 'tok-meta']);
  for (const token of [...ts, ...cs, ...css, ...json]) assert.ok(allowed.has(token.cls), token.cls);
  assert.equal([...ts, ...cs, ...css, ...json].map((token) => token.text).join('').length, [ts, cs, css, json].reduce((total, tokens) => total + tokens.map((token) => token.text).join('').length, 0));
});

test('highlighting splits lines and a token that spans lines keeps its class on each', () => {
  const lines = highlight('/* a\n b */ x\n', 'typescript');
  assert.equal(lines.length, 2);
  assert.deepEqual(lines[0], [{ cls: 'tok-comment', text: '/* a' }]);
  assert.deepEqual(lines[1], [
    { cls: 'tok-comment', text: ' b */' },
    { cls: '', text: ' x' },
  ]);
  assert.equal(lineHtml(lines[1]), '<span class="tok-comment"> b */</span> x');
  assert.equal(lineHtml([{ cls: '', text: '<a href="x">&</a>' }]), '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  assert.deepEqual(highlight('', 'typescript'), [[]]);
  assert.equal(highlight('one\ntwo\nthree', 'text').length, 3);
  assert.equal(highlight('one\r\ntwo\r\n', 'text').length, 2);
});
