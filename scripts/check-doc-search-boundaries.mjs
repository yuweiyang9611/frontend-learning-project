import fs from 'node:fs';
import path from 'node:path';

const repositoryRoot = process.cwd();
const docsRoot = path.join(repositoryRoot, 'docs');
const violations = [];

function hasSearchDisabled(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return frontmatter !== null && /^search:\s*false\s*$/m.test(frontmatter[1]);
}

for (const entry of fs.readdirSync(path.join(docsRoot, 'maintainers'), {
  withFileTypes: true,
})) {
  if (entry.isFile() && entry.name.endsWith('.md')) {
    const filePath = path.join(docsRoot, 'maintainers', entry.name);
    if (!hasSearchDisabled(filePath)) {
      violations.push(`docs/maintainers/${entry.name} must declare search: false`);
    }
  }
}

const archiveIndex = path.join(
  docsRoot,
  'archive',
  'original-curriculum',
  'README.md',
);
if (!hasSearchDisabled(archiveIndex)) {
  violations.push('archive index must declare search: false');
}

const config = fs.readFileSync(
  path.join(docsRoot, '.vitepress', 'config.mts'),
  'utf8',
);
if (!config.includes("srcExclude: ['archive/original-curriculum/0*.md']")) {
  violations.push('archived curriculum source files must remain in srcExclude');
}

if (violations.length > 0) {
  console.error('Documentation search-boundary check failed:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('Documentation search boundaries are explicit and valid.');
