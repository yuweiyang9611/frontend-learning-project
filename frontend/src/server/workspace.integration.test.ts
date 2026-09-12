import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
let sqlite: DatabaseSync;
beforeEach(async () => {
  vi.resetModules();
  sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys=ON');
  for (const f of readdirSync('drizzle')
    .filter((n) => n.endsWith('.sql'))
    .sort())
    sqlite.exec(readFileSync('drizzle/' + f, 'utf8'));
  const { env } = await import('cloudflare:workers');
  function prepare(sql: string) {
    let values: unknown[] = [];
    const prepared = {
      bind: (...args: unknown[]) => {
        values = args;
        return prepared;
      },
      first: async () => sqlite.prepare(sql).get(...(values as never[])) ?? null,
      all: async () => ({ results: sqlite.prepare(sql).all(...(values as never[])) }),
      run: async () => ({ success: true, meta: sqlite.prepare(sql).run(...(values as never[])) }),
    };
    return prepared;
  }
  Object.assign(env, {
    DB: {
      prepare,
      batch: async (statements: { run: () => Promise<unknown> }[]) => {
        sqlite.exec('BEGIN');
        try {
          const result = [];
          for (const s of statements) result.push(await s.run());
          sqlite.exec('COMMIT');
          return result;
        } catch (e) {
          sqlite.exec('ROLLBACK');
          throw e;
        }
      },
    },
  });
});
afterEach(() => sqlite.close());
function request(path: string, method = 'GET', body?: unknown, user = 'alice') {
  return new Request('https://issueflow.test' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'oai-authenticated-user-id': user,
      'oai-authenticated-user-email': user + '@example.com',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
it('routes persist settings, isolate identities and update member attribution', async () => {
  const settings = await import('../../app/api/me/settings/route');
  const profile = await import('../../app/api/me/profile/route');
  const preferences = await import('../../app/api/me/preferences/route');
  let a = await settings.GET(request('/api/me/settings'));
  expect(a.status).toBe(200);
  expect(await a.json()).toMatchObject({ notifications: { assigned: true, mentions: true, digest: false } });
  const result = await profile.PATCH(request('/api/me/profile', 'PATCH', { displayName: ' Alice Updated ' }));
  expect(result.status).toBe(200);
  expect(await result.json()).toMatchObject({ initials: 'AU' });
  await preferences.PUT(request('/api/me/preferences', 'PUT', { assigned: false, mentions: false, digest: true }));
  a = await settings.GET(request('/api/me/settings'));
  expect(await a.json()).toMatchObject({ session: { displayName: 'Alice Updated' }, notifications: { digest: true } });
  const b = await settings.GET(request('/api/me/settings', 'GET', undefined, 'ada'));
  expect(await b.json()).toMatchObject({
    session: { displayName: 'ada@example.com' },
    notifications: { digest: false },
  });
  expect(sqlite.prepare('SELECT COUNT(*) AS n FROM user_settings').get()?.n).toBe(2);
  expect(sqlite.prepare('SELECT display_name FROM members WHERE id=1').get()?.display_name).not.toBe('Alice Updated');
  const issues = await import('../../app/api/issues/route');
  const created = await issues.POST(
    request('/api/issues', 'POST', {
      title: 'Owned by Alice',
      description: '',
      status: 'open',
      priority: 'low',
      tags: [],
      assigneeId: null,
      dueDate: null,
    }),
  );
  expect(created.status).toBe(201);
  expect(await created.json()).toMatchObject({ reporter: { displayName: 'Alice Updated' } });
  const session = await import('../../app/api/auth/session/route');
  expect(await (await session.GET(request('/api/auth/session'))).json()).toMatchObject({
    displayName: 'Alice Updated',
  });
});
it('rejects anonymous, cross-origin and invalid setting writes', async () => {
  const profile = await import('../../app/api/me/profile/route');
  const preferences = await import('../../app/api/me/preferences/route');
  const settings = await import('../../app/api/me/settings/route');
  expect((await settings.GET(new Request('https://issueflow.test/api/me/settings'))).status).toBe(401);
  expect((await profile.PATCH(new Request('https://issueflow.test/api/me/profile', { method: 'PATCH' }))).status).toBe(
    401,
  );
  for (const body of [
    { displayName: '' },
    { displayName: 'x'.repeat(101) },
    { displayName: 'Good', role: 'Admin' },
    null,
  ])
    expect((await profile.PATCH(request('/api/me/profile', 'PATCH', body))).status).toBe(400);
  expect(
    (await preferences.PUT(request('/api/me/preferences', 'PUT', { assigned: 'true', mentions: true, digest: false })))
      .status,
  ).toBe(400);
  const cross = request('/api/me/profile', 'PATCH', { displayName: 'Name' });
  cross.headers.set('origin', 'https://other.example');
  expect((await profile.PATCH(cross)).status).toBe(403);
});
it('counts beyond 100 and never reseeds an intentionally emptied database after restart', async () => {
  const api = await import('./issueflow-db');
  await api.getDatabase();
  sqlite.exec('DELETE FROM attachments; DELETE FROM comments; DELETE FROM issues');
  const insert = sqlite.prepare(
    "INSERT INTO issues (issue_key,title,description,status,priority,reporter_id,tags_json,created_at,updated_at) VALUES (?,?,'','open','low',1,'[]',?,?)",
  );
  for (let i = 1; i <= 250; i++) insert.run('IF-' + i, 'Item ' + i, new Date().toISOString(), new Date().toISOString());
  const route = await import('../../app/api/workspace/overview/route');
  const overview = await (await route.GET()).json();
  expect(overview).toMatchObject({ total: 250, byStatus: { open: 250 } });
  expect(overview).toHaveProperty('recentIssues.length', 6);
  sqlite.exec('DELETE FROM issues');
  // Re-import simulates a new Worker isolate with the same durable database.
  const { env } = await import('cloudflare:workers');
  const saved = env.DB;
  vi.resetModules();
  Object.assign((await import('cloudflare:workers')).env, { DB: saved });
  await (await import('./issueflow-db')).getDatabase();
  expect(sqlite.prepare('SELECT COUNT(*) AS n FROM issues').get()?.n).toBe(0);
});

it('seed failure rolls back all rows and a retry completes atomically', async () => {
  sqlite.exec("CREATE TRIGGER fail_seed BEFORE INSERT ON issues BEGIN SELECT RAISE(ABORT,'seed unavailable'); END");
  const api = await import('./issueflow-db');
  await expect(api.getDatabase()).rejects.toThrow('seed unavailable');
  expect(sqlite.prepare('SELECT COUNT(*) AS n FROM members').get()?.n).toBe(0);
  expect(sqlite.prepare('SELECT COUNT(*) AS n FROM app_metadata').get()?.n).toBe(0);
  sqlite.exec('DROP TRIGGER fail_seed');
  await api.getDatabase();
  expect(sqlite.prepare('SELECT COUNT(*) AS n FROM issues').get()?.n).toBeGreaterThan(0);
});
it('links loopback demo and existing members explicitly, refusing a claimed identity', async () => {
  const auth = await import('./auth');
  const settings = await import('./settings');
  const created = await auth.createLocalSession(
    new Request('http://localhost/api/auth/login'),
    'demo@issueflow.dev',
    'Jordan Davis',
  );
  const local = new Request('http://localhost/api/me/settings', { headers: { cookie: created.cookie.split(';')[0] } });
  const linked = await settings.currentSettings(local);
  expect(linked).toMatchObject({ subject: 'local:demo', memberId: 1 });
  const existing = request('/api/me/settings');
  existing.headers.set('oai-authenticated-user-email', 'maya@issueflow.dev');
  expect(await settings.currentSettings(existing)).toMatchObject({ memberId: 2 });
  const claimed = request('/api/me/settings', 'GET', undefined, 'second');
  claimed.headers.set('oai-authenticated-user-email', 'maya@issueflow.dev');
  expect(((await settings.currentSettings(claimed)) as Response).status).toBe(409);
});
