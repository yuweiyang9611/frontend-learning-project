import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDatabase } from '@/src/server/issueflow-db';
import {
  authenticatedSession,
  createLocalSession,
  destroyLocalSession,
  isLocalRequest,
  requireMutationAccess,
} from './auth';

vi.mock('@/src/server/issueflow-db', () => ({ getDatabase: vi.fn() }));

const getDatabaseMock = vi.mocked(getDatabase);

function databaseFixture(row: unknown = null) {
  const first = vi.fn().mockResolvedValue(row);
  const run = vi.fn().mockResolvedValue({ success: true });
  const bind = vi.fn((...values: unknown[]) => {
    void values;
    return { first, run };
  });
  const prepare = vi.fn((query: string) => {
    void query;
    return { bind };
  });
  getDatabaseMock.mockResolvedValue({ prepare } as never);
  return { prepare, bind, first, run };
}

describe('same-origin authentication boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('trusts complete platform identity headers and decodes the display name', async () => {
    const request = new Request('https://issueflow.example/api/auth/session', {
      headers: {
        'oai-authenticated-user-email': ' MAYA@ISSUEFLOW.DEV ',
        'oai-authenticated-user-id': 'user-42',
        'oai-authenticated-user-full-name': 'Maya%20Chen',
        'oai-authenticated-user-full-name-encoding': 'percent-encoded-utf-8',
      },
    });

    await expect(authenticatedSession(request)).resolves.toEqual({
      email: 'maya@issueflow.dev',
      displayName: 'Maya Chen',
      initials: 'MC',
      role: 'Admin',
    });
    expect(getDatabaseMock).not.toHaveBeenCalled();
  });

  it('reads a non-expired local session cookie only on loopback hosts', async () => {
    const database = databaseFixture({
      email: 'demo@issueflow.dev',
      display_name: 'Jordan Davis',
      initials: 'JD',
    });
    const request = new Request('http://localhost/api/auth/session', {
      headers: { cookie: 'theme=dark; issueflow_local_session=local%3Dtoken' },
    });

    await expect(authenticatedSession(request)).resolves.toMatchObject({
      email: 'demo@issueflow.dev',
      role: 'Admin',
    });
    expect(database.prepare).toHaveBeenCalledWith(expect.stringContaining('FROM local_sessions'));
    expect(database.bind.mock.calls[0][0]).toMatch(/^[a-f0-9]{64}$/);

    await expect(
      authenticatedSession(
        new Request('https://issueflow.example/api/auth/session', {
          headers: { cookie: 'issueflow_local_session=local%3Dtoken' },
        }),
      ),
    ).resolves.toBeNull();
  });

  it('rejects cross-site mutations before authentication and returns Problem Details for anonymous requests', async () => {
    const crossSite = await requireMutationAccess(
      new Request('https://issueflow.example/api/issues', {
        headers: { origin: 'https://attacker.example' },
      }),
    );
    expect(crossSite).toBeInstanceOf(Response);
    expect((crossSite as Response).status).toBe(403);

    const anonymous = await requireMutationAccess(new Request('https://issueflow.example/api/issues'));
    expect(anonymous).toBeInstanceOf(Response);
    expect((anonymous as Response).status).toBe(401);

    const platform = await requireMutationAccess(
      new Request('https://issueflow.example/api/issues', {
        headers: {
          origin: 'https://issueflow.example',
          'oai-authenticated-user-email': 'demo@issueflow.dev',
          'oai-authenticated-user-id': 'admin-1',
        },
      }),
    );
    expect(platform).toMatchObject({ email: 'demo@issueflow.dev', role: 'Admin' });
  });

  it('creates and destroys hashed loopback sessions while emitting strict cookies', async () => {
    const database = databaseFixture();
    const request = new Request('http://127.0.0.1/api/auth/login');

    const created = await createLocalSession(request, 'demo@issueflow.dev', 'Jordan Davis');
    expect(created.session).toMatchObject({ email: 'demo@issueflow.dev', initials: 'JD' });
    expect(created.cookie).toContain('HttpOnly; SameSite=Strict; Path=/; Max-Age=28800');
    expect(database.prepare).toHaveBeenCalledTimes(2);
    expect(database.run).toHaveBeenCalledTimes(2);

    const token = created.cookie.match(/issueflow_local_session=([^;]+)/)?.[1];
    expect(token).toBeDefined();
    const cleared = await destroyLocalSession(
      new Request('http://127.0.0.1/api/auth/logout', {
        headers: { cookie: `issueflow_local_session=${token}` },
      }),
    );
    expect(cleared).toContain('Max-Age=0');
    expect(database.prepare).toHaveBeenCalledTimes(3);
    expect(database.run).toHaveBeenCalledTimes(3);
  });

  it('does not create local sessions remotely and recognizes loopback variants', async () => {
    await expect(
      createLocalSession(new Request('https://issueflow.example/api/auth/login'), 'demo@issueflow.dev', 'Demo'),
    ).rejects.toThrow('loopback');
    expect(isLocalRequest(new Request('http://localhost/api'))).toBe(true);
    expect(isLocalRequest(new Request('http://127.0.0.1/api'))).toBe(true);
    expect(isLocalRequest(new Request('https://issueflow.example/api'))).toBe(false);
    await expect(destroyLocalSession(new Request('http://localhost/api/auth/logout'))).resolves.toContain('Max-Age=0');
    expect(getDatabaseMock).not.toHaveBeenCalled();
  });
});
