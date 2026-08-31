import { mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const npmCli = process.env.npm_execpath;
const npmCommand = npmCli ? process.execPath : process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npmArgs = (...args) => (npmCli ? [npmCli, ...args] : args);
const build = spawnSync(npmCommand, npmArgs('run', 'build'), { stdio: 'inherit', shell: false });
if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);
const server = spawn(npmCommand, npmArgs('run', 'preview'), { stdio: 'inherit', shell: false });
if (!server.pid)
  throw server.spawnargs.length
    ? new Error('Could not start the production preview.')
    : new Error('Invalid preview command.');
const target = 'http://127.0.0.1:3000/login';
const runStartedAt = Date.now();

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(target);
      if (response.ok) return;
    } catch {
      // Server is still compiling.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('IssueFlow did not become ready for Lighthouse.');
}

function stopServer() {
  if (process.platform === 'win32') {
    spawnSync('taskkill.exe', ['/PID', String(server.pid), '/T', '/F'], { stdio: 'ignore', shell: false });
  } else {
    server.kill('SIGTERM');
  }
}

try {
  await waitForServer();
  const outputDir = path.join(process.cwd(), '.lighthouse');
  const outputPath = path.join(outputDir, 'report.json');
  await mkdir(outputDir, { recursive: true });
  await rm(outputPath, { force: true });
  const cli = path.join(process.cwd(), 'node_modules', 'lighthouse', 'cli', 'index.js');
  const result = spawnSync(
    process.execPath,
    [
      cli,
      target,
      '--preset=desktop',
      '--chrome-flags=--headless --no-sandbox --disable-extensions',
      '--output=json',
      '--output-path=' + outputPath,
      '--quiet',
    ],
    {
      stdio: ['ignore', 'inherit', 'pipe'],
      shell: false,
      env: { ...process.env, CHROME_PATH: chromium.executablePath() },
      encoding: 'utf8',
    },
  );
  if (result.error) throw result.error;
  const lighthouseError = result.stderr ?? '';
  if (lighthouseError) process.stderr.write(lighthouseError);
  const windowsCleanupOnly =
    process.platform === 'win32' &&
    /(?:EPERM|EACCES|ENOTEMPTY)[\s\S]*[\\/]Temp[\\/]lighthouse\./i.test(lighthouseError);
  if (result.status !== 0 && !windowsCleanupOnly) {
    throw new Error(`Lighthouse exited with code ${result.status ?? 1}.`);
  }

  const report = JSON.parse(await readFile(outputPath, 'utf8'));
  const reportTime = Date.parse(report.fetchTime);
  if (
    !Number.isFinite(reportTime) ||
    reportTime < runStartedAt - 5_000 ||
    report.requestedUrl !== target ||
    report.finalUrl !== target
  ) {
    throw new Error('Lighthouse report freshness or target validation failed.');
  }
  if (windowsCleanupOnly) {
    console.warn('Lighthouse completed, but Windows could not remove its temporary Chrome profile.');
  }
  const injectedRequests = (report.audits?.['network-requests']?.details?.items ?? []).filter((item) => {
    try {
      return new URL(item.url).hostname.endsWith('kaspersky-labs.com');
    } catch {
      return false;
    }
  });
  if (injectedRequests.length) {
    throw new Error(
      'Lighthouse report was contaminated by local Kaspersky traffic injection. Use the clean Linux CI result as the performance gate.',
    );
  }
  const failures = [];
  const categoryMinimums = { performance: 0.75, accessibility: 0.9, 'best-practices': 0.9, seo: 0.9 };
  for (const [category, minimum] of Object.entries(categoryMinimums)) {
    const score = report.categories?.[category]?.score ?? 0;
    if (score < minimum) failures.push(category + ' score ' + score + ' is below ' + minimum);
  }
  const numericMaximums = {
    'largest-contentful-paint': 2500,
    'total-blocking-time': 200,
    'cumulative-layout-shift': 0.1,
  };
  for (const [audit, maximum] of Object.entries(numericMaximums)) {
    const value = report.audits?.[audit]?.numericValue;
    if (typeof value !== 'number' || value > maximum) failures.push(audit + ' ' + value + ' exceeds ' + maximum);
  }
  if (failures.length) throw new Error('Lighthouse budget failed:\n- ' + failures.join('\n- '));
  console.log('Lighthouse budgets passed for performance, accessibility, best practices, SEO, LCP, TBT, and CLS.');
} finally {
  stopServer();
}
