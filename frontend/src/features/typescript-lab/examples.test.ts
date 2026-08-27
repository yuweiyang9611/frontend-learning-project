import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  applyPatch,
  classifyHttpStatus,
  decodeIssueInputPatch,
  decodeIssuePreview,
  decodeJson,
  decodeWireScalars,
  describeRemoteData,
  explainApiFailure,
  getIssueHeading,
  indexById,
  isIssueKey,
  labData,
  mapPage,
  nextIssueStatus,
  paginate,
  parseAssignmentIntent,
  parsePipelineOptions,
  priorityWeight,
  runIssuePipeline,
  statusMeta,
  toAssignmentPatch,
  updateField,
  type IssuePatch,
  type IssueSummary,
  type RemoteData,
} from './examples';
import { typescriptLessons } from './catalog';
import { ISSUE_STATUSES, type IssueInput, type IssueUpdate } from '@/src/features/issues/types';

describe('literal unions and exhaustive mappings', () => {
  it('covers every production status and advances through the workflow', () => {
    expect(Object.keys(statusMeta)).toEqual([...ISSUE_STATUSES]);
    expect(nextIssueStatus('open')).toBe('in_progress');
    expect(nextIssueStatus('closed')).toBe('open');
  });

  it('recognizes template literal issue keys', () => {
    expect(isIssueKey('IF-248')).toBe(true);
    expect(isIssueKey('IF-0')).toBe(false);
    expect(isIssueKey('issue-248')).toBe(false);
  });
});

describe('optional and nullable patch semantics', () => {
  it('distinguishes omitted, null, and numeric assignment values', () => {
    expect(toAssignmentPatch({ kind: 'keep' })).toEqual({});
    expect(toAssignmentPatch({ kind: 'unassign' })).toEqual({ assigneeId: null });
    expect(toAssignmentPatch({ kind: 'assign', memberId: 2 })).toEqual({ assigneeId: 2 });
  });

  it('parses only explicit assignment commands', () => {
    expect(parseAssignmentIntent('assign:3')).toMatchObject({
      ok: true,
      value: { kind: 'assign', memberId: 3 },
    });
    expect(parseAssignmentIntent('assign:Maya')).toMatchObject({ ok: false });
  });
});

describe('generics and utility types', () => {
  it('paginates without mutating the source and preserves metadata when mapping', () => {
    const source = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const snapshot = structuredClone(source);
    const page = paginate(source, 2, 2);
    const mapped = mapPage(page, (item) => `#${item.id}`);

    expect(page.items).toEqual([{ id: 3 }]);
    expect(mapped).toEqual({ items: ['#3'], page: 2, pageSize: 2, total: 3 });
    expect(source).toEqual(snapshot);
  });

  it('indexes any structure with an id and applies immutable patches', () => {
    const values = [
      { id: 4, name: 'Maya' },
      { id: 7, name: 'Iris' },
    ];
    expect(indexById(values).get(7)?.name).toBe('Iris');
    expect(applyPatch(values[0], { name: 'Maya Chen' })).toEqual({ id: 4, name: 'Maya Chen' });
    expect(values[0].name).toBe('Maya');
  });

  it('keeps keyof field names linked to indexed value types', () => {
    const input: IssueInput = {
      title: 'Original',
      description: '',
      status: 'open',
      priority: 'low',
      assigneeId: null,
      tags: [],
      dueDate: null,
    };
    expect(updateField(input, 'priority', 'critical').priority).toBe('critical');
    expectTypeOf<IssuePatch>().toEqualTypeOf<IssueUpdate>();
    expectTypeOf<IssueSummary['status']>().toEqualTypeOf<(typeof ISSUE_STATUSES)[number]>();
  });
});

describe('unknown and runtime boundaries', () => {
  it('decodes a valid external issue preview', () => {
    const result = decodeIssuePreview({
      id: 248,
      key: 'IF-248',
      title: 'Safe boundary',
      status: 'open',
      priority: 'high',
      assignee: null,
    });
    expect(result).toMatchObject({ ok: true, value: { key: 'IF-248', assigneeName: null } });
  });

  it('reports invalid JSON and invalid enum values without throwing', () => {
    expect(decodeJson('{', decodeIssuePreview)).toMatchObject({ ok: false });
    expect(
      decodeIssuePreview({
        id: 1,
        key: 'IF-1',
        title: 'Unsafe status',
        status: 'blocked',
        priority: 'high',
        assignee: null,
      }),
    ).toMatchObject({ ok: false });
  });

  it('decodes validation overrides before calling the production validator', () => {
    expect(decodeIssueInputPatch({ title: 'Safe', status: 'open', dueDate: null })).toMatchObject({ ok: true });
    expect(decodeIssueInputPatch({ title: 42, status: 'blocked' })).toMatchObject({ ok: false });
    expect(typescriptLessons.find((lesson) => lesson.id === 'validation')?.run('{"title":42}')).toMatchObject({
      ok: false,
      title: 'Input rejected',
    });
  });

  it('distinguishes safe IDs, calendar dates, and offset timestamps', () => {
    expect(decodeWireScalars({ id: 248, dueDate: '2026-09-15', updatedAt: '2026-08-27T09:00:00+09:00' })).toMatchObject(
      { ok: true },
    );
    expect(decodeWireScalars({ id: 1, dueDate: '0001-01-01', updatedAt: '0001-01-01T00:00:00Z' })).toMatchObject({
      ok: true,
    });
    expect(
      decodeWireScalars({
        id: Number.MAX_SAFE_INTEGER + 1,
        dueDate: '2026-02-30',
        updatedAt: '2026-08-27T09:00:00',
      }),
    ).toMatchObject({ ok: false });
    expect(decodeWireScalars({ id: 1, dueDate: '0000-01-01', updatedAt: '2026-02-30T09:00:00Z' })).toMatchObject({
      ok: false,
    });
  });

  it('narrows discriminated remote data and API errors', () => {
    const state: RemoteData<number> = { state: 'success', data: 72 };
    expect(describeRemoteData(state)).toContain('72');
    expect(explainApiFailure(classifyHttpStatus(400))).toContain('parsed');
    expect(classifyHttpStatus(400, { title: ['Required'] })).toMatchObject({ kind: 'validation' });
    expect(explainApiFailure(classifyHttpStatus(404))).toContain('could not be found');
    expect(classifyHttpStatus(418)).toMatchObject({ kind: 'client_http' });
    expect(explainApiFailure(classifyHttpStatus(503))).toContain('503');
    expect(() => classifyHttpStatus(200)).toThrow(RangeError);
  });
});

describe('typed Issue pipeline', () => {
  it('rejects unsafe options before filtering', () => {
    expect(parsePipelineOptions({ status: 'blocked' })).toMatchObject({ ok: false });
    expect(parsePipelineOptions({ page: '2' })).toMatchObject({ ok: false });
    expect(parsePipelineOptions({ page: -1 })).toMatchObject({ ok: false });
    expect(parsePipelineOptions({ pageSize: 101 })).toMatchObject({ ok: false });
    expect(parsePipelineOptions({ status: 'open', sortDirection: 'asc' })).toMatchObject({
      ok: true,
      value: { status: 'open', sortDirection: 'asc' },
    });
  });

  it('filters, sorts, projects, and pages without changing seed data', () => {
    const before = labData.issues.map((issue) => issue.id);
    const result = runIssuePipeline(labData.issues, {
      status: 'open',
      sortBy: 'priority',
      sortDirection: 'desc',
      page: 1,
      pageSize: 4,
    });

    expect(result.items).toHaveLength(4);
    expect(result.items.every((issue) => issue.status === 'open')).toBe(true);
    const weights = result.items.map((issue) => priorityWeight[issue.priority]);
    expect(weights).toEqual([...weights].sort((left, right) => right - left));
    expect(labData.issues.map((issue) => issue.id)).toEqual(before);
  });
});

describe('lesson catalog', () => {
  it('contains unique ordered lessons whose default runners are safe', () => {
    expect(typescriptLessons).toHaveLength(12);
    expect(new Set(typescriptLessons.map((lesson) => lesson.id)).size).toBe(typescriptLessons.length);
    expect(typescriptLessons.map((lesson) => lesson.order)).toEqual(
      Array.from({ length: typescriptLessons.length }, (_, index) => index + 1),
    );
    for (const lesson of typescriptLessons) {
      expect(() => lesson.run(lesson.defaultInput)).not.toThrow();
    }
    expect(typescriptLessons.find((lesson) => lesson.id === 'unknown-state-errors')?.run('200')).toMatchObject({
      ok: false,
    });
  });

  it('uses real IssueFlow structures in structural examples', () => {
    expect(getIssueHeading(labData.issues[0])).toContain('IF-');
  });
});
