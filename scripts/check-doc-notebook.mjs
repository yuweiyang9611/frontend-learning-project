// Checks the built site against the notebook kit's rules that a reader would notice first.
//
// - The kit's theme.js squeezes a curly quote beside a comma or full stop by replacing text nodes.
//   Vue owns these pages, so the build emits the `.nb-halt` spans itself; no text run may be left
//   for the runtime pass (each run between tags becomes one DOM text node).
// - The server render of the opening screen has no record, so it shows no tick, no 停在这里 and no
//   solid line, and the old hero and feature cards are gone.
// - Every page loads the kit's theme.js in <head> and keeps lang="zh-CN".
// - The loop band: every lesson page (week, learning, typescript, backend) carries one ol.nb-steps with
//   the five steps, and the server render marks none of them done or 停在这里; the runnable fences are
//   on the pages as the kit panel; the opening screen's continue link is the first step of week 1.
import fs from 'node:fs';
import path from 'node:path';

const outputRoot = path.join(process.cwd(), 'docs', '.vitepress', 'dist');
if (!fs.existsSync(outputRoot)) {
  console.error('Missing VitePress output. Run "npm run docs:build" first.');
  process.exit(1);
}

function collect(directory, result = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(fullPath, result);
    else if (entry.name.endsWith('.html')) result.push(fullPath);
  }
  return result;
}

const decode = (value) =>
  value.replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
const loose = /[”’][，。、；：？！]|[，。、；：？！][“‘]/;
const skipped = new Set(['code', 'kbd', 'pre', 'samp', 'script', 'style', 'textarea', 'svg', 'title']);
const problems = [];
const files = collect(outputRoot);

for (const file of files) {
  const page = path.relative(outputRoot, file).split(path.sep).join('/');
  const html = fs.readFileSync(file, 'utf8');
  if (!/<html lang="zh-CN"/.test(html)) problems.push(`${page}: <html> is not lang="zh-CN"`);
  const head = html.slice(0, html.indexOf('</head>'));
  if (!/<script src="[^"]*\/kit\/theme\.js"><\/script>/.test(head)) problems.push(`${page}: the kit's theme.js is not loaded in <head>`);

  const open = [];
  let runs = 0;
  for (const part of html.slice(html.indexOf('<body')).split(/(<[^>]+>)/)) {
    if (part.startsWith('<!--')) continue;
    const tag = part.match(/^<(\/?)([a-zA-Z][\w-]*)/);
    if (tag) {
      const name = tag[2].toLowerCase();
      if (!skipped.has(name) || part.endsWith('/>')) continue;
      if (tag[1]) {
        if (open.at(-1) === name) open.pop();
      } else open.push(name);
      continue;
    }
    if (open.length === 0 && loose.test(decode(part))) runs += 1;
  }
  if (runs > 0) problems.push(`${page}: ${runs} text run(s) still hold touching marks for theme.js to replace`);
}

const home = fs.readFileSync(path.join(outputRoot, 'index.html'), 'utf8');
const app = home.slice(home.indexOf('<div id="app">'));
if (/\baria-current="step"/.test(app) || app.includes('data-record="done"') || app.includes('停在这里')) {
  problems.push('index.html: the server render shows a record mark without a record');
}
if (/class="[^"]*\b(?:VPHero|VPFeatures?|VPHome)\b/.test(app)) problems.push('index.html: the old hero or feature cards are back');
const continueAt = app.indexOf('class="fe-continue');
const registerAt = app.indexOf('class="fe-register');
if (continueAt === -1 || registerAt === -1 || continueAt > registerAt) {
  problems.push('index.html: the continue link must come first, before the 13-week register');
}
const bannerAt = app.indexOf('class="fe-resume nb-banner');
if (bannerAt === -1 || bannerAt > registerAt) problems.push('index.html: the banner must come before the 13-week register');
const rings = app.match(/class="nb-ring"[^>]*aria-label="完成 (\d+)%"/g) ?? [];
if (rings.length !== 13 || rings.some((ring) => !ring.endsWith('aria-label="完成 0%"'))) {
  problems.push('index.html: the server render must show 13 week rings, each at 0%');
}

const lessonPage = /^(?:90-days\/week-\d\d-[^/]+|(?:learning|typescript|backend)\/\d\d-[^/]+)\.html$/;
const stepOrder = ['read', 'code', 'run', 'quiz', 'note'];
let lessons = 0;
let panels = 0;
for (const file of files) {
  const page = path.relative(outputRoot, file).split(path.sep).join('/');
  const html = fs.readFileSync(file, 'utf8');
  const body = html.slice(html.indexOf('<div id="app">'));
  panels += (body.match(/class="nb-code fe-code"/g) ?? []).length;
  const bands = body.match(/<ol class="nb-steps[^"]*"[\s\S]*?<\/ol>/g) ?? [];
  if (!lessonPage.test(page)) {
    if (bands.length) problems.push(`${page}: a loop band on a page that is not a lesson`);
    continue;
  }
  lessons += 1;
  if (bands.length !== 1) {
    problems.push(`${page}: expected one loop band, found ${bands.length}`);
    continue;
  }
  const steps = [...bands[0].matchAll(/<li[^>]*\bdata-step="([a-z]+)"[^>]*\bdata-state="([a-z]+)"/g)].map((match) => [match[1], match[2]]);
  if (steps.map(([step]) => step).join(',') !== stepOrder.join(',')) problems.push(`${page}: the band must carry 读、看代码、跑、自测、记一笔 in that order`);
  if (steps.some(([, state]) => state !== 'pending' && state !== 'none')) problems.push(`${page}: the server render marks a step done or 停在这里`);
  if (/<li[^>]*data-state="none"[^>]*>\s*<a /.test(bands[0])) problems.push(`${page}: a step the lesson lacks must not be a link`);
}
if (lessons !== 39) problems.push(`expected 39 lesson pages with a loop band, found ${lessons}`);
if (panels < 40) problems.push(`expected at least 40 runnable code panels across the site, found ${panels}`);
const continueLink = app.match(/<a class="fe-continue"[^>]*href="([^"]*)"[^>]*data-step="([a-z]+)"/);
if (!continueLink || !continueLink[1].endsWith('/90-days/week-01-foundations.html') || continueLink[2] !== 'read') {
  problems.push('index.html: without a record the continue link must be the 读 step of week 1');
}

if (problems.length > 0) {
  console.error(`Notebook check failed with ${problems.length} problem(s):`);
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}
console.log(
  `Checked ${files.length} generated page(s): kit loaded, zh-CN, no touching marks left for the runtime pass, opening screen continue-first, ${lessons} loop bands, ${panels} runnable panels.`,
);
