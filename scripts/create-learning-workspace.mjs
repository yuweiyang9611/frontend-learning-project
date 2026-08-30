import { cp, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const dayFlag = process.argv.indexOf('--day');
const directDay = process.argv.find((value) => /^\d{1,2}$/.test(value));
const day = Number(directDay ?? process.argv[dayFlag + 1]);
const snapshots = new Map([
  [8, 'day-08'],
  [15, 'day-15'],
  [22, 'day-22'],
]);

if (!snapshots.has(day)) {
  console.error('Choose a starter checkpoint: npm run learn:create -- --day 08, 15, or 22.');
  process.exit(1);
}

const root = process.cwd();
const source = path.join(root, 'labs', 'web-foundations', 'snapshots', snapshots.get(day));
const target = path.join(root, 'learning-work', 'day-' + String(day).padStart(2, '0'));

try {
  await stat(target);
  console.error('Refusing to overwrite ' + path.relative(root, target) + '. Rename or remove it after preserving your work.');
  process.exit(1);
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

await mkdir(path.dirname(target), { recursive: true });
await cp(source, target, { recursive: true, errorOnExist: true });
console.log('Created ' + path.relative(root, target) + '. Start the fixture server with npm run learn:start.');
