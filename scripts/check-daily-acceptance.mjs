import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dataRoot = path.join(root, 'docs', '90-days', 'data');
const concepts = JSON.parse(await readFile(path.join(dataRoot, 'concepts.json'), 'utf8'));
const rootPackage = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const frontendPackage = JSON.parse(await readFile(path.join(root, 'frontend', 'package.json'), 'utf8'));
const manifests = [];

for (let week = 1; week <= 13; week += 1) {
  const file = path.join(dataRoot, 'days', 'week-' + String(week).padStart(2, '0') + '.json');
  manifests.push(...JSON.parse(await readFile(file, 'utf8')));
}

if (manifests.length !== 91) throw new Error('Daily acceptance must contain exactly 91 entries.');
for (const [index, day] of manifests.entries()) {
  const expectedDay = index + 1;
  if (day.day !== expectedDay || day.durationMinutes !== 120) throw new Error('Invalid entry for Day ' + expectedDay + '.');
  if (!Array.isArray(day.checks) || day.checks.length === 0) throw new Error('Day ' + expectedDay + ' has no objective check.');
  if (!Array.isArray(day.manual) || !day.manual.some((item) => item.expected && item.requiresReview === true)) {
    throw new Error('Day ' + expectedDay + ' needs an explicit human-review expectation.');
  }
  if (day.checks.some((check) => 'command' in check)) throw new Error('Day checks must be structured, not raw shell commands.');
  for (const conceptId of day.requiresConcepts) {
    if (!concepts[conceptId] || concepts[conceptId].introducedDay > day.day) {
      throw new Error('Day ' + day.day + ' depends on a concept that has not been introduced: ' + conceptId);
    }
  }
  const [sourceFile, sourceAnchor] = day.source.split('#');
  const source = await readFile(path.join(root, 'docs', '90-days', sourceFile), 'utf8');
  const expectedAnchor = 'day-' + String(day.day).padStart(2, '0');
  const headingPattern = new RegExp(
    '^## Day ' + String(day.day).padStart(2, '0') + '：.*\\{#' + expectedAnchor + '\\}$',
    'm',
  );
  if (sourceAnchor !== expectedAnchor || !headingPattern.test(source)) {
    throw new Error('Day ' + day.day + ' does not map to its stable Markdown anchor #' + expectedAnchor + '.');
  }
  await access(path.join(root, day.starter));
  for (const check of day.checks) {
    if (check.expectedExit !== 0) throw new Error(check.id + ' must declare expectedExit 0.');
    if (check.kind === 'npm-script') {
      const scripts = check.project === 'frontend' ? frontendPackage.scripts : rootPackage.scripts;
      if (!scripts?.[check.script]) throw new Error(check.id + ' references missing npm script ' + check.script + '.');
    } else if (check.kind === 'dotnet-test') {
      await access(path.join(root, check.solution));
    } else {
      throw new Error(check.id + ' uses unsupported check kind ' + check.kind + '.');
    }
  }
  const expectedEvidence = 'learning-evidence/day-' + String(day.day).padStart(2, '0') + '/report.json';
  if (!day.evidence.some((item) => item.pathTemplate === expectedEvidence)) {
    throw new Error('Day ' + day.day + ' is missing its canonical evidence path.');
  }
}

console.log('Daily acceptance: 91 days map to real lessons, starters, scripts, concepts, and reviewable evidence.');
