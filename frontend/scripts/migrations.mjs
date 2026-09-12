import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const migrations = readdirSync(path.join(root, 'drizzle'))
  .filter((name) => name.endsWith('.sql'))
  .sort()
  .map((name) => {
    const sql = readFileSync(path.join(root, 'drizzle', name), 'utf8');
    return { name, sql, checksum: createHash('sha256').update(sql.replaceAll('\r\n', '\n')).digest('hex') };
  });
export const schemaQuery =
  "SELECT name,type,sql FROM sqlite_schema WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY name";
const ignored = new Set(['_issueflow_migrations', 'd1_migrations', '__drizzle_migrations']);
const signature = (rows) =>
  JSON.stringify(
    rows
      .filter((r) => !ignored.has(r.name) && !r.name.startsWith('_cf_'))
      .map((r) => ({
        name: r.name,
        type: r.type,
        sql: r.sql
          .toLowerCase()
          .replace(/if not exists/g, '')
          .replace(/[`"\[\]\s;]/g, ''),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
function knownSchemas() {
  const results = [];
  for (const legacy of [false, true]) {
    const db = new DatabaseSync(':memory:');
    const first = legacy
      ? JSON.parse(readFileSync(path.join(root, 'scripts/fixtures/legacy-schema.json'), 'utf8')).join(';')
      : migrations[0].sql;
    db.exec(first);
    results.push({ count: 1, signature: signature(db.prepare(schemaQuery).all()) });
    for (let i = 1; i < migrations.length; i++) {
      db.exec(migrations[i].sql);
      results.push({ count: i + 1, signature: signature(db.prepare(schemaQuery).all()) });
    }
    db.close();
  }
  return results;
}
export async function migrateDatabase(adapter) {
  const schema = await adapter.query(schemaQuery);
  const hasLedger = schema.some((row) => row.name === '_issueflow_migrations');
  let applied = hasLedger ? await adapter.query('SELECT name,checksum FROM _issueflow_migrations ORDER BY name') : [];
  for (let i = 0; i < applied.length; i++) {
    if (applied[i].name !== migrations[i]?.name || applied[i].checksum !== migrations[i]?.checksum)
      throw new Error('Migration history/checksum mismatch. Restore the original migration files; no changes applied.');
  }
  if (!hasLedger && signature(schema) !== '[]') {
    const known = knownSchemas().find((candidate) => candidate.signature === signature(schema));
    if (!known)
      throw new Error(
        'Unknown legacy database schema. Back up and inspect this database; automatic baselining refused.',
      );
    applied = migrations.slice(0, known.count);
  }
  // Every SQL file and its ledger entry execute in the adapter's same transaction.
  await adapter.execute(
    'CREATE TABLE IF NOT EXISTS _issueflow_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL);',
  );
  for (const migration of applied)
    await adapter.execute(
      `INSERT OR IGNORE INTO _issueflow_migrations VALUES ('${migration.name}','${migration.checksum}');`,
    );
  for (const migration of migrations.slice(applied.length)) {
    await adapter.execute(
      migration.sql + `\nINSERT INTO _issueflow_migrations VALUES ('${migration.name}','${migration.checksum}');`,
    );
  }
  return { applied: migrations.length - applied.length, total: migrations.length };
}
export function sqliteAdapter(db) {
  return {
    query: async (sql) => db.prepare(sql).all(),
    execute: async (sql) => {
      db.exec('BEGIN');
      try {
        db.exec(sql);
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
  };
}
