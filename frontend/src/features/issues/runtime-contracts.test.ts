import { describe, expect, it } from 'vitest';
import { seedAttachments, seedComments, seedIssues, seedMembers } from '@/src/data/seed';
import {
  decodeAttachment,
  decodeAttachments,
  decodeComment,
  decodeComments,
  decodeIssue,
  decodeIssueCreate,
  decodeIssueUpdate,
  decodeLocalDatabase,
  decodeMembers,
  decodePagedIssues,
  decodeProblemDetails,
  decodeSession,
  unwrapDecoded,
} from './runtime-contracts';
import { isCalendarDate } from './types';

describe('calendar date contract', () => {
  it.each(['2024-02-29', '2026-12-31'])('accepts the real date %s', (value) => {
    expect(isCalendarDate(value)).toBe(true);
  });

  it.each(['2023-02-29', '2026-02-30', '2026-13-01', '2026-1-01', '2026-01-01T00:00:00Z'])(
    'rejects the invalid calendar value %s',
    (value) => {
      expect(isCalendarDate(value)).toBe(false);
    },
  );
});

describe('issue mutation decoders', () => {
  it.each([null, [], 'issue', 42])('rejects a non-object request body', (value) => {
    const result = decodeIssueCreate(value);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.body).toBeDefined();
  });

  it('collects invalid enum, array, identifier, and date fields', () => {
    const result = decodeIssueCreate({
      title: 'Runtime boundaries',
      status: 'blocked',
      priority: 1,
      assigneeId: -2,
      tags: ['typescript', 3],
      dueDate: '2026-02-30',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual([
        'assigneeId',
        'dueDate',
        'priority',
        'status',
        'tags',
      ]);
    }
  });

  it('preserves partial PATCH semantics after validation', () => {
    expect(decodeIssueUpdate({ status: 'in_progress', dueDate: null })).toEqual({
      ok: true,
      value: { status: 'in_progress', dueDate: null },
    });
  });
});

describe('response and storage decoders', () => {
  it('accepts the seeded public contracts', () => {
    expect(decodeIssue(seedIssues[0]).ok).toBe(true);
    expect(
      decodeLocalDatabase({
        issues: seedIssues,
        members: seedMembers,
        comments: seedComments,
        attachments: seedAttachments,
      }).ok,
    ).toBe(true);
  });

  it('decodes the complete list, paging, comment, and attachment response families', () => {
    expect(decodeMembers(seedMembers).ok).toBe(true);
    expect(decodeComments(seedComments).ok).toBe(true);
    expect(decodeAttachments(seedAttachments).ok).toBe(true);
    expect(decodeComment(seedComments[0]).ok).toBe(true);
    expect(decodeAttachment(seedAttachments[0]).ok).toBe(true);
    expect(
      decodePagedIssues({ items: seedIssues.slice(0, 2), page: 1, pageSize: 2, total: seedIssues.length }).ok,
    ).toBe(true);
  });

  it('rejects a damaged nested item at every collection boundary', () => {
    expect(decodeMembers([{ ...seedMembers[0], role: 'Owner' }]).ok).toBe(false);
    expect(decodeComments([{ ...seedComments[0], issueId: 0 }]).ok).toBe(false);
    expect(decodeAttachments([{ ...seedAttachments[0], size: -1 }]).ok).toBe(false);
    expect(decodePagedIssues({ items: 'issues', page: 0, pageSize: 0, total: -1 }).ok).toBe(false);
  });

  it('allows forward-compatible response fields but rejects invalid required fields', () => {
    expect(decodeIssue({ ...seedIssues[0], serverCapability: 'future' }).ok).toBe(true);
    expect(decodeIssue({ ...seedIssues[0], reporter: null }).ok).toBe(false);
    expect(decodeIssue({ ...seedIssues[0], createdAt: 'yesterday' }).ok).toBe(false);
  });

  it('rejects damaged nested local data instead of trusting JSON.parse', () => {
    expect(
      decodeLocalDatabase({
        issues: [{ ...seedIssues[0], status: 'blocked' }],
        members: seedMembers,
        comments: seedComments,
        attachments: seedAttachments,
      }).ok,
    ).toBe(false);
  });

  it('validates a stored session', () => {
    expect(
      decodeSession({
        email: 'demo@issueflow.dev',
        displayName: 'Jordan Davis',
        initials: 'JD',
        role: 'Admin',
      }).ok,
    ).toBe(true);
    expect(decodeSession({ email: 'demo@issueflow.dev', role: 'Owner' }).ok).toBe(false);
  });

  it('keeps only field-error arrays from Problem Details', () => {
    expect(
      decodeProblemDetails({
        title: 'Validation failed',
        status: 400,
        errors: { title: ['Required'], hidden: 'not-an-array' },
      }),
    ).toEqual({
      ok: true,
      value: { title: 'Validation failed', status: 400, errors: { title: ['Required'] } },
    });
  });

  it('throws a redacted contract error when an expected response cannot be unwrapped', () => {
    expect(() => unwrapDecoded(decodeSession({ role: 'Owner' }), 'Session')).toThrow(
      'Session did not match the expected runtime contract.',
    );
  });
});
