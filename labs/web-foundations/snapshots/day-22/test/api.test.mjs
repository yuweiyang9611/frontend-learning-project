import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchIssues } from '../src/api.js';

test('returns the decoded array from a successful response', async () => {
  const result = await fetchIssues(async () => ({ ok: true, json: async () => [{ id: 1 }] }), '/fixture');
  assert.deepEqual(result, [{ id: 1 }]);
});

test('reports HTTP failures before reading JSON', async () => {
  await assert.rejects(
    fetchIssues(async () => ({ ok: false, status: 500, json: async () => [] }), '/fixture'),
    /status 500/,
  );
});

test('rejects a successful response with the wrong shape', async () => {
  await assert.rejects(
    fetchIssues(async () => ({ ok: true, json: async () => ({ items: [] }) }), '/fixture'),
    /issue array/,
  );
});
