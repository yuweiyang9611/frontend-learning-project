import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { migrateDatabase, migrations, sqliteAdapter, schemaQuery } from './migrations.mjs';
for (const source of ['empty', 'migration', 'legacy'])
  test(source + ' database upgrades idempotently and retains related rows', async () => {
    const db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys=ON');
    if (source !== 'empty') {
      db.exec(
        source === 'legacy'
          ? JSON.parse(readFileSync(new URL('./fixtures/legacy-schema.json', import.meta.url), 'utf8')).join(';')
          : migrations[0].sql,
      );
      db.exec(
        "INSERT INTO members VALUES(1,'One','ada@example.com',NULL,'Admin','O','green'); INSERT INTO issues VALUES(1,'IF-1','Original','','open','low',1,1,'[]',NULL,'2026-01-01','2026-01-01'); INSERT INTO comments VALUES(1,1,1,'Keep me','2026-01-01'); INSERT INTO attachments VALUES(1,1,'object','a.txt','text/plain',1,'2026-01-01');",
      );
    }
    await migrateDatabase(sqliteAdapter(db));
    assert.equal((await migrateDatabase(sqliteAdapter(db))).applied, 0);
    if (source !== 'empty') {
      assert.equal(db.prepare('SELECT COUNT(*) AS n FROM comments').get().n, 1);
      assert.equal(db.prepare('SELECT object_key FROM attachments').get().object_key, 'object');
    }
    db.exec("INSERT INTO members VALUES(99,'Other','ALICE@example.com',NULL,'Admin','O','green')");
    assert.throws(
      () => db.exec("INSERT INTO members VALUES(100,'Duplicate','alice@EXAMPLE.com',NULL,'Admin','O','green')"),
      /UNIQUE/,
    );
    assert.throws(
      () =>
        db.exec(
          "INSERT INTO issues VALUES(100,'IF-100','Bad','','unknown','low',NULL,99,'[]',NULL,'2026-01-01','2026-01-01')",
        ),
      /CHECK/,
    );
    if (source !== 'empty') {
      assert.throws(() => db.exec("UPDATE issues SET priority='urgent'"), /CHECK/);
      assert.throws(
        () =>
          db.exec(
            "INSERT INTO issues SELECT 2,'IF-2','original',description,status,priority,assignee_id,reporter_id,tags_json,due_date,created_at,updated_at FROM issues WHERE id=1",
          ),
        /UNIQUE/,
      );
      db.exec('DELETE FROM issues');
      assert.equal(db.prepare('SELECT COUNT(*) AS n FROM comments').get().n, 0);
    }
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    db.close();
  });
test('refuses unknown schemas and altered migration history without changing data', async () => {
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE surprise(id INTEGER)');
  const before = db.prepare(schemaQuery).all();
  await assert.rejects(migrateDatabase(sqliteAdapter(db)), /Unknown legacy/);
  assert.deepEqual(db.prepare(schemaQuery).all(), before);
  db.close();
  const known = new DatabaseSync(':memory:');
  await migrateDatabase(sqliteAdapter(known));
  known.exec("UPDATE _issueflow_migrations SET checksum='bad'");
  await assert.rejects(migrateDatabase(sqliteAdapter(known)), /checksum mismatch/);
  known.close();
});
