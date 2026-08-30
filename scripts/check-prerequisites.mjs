import { spawnSync } from 'node:child_process';

const checks = [
  { name: 'Node.js', command: 'node', args: ['--version'], required: /^v(2[2-9]|[3-9]\d)\./ },
  { name: 'npm', command: 'npm', args: ['--version'] },
  { name: 'Git', command: 'git', args: ['--version'] },
  { name: '.NET SDK', command: 'dotnet', args: ['--version'] },
];

let failed = false;
for (const check of checks) {
  const result = spawnSync(check.command, check.args, { encoding: 'utf8', shell: false });
  const output = (result.stdout || result.stderr || '').trim();
  const valid = result.status === 0 && (!check.required || check.required.test(output));
  console.log(valid ? 'PASS' : 'FAIL', check.name.padEnd(10), output || 'not found');
  failed ||= !valid;
}

if (failed) {
  console.error('\nInstall or repair the failed prerequisite, open a new terminal, then run npm run learn:check again.');
  process.exitCode = 1;
} else {
  console.log('\nYour machine is ready for the guided workspaces.');
}
