import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { seedMembers } from '@/src/data/seed';
import { ContractDecodeError } from '@/src/features/issues/runtime-contracts';
import { issueflowApi } from './issueflowApi';

describe('HTTP and stored-session runtime boundaries', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('decodes a valid JSON response before returning members', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(seedMembers));
    vi.stubGlobal('fetch', fetchMock);

    await expect(issueflowApi.getMembers()).resolves.toEqual(seedMembers);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/members',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('rejects successful responses with invalid JSON or an invalid wire shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response('<html>', { status: 200 }))
        .mockResolvedValueOnce(Response.json({ members: [] })),
    );

    await expect(issueflowApi.getMembers()).rejects.toBeInstanceOf(ContractDecodeError);
    await expect(issueflowApi.getMembers()).rejects.toBeInstanceOf(ContractDecodeError);
  });

  it('normalizes JSON and non-JSON HTTP failures without leaking response bodies', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json(
            { title: 'Validation failed', detail: 'Correct the request.', errors: { title: ['Required'] } },
            { status: 400 },
          ),
        )
        .mockResolvedValueOnce(new Response('<html>error</html>', { status: 503 })),
    );

    await expect(issueflowApi.getMembers()).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      message: 'Correct the request.',
      errors: { title: ['Required'] },
    });
    await expect(issueflowApi.getMembers()).rejects.toMatchObject({
      name: 'ApiError',
      status: 503,
      message: 'Request failed with status 503.',
    });
  });

  it('requires 204 for no-content operations', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response(null, { status: 204 }))
        .mockResolvedValueOnce(Response.json({ deleted: true })),
    );

    await expect(issueflowApi.deleteIssue(248)).resolves.toBeUndefined();
    await expect(issueflowApi.deleteIssue(248)).rejects.toBeInstanceOf(ContractDecodeError);
  });

  it('validates stored sessions and treats unavailable storage as signed out', () => {
    localStorage.setItem(
      'issueflow-session',
      JSON.stringify({ email: 'demo@issueflow.dev', displayName: 'Jordan Davis', initials: 'JD', role: 'Admin' }),
    );
    expect(issueflowApi.getStoredSession()).toMatchObject({ email: 'demo@issueflow.dev' });

    localStorage.setItem('issueflow-session', '{');
    expect(issueflowApi.getStoredSession()).toBeNull();

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage disabled', 'SecurityError');
    });
    expect(issueflowApi.getStoredSession()).toBeNull();
  });

  it('treats an anonymous 204 session probe as signed out without parsing a body', async () => {
    localStorage.setItem(
      'issueflow-session',
      JSON.stringify({ email: 'demo@issueflow.dev', displayName: 'Stale User', initials: 'SU', role: 'Admin' }),
    );
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await expect(issueflowApi.restoreSession()).resolves.toBeNull();
    expect(localStorage.getItem('issueflow-session')).toBeNull();
  });
});
