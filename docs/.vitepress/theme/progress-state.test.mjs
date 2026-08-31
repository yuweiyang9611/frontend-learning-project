import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createProgress,
  decodeProgress,
  isSafeEvidenceUrl,
  mergeProgress,
  normalizeProgress,
  progressSummary,
  reconcileDayCompletion,
  revokeDayCompletion,
} from './progress-state.mjs';

test('accepts HTTPS and relative evidence but rejects active protocols', () => {
  assert.equal(isSafeEvidenceUrl('https://github.com/example/commit/1'), true);
  assert.equal(isSafeEvidenceUrl('./evidence/day-01'), true);
  assert.equal(isSafeEvidenceUrl('javascript:alert(1)'), false);
  assert.equal(isSafeEvidenceUrl('data:text/html,unsafe'), false);
  assert.equal(isSafeEvidenceUrl('file:///secret'), false);
});

test('rejects an incompatible envelope but isolates invalid Day records', () => {
  const base = {
    app: 'issueflow-learning-progress',
    schemaVersion: 1,
    days: [],
  };
  assert.equal(decodeProgress({ ...base, schemaVersion: 2 }).ok, false);
  const input = {
    ...base,
    days: [
      {
        day: 1,
        completed: false,
        completedAt: null,
        minutes: 45,
        note: '保留下来的有效学习记录',
        evidence: [],
      },
      { day: 92, completed: false, completedAt: null },
      { day: 1, completed: false, completedAt: null },
      { day: 2, completed: 'yes', completedAt: null },
      {
        day: 3,
        completed: false,
        completedAt: null,
        evidence: [{ label: 'unsafe', url: 'javascript:alert(1)' }],
      },
    ],
  };
  const decoded = decodeProgress(input);
  assert.equal(decoded.ok, true);
  assert.equal(decoded.value.days.length, 1);
  assert.equal(decoded.value.days[0].day, 1);
  assert.equal(decoded.value.days[0].minutes, 45);
  assert.equal(decoded.warnings.length, 4);

  const normalized = normalizeProgress(input);
  assert.equal(normalized.days.length, 91);
  assert.equal(normalized.days[0].minutes, 45);
  assert.equal(normalized.days[1].minutes, 0);
});

test('recovers a full export with one extra bad Day but rejects oversized input', () => {
  const withExtraBadDay = createProgress();
  withExtraBadDay.days.push({
    day: 92,
    completed: false,
    completedAt: null,
  });
  const recovered = decodeProgress(withExtraBadDay);
  assert.equal(recovered.ok, true);
  assert.equal(recovered.value.days.length, 91);
  assert.equal(recovered.warnings.length, 1);

  const oversized = {
    ...createProgress(),
    days: Array.from({ length: 183 }, () => null),
  };
  assert.equal(decodeProgress(oversized).ok, false);
});

test('keeps learning data but revokes invalid imported completion', () => {
  const base = { app: 'issueflow-learning-progress', schemaVersion: 1 };
  const incomplete = {
    day: 1,
    completed: true,
    completedAt: '2026-08-30T00:00:00.000Z',
    minutes: 120,
    note: 'too short',
    evidence: [],
  };
  const repaired = decodeProgress({ ...base, days: [incomplete] });
  assert.equal(repaired.ok, true);
  assert.equal(repaired.value.days[0].completed, false);
  assert.equal(repaired.value.days[0].completedAt, null);
  assert.equal(repaired.value.days[0].minutes, 120);
  assert.equal(repaired.warnings.length, 1);
  const complete = {
    ...incomplete,
    note: '完成了独立变体，并用测试输出证明了行为。',
    evidence: [{ label: 'report', url: './learning-evidence/day-01/report.json' }],
  };
  assert.equal(decodeProgress({ ...base, days: [complete] }).ok, true);
});

test('revokes completion when any completion requirement becomes invalid', () => {
  const complete = {
    day: 1,
    completed: true,
    completedAt: '2026-08-30T00:00:00.000Z',
    minutes: 120,
    note: '完成独立变体并记录测试输出、结论与后续风险。',
    evidence: [{ label: 'report', url: './evidence/day-01' }],
  };
  assert.equal(reconcileDayCompletion(complete).completed, true);
  const editedButStillEligible = revokeDayCompletion({
    ...complete,
    note: '修改后的复盘仍然足够详细，但必须由学习者重新确认完成。',
  });
  assert.equal(editedButStillEligible.completed, false);
  assert.equal(editedButStillEligible.completedAt, null);
  for (const patch of [{ minutes: 119 }, { note: '不足二十字' }, { evidence: [] }]) {
    const reconciled = reconcileDayCompletion({ ...complete, ...patch });
    assert.equal(reconciled.completed, false);
    assert.equal(reconciled.completedAt, null);
  }
});

test('merges completion without erasing existing evidence', () => {
  const current = createProgress();
  current.days[0] = {
    day: 1,
    completed: true,
    completedAt: '2026-08-01T00:00:00.000Z',
    minutes: 120,
    note: '已有复盘足够详细，包含验证输出、关键结论和后续风险。',
    evidence: [{ label: 'commit', url: 'https://github.com/example/1' }],
  };
  const imported = {
    ...createProgress(),
    days: [
      {
        day: 1,
        completed: false,
        completedAt: null,
        minutes: 90,
        note: '',
        evidence: [],
      },
    ],
  };
  const merged = mergeProgress(current, imported, false);
  assert.equal(merged.days[0].completed, true);
  assert.equal(merged.days[0].minutes, 120);
  assert.equal(merged.days[0].evidence.length, 1);
  assert.equal(decodeProgress(merged).ok, true);
  assert.deepEqual(progressSummary(merged), { completed: 1, minutes: 120 });
});

test('merge always returns decodable progress and isolates a corrupt Day', () => {
  const current = createProgress();
  current.days[0] = {
    day: 1,
    completed: true,
    completedAt: '2026-08-01T00:00:00.000Z',
    minutes: 120,
    note: '有效复盘包含实现、验证输出、遇到的卡点和下一步计划。',
    evidence: [{ label: 'report', url: './evidence/day-01' }],
  };
  current.days[1] = {
    day: 2,
    completed: false,
    completedAt: null,
    minutes: 2000,
    note: '损坏记录',
    evidence: [],
  };
  const imported = createProgress();
  imported.days[2] = {
    day: 3,
    completed: true,
    completedAt: '2026-08-03T00:00:00.000Z',
    minutes: 30,
    note: '未满足门槛',
    evidence: [],
  };

  const merged = mergeProgress(current, imported, false);
  const decoded = decodeProgress(merged);
  assert.equal(decoded.ok, true);
  assert.equal(decoded.warnings.length, 0);
  assert.equal(merged.days.length, 91);
  assert.equal(merged.days[0].completed, true);
  assert.deepEqual(merged.days[1], createProgress().days[1]);
  assert.equal(merged.days[2].completed, false);
  assert.equal(merged.days[2].minutes, 30);

  const replaced = mergeProgress(current, imported, true);
  assert.equal(decodeProgress(replaced).ok, true);
  assert.deepEqual(replaced.days[0], createProgress().days[0]);
  assert.equal(replaced.days[2].minutes, 30);
});
