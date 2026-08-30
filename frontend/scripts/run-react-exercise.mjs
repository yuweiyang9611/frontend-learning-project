import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const day = Number(args.find((value) => /^5[0-6]$/.test(value)));
if (!Number.isInteger(day)) {
  console.error('Choose one React foundation day from 50 to 56, for example: npm run exercise:react -- 50');
  process.exit(1);
}

const separatedTargetIndex = args.indexOf('--target');
const inlineTarget = args.find((value) => value.startsWith('--target='));
if (separatedTargetIndex >= 0 && inlineTarget) {
  console.error('Choose one target syntax: --target reference or --target=reference.');
  process.exit(1);
}

const target =
  separatedTargetIndex >= 0 ? args[separatedTargetIndex + 1] : (inlineTarget?.slice('--target='.length) ?? 'workbench');
if (target !== 'workbench' && target !== 'reference') {
  console.error('Target must be workbench or reference.');
  process.exit(1);
}

const vitest = path.join(process.cwd(), 'node_modules', 'vitest', 'vitest.mjs');
const tsc = path.join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc');
console.log(`Day ${day} · 1/2 TypeScript compile gate`);
const compile = spawnSync(process.execPath, [tsc, '--noEmit', '--incremental', 'false', '-p', 'tsconfig.json'], {
  stdio: 'inherit',
  shell: false,
});
if (compile.status !== 0) process.exit(compile.status ?? 1);

console.log(`Day ${day} · 2/2 React behavior gate`);
const result = spawnSync(process.execPath, [vitest, 'run', 'exercises/react-foundations/react-foundations.test.tsx'], {
  stdio: 'inherit',
  shell: false,
  env: {
    ...process.env,
    REACT_EXERCISE_DAY: String(day),
    REACT_EXERCISE_TARGET: target,
  },
});
process.exit(result.status ?? 1);
