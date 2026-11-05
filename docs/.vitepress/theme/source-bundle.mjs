// Source read in place: the repository files a lesson can point at, copied into the site at build time
// so the source panel never drifts from the page's own revision.
//
// scripts/bundle-doc-source.mjs writes the bundle to docs/public/source/<path>.txt plus index.json;
// config.mts reads the same list to turn GitHub blob/tree links into in-site links while rendering
// markdown; scripts/check-doc-site-links.mjs checks the built site against the index.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
export * from './source-links.mjs';

/** Whole learning folders, plus the root guides the pages link. */
export const SOURCE_ROOTS = [
  'frontend/src',
  'frontend/app',
  'frontend/exercises',
  'frontend/e2e',
  'frontend/db',
  'frontend/drizzle',
  'backend',
  'labs',
  'contracts',
  'docs',
  'README.md',
  'LEARNING_GUIDE.md',
  'frontend_learning_project_detailed.md',
];

/** Code, project files, markdown, data and scripts: what a reader can learn from. */
export const SOURCE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css', '.html', '.json', '.md', '.txt', '.http', '.sql',
  '.cs', '.csproj', '.slnx', '.sln', '.props', '.xml', '.yml', '.yaml', '.sh', '.ps1', '.cmd',
]);

/** Build output, caches, generated test output and the site's own machinery are never bundled. */
const EXCLUDED_DIRECTORIES = new Set([
  'node_modules', 'bin', 'obj', 'TestResults', '.git', '.next', '.vinext', 'dist', 'out', 'coverage',
  'playwright-report', 'test-results', '.wrangler', '.lighthouse', 'uploads', '.vitepress', 'public',
]);

export const MAX_SOURCE_BYTES = 256 * 1024;

const toPosix = (value) => value.split(path.sep).join('/');

function lineCount(text) {
  if (text.length === 0) return 0;
  let lines = 0;
  for (let index = text.indexOf('\n'); index !== -1; index = text.indexOf('\n', index + 1)) lines += 1;
  return text.endsWith('\n') ? lines : lines + 1;
}

function* walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRECTORIES.has(entry.name)) continue;
      yield* walk(path.join(directory, entry.name));
    } else if (entry.isFile()) {
      yield path.join(directory, entry.name);
    }
  }
}

/** Every file the bundle carries, with its text, sorted by path. */
export function collectSourceFiles(repositoryRoot) {
  const files = [];
  for (const root of SOURCE_ROOTS) {
    const absoluteRoot = path.join(repositoryRoot, root);
    if (!fs.existsSync(absoluteRoot)) continue;
    const candidates = fs.statSync(absoluteRoot).isDirectory() ? walk(absoluteRoot) : [absoluteRoot];
    for (const absolute of candidates) {
      if (!SOURCE_EXTENSIONS.has(path.extname(absolute).toLowerCase())) continue;
      if (fs.statSync(absolute).size > MAX_SOURCE_BYTES) continue;
      const buffer = fs.readFileSync(absolute);
      if (buffer.includes(0)) continue;
      const text = buffer.toString('utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');
      const relative = toPosix(path.relative(repositoryRoot, absolute));
      files.push({ path: relative, bytes: Buffer.byteLength(text), lines: lineCount(text), text });
    }
  }
  return files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

/** The commit the bundle was taken from: the Pages build's sha, or the local HEAD. */
export function sourceRevision(repositoryRoot) {
  const fromEnvironment = process.env.GITHUB_SHA ?? '';
  if (/^[0-9a-f]{40}$/i.test(fromEnvironment)) return fromEnvironment.toLowerCase();
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot, encoding: 'utf8' }).trim().toLowerCase();
  } catch {
    return 'unknown';
  }
}

export function blobBaseFor(repository, ref = 'main') {
  return `${repository.replace(/\/+$/, '')}/blob/${ref}/`;
}

/** The index the panel and the source page read. */
export function sourceIndex({ files, repository, revision }) {
  return {
    version: 1,
    revision,
    repository,
    blobBase: blobBaseFor(repository),
    files: files.map(({ path: filePath, bytes, lines }) => ({ path: filePath, bytes, lines })),
  };
}

/** Writes the bundle into `outputDirectory`, replacing what was there, and returns the index. */
export function writeSourceBundle({ repositoryRoot, outputDirectory, repository, revision = sourceRevision(repositoryRoot) }) {
  const files = collectSourceFiles(repositoryRoot);
  fs.rmSync(outputDirectory, { recursive: true, force: true });
  for (const file of files) {
    const target = path.join(outputDirectory, `${file.path}.txt`);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, file.text);
  }
  const index = sourceIndex({ files, repository, revision });
  fs.writeFileSync(path.join(outputDirectory, 'index.json'), JSON.stringify(index));
  return index;
}
