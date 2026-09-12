import { describe, it, expect } from 'vitest';
import { seedIssues, seedMembers } from '@/src/data/seed';
import { createOverview } from './overview';
import { decodeOverview, decodePreferences, decodeProfileInput, decodeSettings } from './contracts';
const asOf = '2026-09-12T00:00:00.000Z';
describe('workspace overview', () => {
  it.each([0, 100, 101, 250])('counts every issue at size %i', (size) => {
    const issues = Array.from({ length: size }, (_, i) => ({
      ...seedIssues[0],
      id: i + 1,
      status: 'open' as const,
      updatedAt: asOf,
    }));
    const summary = createOverview(issues, seedMembers, asOf);
    expect(summary.total).toBe(size);
    expect(summary.byStatus.open).toBe(size);
    expect(summary.updatedLast7Days).toBe(size);
    expect(summary.recentIssues.map((i) => i.id)).toEqual(
      issues
        .slice(-6)
        .reverse()
        .map((i) => i.id),
    );
    expect(decodeOverview(summary).ok).toBe(true);
  });
  it('handles UTC boundaries, null assignees and untagged focus', () => {
    const issues = ['2026-09-05T00:00:00.000Z', '2026-09-04T23:59:59.999Z', '2026-09-12T00:00:00.001Z'].map(
      (updatedAt, i) => ({
        ...seedIssues[0],
        id: i + 1,
        updatedAt,
        assignee: null,
        tags: [],
        status: 'closed' as const,
      }),
    );
    const result = createOverview(issues, seedMembers, asOf);
    expect(result.updatedLast7Days).toBe(1);
    expect(result.activeAssignees).toBe(0);
    expect(result.focus.progress).toBe(0);
    expect(result.focus.relatedCount).toBe(0);
  });
  it('uses all matching tags, unique members and completed statuses', () => {
    const issues = seedIssues.slice(0, 3).map((issue, i) => ({
      ...issue,
      id: i + 1,
      updatedAt: asOf,
      tags: ['same'],
      status: i === 0 ? ('in_progress' as const) : i === 1 ? ('resolved' as const) : ('closed' as const),
      priority: 'critical' as const,
      assignee: seedMembers[0],
    }));
    const result = createOverview(issues, seedMembers, asOf);
    expect(result.focus.issue?.id).toBe(2);
    expect(result.focus.relatedCount).toBe(3);
    expect(result.focus.progress).toBe(67);
    expect(result.focus.members).toHaveLength(1);
    expect(result.activeAssignees).toBe(1);
  });
  it('rejects invalid boundary shapes', () => {
    for (const input of [
      null,
      {},
      [],
      { assigned: true, mentions: 'true', digest: false },
      { assigned: true, mentions: true, digest: false, role: 'Admin' },
    ])
      expect(decodePreferences(input).ok).toBe(false);
    expect(decodePreferences({ assigned: false, mentions: true, digest: false }).ok).toBe(true);
    for (const input of [
      null,
      {},
      [],
      { displayName: '' },
      { displayName: ' '.repeat(3) },
      { displayName: 'x'.repeat(101) },
      { displayName: 'OK', email: 'other' },
    ])
      expect(decodeProfileInput(input).ok).toBe(false);
    expect(decodeProfileInput({ displayName: ' New name ' })).toEqual({ ok: true, value: { displayName: 'New name' } });
    expect(decodeSettings(null).ok).toBe(false);
    expect(decodeSettings({ session: {}, notifications: {} }).ok).toBe(false);
    const valid = createOverview(seedIssues, seedMembers, asOf);
    for (const changed of [
      null,
      {},
      { ...valid, total: -1 },
      { ...valid, byStatus: { ...valid.byStatus, open: -1 } },
      { ...valid, total: 999 },
      { ...valid, recentIssues: [{}] },
      { ...valid, focus: { ...valid.focus, progress: 101 } },
      { ...valid, workloads: [{ memberId: 0, assigned: 1, inProgress: 1 }] },
    ])
      expect(decodeOverview(changed).ok).toBe(false);
  });
});
