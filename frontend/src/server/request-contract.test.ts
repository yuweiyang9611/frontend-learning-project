import { describe, expect, it } from 'vitest';
import { decodeIssueCreate } from '@/src/features/issues/runtime-contracts';
import { readJsonBody } from './request-contract';

function request(body: string, contentType = 'application/json') {
  return new Request('http://localhost/api/issues', {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body,
  });
}

describe('readJsonBody', () => {
  it('returns a structured 400 for malformed JSON', async () => {
    const result = await readJsonBody(request('{'), decodeIssueCreate);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      expect(await result.response.json()).toMatchObject({ title: 'Invalid request' });
    }
  });

  it.each(['null', '[]', '"issue"'])('returns 400 for the valid JSON root %s', async (body) => {
    const result = await readJsonBody(request(body), decodeIssueCreate);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(400);
  });

  it('rejects a request without a JSON content type', async () => {
    const result = await readJsonBody(request('{}', 'text/plain'), decodeIssueCreate);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(400);
  });

  it('returns the decoded payload for a valid request', async () => {
    const result = await readJsonBody(
      request(JSON.stringify({ title: 'Runtime decoder', status: 'open', priority: 'high', tags: [] })),
      decodeIssueCreate,
    );
    expect(result).toEqual({
      ok: true,
      value: { title: 'Runtime decoder', status: 'open', priority: 'high', tags: [] },
    });
  });
});
