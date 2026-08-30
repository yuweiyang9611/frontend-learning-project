import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const base = path.join(root, 'frontend', 'exercises', 'typescript');
const manifest = JSON.parse(await readFile(path.join(base, 'manifest.json'), 'utf8'));
const expected = [
  ...Array.from({ length: 9 }, (_, index) => 'B' + String(index + 1).padStart(2, '0')),
  ...Array.from({ length: 9 }, (_, index) => 'A' + String(index + 1).padStart(2, '0')),
  ...Array.from({ length: 9 }, (_, index) => 'C' + String(index + 1).padStart(2, '0')),
];
const ids = manifest.map((entry) => entry.id);
if (JSON.stringify(ids) !== JSON.stringify(expected)) {
  throw new Error('TypeScript manifest must contain B01–B09, A01–A09, C01–C09 in order.');
}

const docs = await readFile(path.join(root, 'docs', 'typescript', '08-exercise-bank.md'), 'utf8');
const registryNames = ['contracts.ts', 'reference.ts', 'workbench.ts', 'compile-time-checks.ts'];
const registries = await Promise.all(registryNames.map((file) => readFile(path.join(base, file), 'utf8')));
for (const entry of manifest) {
  if (!entry.title || !entry.focus || !Array.isArray(entry.hints) || entry.hints.length !== 4) {
    throw new Error(entry.id + ' must have a title, focus, and exactly four hints.');
  }
  if (!docs.includes('### ' + entry.id + '：' + entry.title)) throw new Error(entry.id + ' is not mapped to the exercise bank.');
  registries.forEach((source, index) => {
    if (!source.includes(entry.id + ':')) throw new Error(entry.id + ' is missing from ' + registryNames[index] + '.');
  });
}
console.log('TypeScript exercises: 27 IDs, four-level hints, contracts, workbenches, references, and compiler checks verified.');
