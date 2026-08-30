import test from 'node:test';
import assert from 'node:assert/strict';
import { filterIssues } from '../src/model.js';

const issues = [
  { id: 1, status: 'open' },
  { id: 2, status: 'resolved' },
];

test('empty status returns a copy of every issue', () => {
  const result = filterIssues(issues, '');
  assert.deepEqual(result, issues);
  assert.notEqual(result, issues);
});

test('status returns only matching issues without mutating the source', () => {
  assert.deepEqual(filterIssues(issues, 'resolved'), [{ id: 2, status: 'resolved' }]);
  assert.equal(issues.length, 2);
});
