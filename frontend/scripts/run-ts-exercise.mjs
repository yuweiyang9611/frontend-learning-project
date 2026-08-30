import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const id = String(process.argv.find((value) => /^[BAC]\d{2}$/i.test(value)) || '').toUpperCase();
const manifest = JSON.parse(await readFile(new URL('../exercises/typescript/manifest.json', import.meta.url), 'utf8'));
if (!manifest.some((entry) => entry.id === id)) {
  console.error('Choose one exercise ID from B01–B09, A01–A09, or C01–C09.');
  process.exit(1);
}

const vitest = path.join(process.cwd(), 'node_modules', 'vitest', 'vitest.mjs');
const result = spawnSync(process.execPath, [vitest, 'run', 'exercises/typescript/exercise.test.ts'], {
  stdio: 'inherit',
  shell: false,
  env: { ...process.env, EXERCISE_ID: id, EXERCISE_TARGET: 'workbench' },
});
process.exit(result.status ?? 1);
