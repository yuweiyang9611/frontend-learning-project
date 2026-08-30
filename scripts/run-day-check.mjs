import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const day = Number(process.argv.find((value) => /^\d{1,2}$/.test(value)));
if (!Number.isInteger(day) || day < 1 || day > 91) {
  console.error('Choose a day from 1 to 91, for example: npm run learn:day -- 29');
  process.exit(1);
}

const root = process.cwd();
const week = Math.ceil(day / 7);
const manifestPath = path.join(root, 'docs', '90-days', 'data', 'days', 'week-' + String(week).padStart(2, '0') + '.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8')).find((entry) => entry.day === day);
const results = [];
const typeScriptExerciseIds = [
  ...Array.from({ length: 9 }, (_, index) => `B0${index + 1}`),
  ...Array.from({ length: 9 }, (_, index) => `A0${index + 1}`),
  'C01',
  'C02',
  'C03',
];

for (const check of manifest.checks) {
  let command;
  let args;
  let cwd = root;
  if (check.kind === 'npm-script') {
    command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    args = ['run', check.script];
    if (check.project === 'frontend') cwd = path.join(root, 'frontend');
  } else {
    command = 'dotnet';
    args = ['test', check.solution, '--nologo'];
  }
  const childEnvironment = { ...process.env, LEARNING_DAY: String(day) };
  let target = manifest.starter;
  if (check.project === 'frontend' && check.script === 'exercise:verify' && day >= 29 && day <= 49) {
    const exerciseId = typeScriptExerciseIds[day - 29];
    childEnvironment.EXERCISE_ID = exerciseId;
    childEnvironment.EXERCISE_TARGET = 'workbench';
    target = `frontend/exercises/typescript/workbench.ts#${exerciseId}`;
  }
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: false,
    env: childEnvironment,
  });
  results.push({
    id: check.id,
    kind: check.kind,
    target,
    expectedExit: check.expectedExit,
    exitCode: result.status ?? 1,
  });
}

const directory = path.join(root, 'learning-evidence', 'day-' + String(day).padStart(2, '0'));
await mkdir(directory, { recursive: true });
const report = {
  schemaVersion: 1,
  day,
  generatedAt: new Date().toISOString(),
  sanitization: {
    status: 'pendingReview',
    reason: 'Commands stream to the terminal; a human must review any captured evidence before sharing.',
  },
  checks: results,
  manual: manifest.manual.map((item) => ({ id: item.id, status: 'pendingReview', expected: item.expected })),
};
await writeFile(path.join(directory, 'report.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log('Evidence report: ' + path.relative(root, path.join(directory, 'report.json')));
if (results.some((item) => item.exitCode !== item.expectedExit)) process.exitCode = 1;
