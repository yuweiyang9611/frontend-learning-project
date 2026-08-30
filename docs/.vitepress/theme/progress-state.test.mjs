import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createProgress,
  decodeProgress,
  isSafeEvidenceUrl,
  mergeProgress,
  progressSummary,
} from './progress-state.mjs';

test('accepts HTTPS and relative evidence but rejects active protocols', () => {
  assert.equal(isSafeEvidenceUrl('https://github.com/example/commit/1'), true);
  assert.equal(isSafeEvidenceUrl('./evidence/day-01'), true);
  assert.equal(isSafeEvidenceUrl('javascript:alert(1)'), false);
  assert.equal(isSafeEvidenceUrl('data:text/html,unsafe'), false);
  assert.equal(isSafeEvidenceUrl('file:///secret'), false);
});

test('rejects duplicate, out-of-range, and incompatible imports', () => {
  const base = { app: 'issueflow-learning-progress', schemaVersion: 1, days: [] };
  assert.equal(decodeProgress({ ...base, schemaVersion: 2 }).ok, false);
  assert.equal(decodeProgress({ ...base, days: [{ day: 92, completed: false, completedAt: null }] }).ok, false);
  assert.equal(
    decodeProgress({
      ...base,
      days: [
        { day: 1, completed: false, completedAt: null },
        { day: 1, completed: true, completedAt: null },
      ],
    }).ok,
    false,
  );
});

test('merges completion without erasing existing evidence', () => {
  const current = createProgress();
  current.days[0] = {
    day: 1,
    completed: true,
    completedAt: '2026-08-01T00:00:00.000Z',
    minutes: 120,
    note: 'existing',
    evidence: [{ label: 'commit', url: 'https://github.com/example/1' }],
  };
  const imported = {
    ...createProgress(),
    days: [{ day: 1, completed: false, completedAt: null, minutes: 90, note: '', evidence: [] }],
  };
  const merged = mergeProgress(current, imported, false);
  assert.equal(merged.days[0].completed, true);
  assert.equal(merged.days[0].minutes, 120);
  assert.equal(merged.days[0].evidence.length, 1);
  assert.deepEqual(progressSummary(merged), { completed: 1, minutes: 120 });
});
