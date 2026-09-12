import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrateDatabase } from './migrations.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = path.join(root, 'dist/server/wrangler.json');
const persist = process.env.ISSUEFLOW_D1_PERSIST_TO || path.join(root, '.wrangler/state');
if (!fs.existsSync(config)) {
  const build = spawnSync(process.execPath, [path.join(root, 'node_modules/vinext/dist/cli.js'), 'build'], {
    cwd: root,
    stdio: 'inherit',
    windowsHide: true,
  });
  if (build.status !== 0) {
    console.error('Build once with npm run build before applying local migrations.');
    process.exit(1);
  }
}
function execute(sql) {
  const result = spawnSync(
    process.execPath,
    [
      path.join(root, 'node_modules/wrangler/bin/wrangler.js'),
      'd1',
      'execute',
      'DB',
      '--local',
      '--config',
      config,
      '--persist-to',
      persist,
      '--command',
      sql,
      '--json',
    ],
    {
      cwd: root,
      encoding: 'utf8',
      windowsHide: true,
      env: { ...process.env, WRANGLER_SEND_METRICS: 'false', WRANGLER_WRITE_LOGS: 'false' },
      maxBuffer: 8 * 1024 * 1024,
    },
  );
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  const output = JSON.parse(result.stdout);
  return output.flatMap((item) => item.results ?? []);
}
console.log(
  await migrateDatabase({
    query: async (sql) => execute(sql),
    execute: async (sql) => {
      execute(sql);
    },
  }),
);
