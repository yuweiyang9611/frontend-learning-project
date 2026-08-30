import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const dayFlag = process.argv.indexOf('--day');
const day = Number(process.env.LEARNING_DAY ?? process.argv[dayFlag + 1]);
if (!Number.isInteger(day) || day < 8 || day > 28) {
  console.error('Choose Day 08–28, for example: npm run learn:test:web -- --day 22');
  process.exit(1);
}

const checkpoint = day < 15 ? 8 : day < 22 ? 15 : 22;
const root = process.cwd();
const workspace = path.join(root, 'learning-work', `day-${String(checkpoint).padStart(2, '0')}`);
const relativeWorkspace = path.relative(root, workspace);

try {
  await access(workspace);
} catch {
  console.error(
    `Missing ${relativeWorkspace}. Create it first with npm run learn:create -- --day ${String(checkpoint).padStart(2, '0')}.`,
  );
  process.exit(1);
}

const html = await readFile(path.join(workspace, 'index.html'), 'utf8');
const failures = [];
for (const [label, pattern] of [
  ['doctype', /<!doctype html>/i],
  ['language', /<html\b[^>]*\blang=/i],
  ['viewport', /<meta\b[^>]*\bname=["']viewport["']/i],
  ['main landmark', /<main\b/i],
  ['page heading', /<h1\b/i],
  ['explicit form label', /<label\b[^>]*\bfor=/i],
]) {
  if (!pattern.test(html)) failures.push(label);
}

if (checkpoint === 8 && day >= 10 && /TODO/i.test(html)) {
  failures.push('Day 08 form TODO must be replaced from Day 10 onward');
}

if (checkpoint >= 15) {
  const css = await readFile(path.join(workspace, 'styles.css'), 'utf8');
  for (const [label, pattern] of [
    ['CSS custom property', /--[\w-]+\s*:/],
    ['responsive media query', /@media\s*\(/],
    ['visible keyboard focus', /:focus-visible/],
  ]) {
    if (!pattern.test(css)) failures.push(label);
  }
}

if (failures.length > 0) {
  console.error(`${relativeWorkspace} is missing required Day ${day} evidence:`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

if (checkpoint === 22) {
  const testDirectory = path.join(workspace, 'test');
  const testFiles = (await readdir(testDirectory))
    .filter((name) => name.endsWith('.test.mjs'))
    .map((name) => path.join(testDirectory, name));
  const result = spawnSync(process.execPath, ['--test', ...testFiles], {
    cwd: workspace,
    stdio: 'inherit',
    shell: false,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`Learner workspace ${relativeWorkspace} passes the objective Day ${day} checks.`);
