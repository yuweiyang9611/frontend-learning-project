import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { seedAttachments, seedComments, seedIssues, seedMembers } from '@/src/data/seed';
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
    expect(fetchMock).toHaveBeenCalledWith('/api/members', expect.objectContaining({ credentials: 'include' }));
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

  it('routes the complete mutation lifecycle through typed HTTP boundaries', async () => {
    const issue = seedIssues[0];
    const comment = seedComments[0];
    const attachment = seedAttachments[0];
    const session = {
      email: 'demo@issueflow.dev',
      displayName: 'Jordan Davis',
      initials: 'JD',
      role: 'Admin' as const,
    };
    const input = {
      title: 'Contract client lifecycle',
      description: 'Exercise every HTTP adapter.',
      status: 'open' as const,
      priority: 'high' as const,
      assigneeId: 2,
      tags: ['contract'],
      dueDate: null,
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ items: [issue], page: 1, pageSize: 10, total: 1 }))
      .mockResolvedValueOnce(Response.json(issue))
      .mockResolvedValueOnce(Response.json(issue, { status: 201 }))
      .mockResolvedValueOnce(Response.json({ ...issue, status: 'resolved' }))
      .mockResolvedValueOnce(Response.json([comment]))
      .mockResolvedValueOnce(Response.json(comment, { status: 201 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(Response.json([attachment]))
      .mockResolvedValueOnce(Response.json(attachment, { status: 201 }))
      .mockResolvedValueOnce(Response.json(session))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(issueflowApi.listIssues({ page: 1, pageSize: 10, search: 'session' })).resolves.toMatchObject({
      total: 1,
    });
    await expect(issueflowApi.getIssue(issue.id)).resolves.toEqual(issue);
    await expect(issueflowApi.createIssue(input)).resolves.toEqual(issue);
    await expect(issueflowApi.updateIssue(issue.id, { status: 'resolved' })).resolves.toMatchObject({
      status: 'resolved',
    });
    await expect(issueflowApi.getComments(issue.id)).resolves.toEqual([comment]);
    await expect(issueflowApi.addComment(issue.id, 'A useful comment')).resolves.toEqual(comment);
    await expect(issueflowApi.deleteComment(issue.id, comment.id)).resolves.toBeUndefined();
    await expect(issueflowApi.getAttachments(issue.id)).resolves.toEqual([attachment]);
    await expect(
      issueflowApi.uploadAttachment(issue.id, new File(['trace'], 'trace.txt', { type: 'text/plain' })),
    ).resolves.toEqual(attachment);
    await expect(issueflowApi.login(session.email, 'issueflow')).resolves.toEqual(session);
    expect(issueflowApi.getStoredSession()).toEqual(session);
    await expect(issueflowApi.logout()).resolves.toBeUndefined();
    expect(issueflowApi.getStoredSession()).toBeNull();
    await expect(issueflowApi.deleteIssue(issue.id)).resolves.toBeUndefined();

    expect(fetchMock.mock.calls[0][0]).toContain('/api/issues?');
    expect(fetchMock.mock.calls[2]).toEqual([
      '/api/issues',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(input) }),
    ]);
    expect(fetchMock.mock.calls[8][1]).toEqual(expect.objectContaining({ method: 'POST', body: expect.any(FormData) }));
  });

  it('restores valid sessions, signs out on 401, and falls back only for unavailable contracts', async () => {
    const session = {
      email: 'demo@issueflow.dev',
      displayName: 'Jordan Davis',
      initials: 'JD',
      role: 'Admin' as const,
    };
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(Response.json(session))
        .mockResolvedValueOnce(Response.json({ title: 'Authentication required', status: 401 }, { status: 401 }))
        .mockResolvedValueOnce(new Response('<html>offline</html>', { status: 200 })),
    );

    await expect(issueflowApi.restoreSession()).resolves.toEqual(session);
    expect(issueflowApi.getStoredSession()).toEqual(session);
    await expect(issueflowApi.restoreSession()).resolves.toBeNull();
    expect(issueflowApi.getStoredSession()).toBeNull();

    localStorage.setItem('issueflow-session', JSON.stringify(session));
    await expect(issueflowApi.restoreSession()).resolves.toEqual(session);
  });

  it('rejects 204 from endpoints whose contract requires a JSON document', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(issueflowApi.getMembers()).rejects.toBeInstanceOf(ContractDecodeError);
  });
});
