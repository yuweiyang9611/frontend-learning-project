import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const frontendRoot = fileURLToPath(new URL('../', import.meta.url));
const manifestUrl = new URL('../exercises/typescript/manifest.json', import.meta.url);
const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));
const args = process.argv.slice(2);

function option(name) {
  const exactIndex = args.indexOf(name);
  if (exactIndex >= 0) return args[exactIndex + 1];
  const prefix = name + '=';
  return args.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

function printUsage() {
  console.log(
    [
      'TypeScript exercise runner',
      '',
      '  npm run exercise:test -- B01',
      '  npm run exercise:test -- --id C04 --hint 2',
      '  npm run exercise:test -- A05 --target reference',
      '  npm run exercise:verify',
      '  npm run exercise:test -- --list',
      '',
      'A single workbench exercise is the default. Verification compiles the',
      'precise signatures and all 27 positive/negative fixtures before Vitest.',
    ].join('\n'),
  );
}

function printHints(entry, level) {
  const capped = Math.max(0, Math.min(Number(level) || 0, entry.hints.length));
  for (let index = 0; index < capped; index += 1) {
    console.log('  Hint ' + (index + 1) + '/' + entry.hints.length + ': ' + entry.hints[index]);
  }
}

function runNode(modulePath, moduleArgs, env = process.env) {
  const result = spawnSync(process.execPath, [modulePath, ...moduleArgs], {
    cwd: frontendRoot,
    env,
    encoding: 'utf8',
    shell: false,
    maxBuffer: 10 * 1024 * 1024,
  });
  const output = [result.stdout, result.stderr].filter(Boolean).join('');
  if (output) process.stdout.write(output);
  if (result.error) console.error(result.error.message);
  return { ok: result.status === 0, output, status: result.status ?? 1 };
}

if (args.includes('--help') || args.includes('-h')) {
  printUsage();
  process.exit(0);
}

if (args.includes('--list')) {
  for (const entry of manifest) {
    console.log(entry.id.padEnd(4) + ' [' + entry.level + '] ' + entry.title);
  }
  process.exit(0);
}

const verifyAll = args.includes('--verify');
const runAll = verifyAll || args.includes('--all');
const positionalId = args.find((value) => /^[BAC]\d{2}$/i.test(value));
const requestedId = String(option('--id') || positionalId || '').toUpperCase();
const entry = manifest.find((candidate) => candidate.id === requestedId);

if (!runAll && !entry) {
  printUsage();
  console.error('\nChoose one exercise ID from B01-B09, A01-A09, or C01-C09.');
  process.exit(1);
}

const requestedTarget = String(option('--target') || (runAll ? 'reference' : 'workbench')).toLowerCase();
if (!['reference', 'workbench'].includes(requestedTarget)) {
  console.error('Target must be reference or workbench.');
  process.exit(1);
}
if (verifyAll && requestedTarget !== 'reference') {
  console.error('--verify always checks the stable reference target.');
  process.exit(1);
}

const rawHintLevel = option('--hint');
const hintLevel = rawHintLevel === undefined ? 0 : Number(rawHintLevel);
if (!Number.isInteger(hintLevel) || hintLevel < 1 || hintLevel > 4) {
  if (rawHintLevel !== undefined) {
    console.error('--hint must be a level from 1 to 4.');
    process.exit(1);
  }
}

if (entry) {
  console.log('\n[' + entry.id + '] ' + entry.title + ' (' + entry.level + ')');
  console.log('Focus: ' + entry.focus);
  console.log('Target: ' + requestedTarget);
  if (hintLevel > 0) printHints(entry, hintLevel);
} else {
  console.log('\n[verify] Compile signatures + 27 reference runtime contracts');
}

console.log('\n1/2 Compile gate: tsconfig.exercises.json');
const tsc = path.join(frontendRoot, 'node_modules', 'typescript', 'bin', 'tsc');
const compile = runNode(tsc, [
  '--project',
  'tsconfig.exercises.json',
  '--noEmit',
  '--incremental',
  'false',
  '--pretty',
  process.stdout.isTTY ? 'true' : 'false',
]);

if (!compile.ok) {
  console.error('\n[compile failed] The candidate does not satisfy its precise signature,');
  console.error('or a positive/negative fixture no longer proves the intended constraint.');
  if (entry && hintLevel === 0) {
    console.log('\nFirst hint:');
    printHints(entry, 1);
    console.log('Use --hint 2, --hint 3, or --hint 4 only when needed.');
  }
  process.exit(compile.status);
}

console.log('Compile gate passed.');
console.log('\n2/2 Runtime gate: Vitest contract cases');
const vitest = path.join(frontendRoot, 'node_modules', 'vitest', 'vitest.mjs');
const env = { ...process.env, EXERCISE_TARGET: requestedTarget };
if (entry) env.EXERCISE_ID = entry.id;
else delete env.EXERCISE_ID;

const runtime = runNode(vitest, ['run', 'exercises/typescript/exercise.test.ts', '--reporter=verbose'], env);

if (!runtime.ok) {
  if (entry) {
    console.error(
      runtime.output.includes('TODO ' + entry.id)
        ? '\n[not implemented] Replace workbenchSolutions.' + entry.id + ' and rerun.'
        : '\n[runtime failed] ' + entry.id + ' compiled, but a named behavior contract failed.',
    );
    if (hintLevel === 0) {
      console.log('\nFirst hint:');
      printHints(entry, 1);
      console.log('Use --hint 2, --hint 3, or --hint 4 only when needed.');
    }
  }
  process.exit(runtime.status);
}

console.log(
  entry
    ? '\n[passed] ' + entry.id + ' satisfies both the compile-time and runtime contracts.'
    : '\n[passed] All 27 precise signatures, negative fixtures, and reference contracts passed.',
);
