export const EXERCISE_IDS = [
  'B01',
  'B02',
  'B03',
  'B04',
  'B05',
  'B06',
  'B07',
  'B08',
  'B09',
  'A01',
  'A02',
  'A03',
  'A04',
  'A05',
  'A06',
  'A07',
  'A08',
  'A09',
  'C01',
  'C02',
  'C03',
  'C04',
  'C05',
  'C06',
  'C07',
  'C08',
  'C09',
] as const;

export type ExerciseId = (typeof EXERCISE_IDS)[number];

export const EXERCISE_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
export type ExerciseStatus = (typeof EXERCISE_STATUSES)[number];

export interface PagedResult<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
}

export interface IssueListItem {
  readonly id: number;
  readonly status: ExerciseStatus;
}

export type RemoteData<T> =
  | { readonly kind: 'idle' }
  | { readonly kind: 'loading' }
  | { readonly kind: 'success'; readonly value: T }
  | { readonly kind: 'error'; readonly message: string };

export interface IssueSource {
  readonly id: number;
  readonly title: string;
  readonly status: ExerciseStatus;
  readonly description?: string;
}

export type IssuePreview = Pick<IssueSource, 'id' | 'title' | 'status'>;

export interface IssueEditableFields {
  readonly title: string;
  readonly dueDate: string | null;
  readonly status: ExerciseStatus;
}

export type ExerciseFieldErrors = Partial<Record<keyof IssueEditableFields, readonly string[]>>;

export type AtLeastOne<T extends object> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Omit<T, K>>;
}[keyof T];

export type PreviewDecodeResult =
  { readonly ok: true; readonly value: IssuePreview } | { readonly ok: false; readonly path: string };

export type PreviewArrayDecodeResult =
  | { readonly ok: true; readonly values: readonly IssuePreview[] }
  | { readonly ok: false; readonly paths: readonly string[] };

export type LabLessonId = 'literal-unions' | 'runtime-decoder' | 'wire-scalars';
export type ProblemClassification = 'validation' | 'not-found' | 'server' | 'unknown';

export interface HttpExerciseInput {
  readonly status: number;
  readonly body: unknown;
}

export type HttpExerciseResult =
  | { readonly kind: 'json'; readonly value: unknown }
  | { readonly kind: 'no-content' }
  | { readonly kind: 'problem'; readonly status: number };

export interface PageMapperSolution {
  <T, U>(input: PagedResult<T> & { readonly map: (value: T) => U }): PagedResult<U>;
  (
    input:
      | (PagedResult<string> & { readonly operation: 'length' })
      | (PagedResult<{ readonly title: string }> & { readonly operation: 'title' }),
  ): PagedResult<number> | PagedResult<string>;
}

/** Precise public signatures for all 27 learner implementations. */
export interface ExerciseSignatures {
  B01(input: { readonly stable: boolean; readonly value: string | number }): string;
  B02(input: { readonly id: number; readonly displayName: string }): string | null;
  B03(input: { readonly value?: string | null }): string;
  B04(input: ExerciseStatus): string;
  B05(input: ExerciseStatus): string;
  B06(input: unknown): input is ExerciseStatus;
  B07(input: {
    readonly items: readonly IssueListItem[];
    readonly id: number;
    readonly status: ExerciseStatus;
  }): readonly IssueListItem[];
  B08(input: unknown): string;
  B09<T>(input: RemoteData<T>): string;
  A01<T>(input: { readonly items: readonly T[]; readonly page: number; readonly pageSize: number }): PagedResult<T>;
  A02: PageMapperSolution;
  A03<K extends PropertyKey, T extends Record<K, PropertyKey>>(input: {
    readonly items: readonly T[];
    readonly key: K;
  }): readonly (readonly [T[K], T])[];
  A04<K extends PropertyKey, T extends Record<K, PropertyKey> & { readonly id: PropertyKey }>(input: {
    readonly items: readonly T[];
    readonly key: K;
  }): Record<string, Array<T['id']>>;
  A05<T, K extends keyof T>(input: { readonly object: T; readonly key: K; readonly value: T[K] }): T;
  A06(input: IssueSource | ExerciseFieldErrors): IssuePreview | ExerciseFieldErrors;
  A07(input: AtLeastOne<IssueEditableFields>): boolean;
  A08(input: unknown): PreviewDecodeResult;
  A09(input: unknown): PreviewArrayDecodeResult;
  C01(input: unknown): boolean;
  C02(input: unknown): { readonly decoded: boolean; readonly valid: boolean };
  C03(input: string): string;
  C04(input: unknown): readonly LabLessonId[];
  C05(input: unknown): boolean;
  C06(input: unknown): ProblemClassification;
  C07(input: HttpExerciseInput): HttpExerciseResult;
  C08(input: unknown): ExerciseStatus | null;
  C09(input: {
    readonly items: readonly IssueListItem[];
    readonly id: number;
    readonly next: ExerciseStatus;
    readonly failed: boolean;
  }): readonly IssueListItem[];
}

export type ExerciseSolutions = { [Id in ExerciseId]: ExerciseSignatures[Id] };
export type ExerciseSolution<Id extends ExerciseId> = ExerciseSolutions[Id];

export function runExercise(solutions: ExerciseSolutions, id: ExerciseId, input: unknown): unknown {
  // Runtime contracts intentionally forge invalid boundary values. Only this
  // adapter erases a call signature; the learner registry remains precise.
  const runtimeSolution = solutions[id] as (runtimeInput: unknown) => unknown;
  return runtimeSolution(input);
}

export interface ContractCase {
  name: string;
  input: unknown;
  expected: unknown;
}

const cases = (...values: ContractCase[]) => values;

export const exerciseContracts: Record<ExerciseId, readonly ContractCase[]> = {
  B01: cases(
    { name: 'keeps a stable literal', input: { stable: true, value: 'open' }, expected: 'literal:open' },
    { name: 'classifies a mutable number', input: { stable: false, value: 3 }, expected: 'number' },
    { name: 'classifies a mutable string', input: { stable: false, value: 'open' }, expected: 'string' },
  ),
  B02: cases(
    { name: 'reads only required keys', input: { id: 7, displayName: 'Ada', role: 'Admin' }, expected: '7:Ada' },
    { name: 'ignores extra fields', input: { id: 8, displayName: 'Lin', secret: 'ignored' }, expected: '8:Lin' },
    { name: 'rejects a missing name', input: { id: 9 }, expected: null },
  ),
  B03: cases(
    { name: 'distinguishes omission', input: {}, expected: 'omitted' },
    { name: 'distinguishes null', input: { value: null }, expected: 'null' },
    { name: 'keeps a value', input: { value: 'Ada' }, expected: 'value:Ada' },
  ),
  B04: cases(
    { name: 'labels open', input: 'open', expected: 'Open' },
    { name: 'labels in progress', input: 'in_progress', expected: 'In progress' },
    { name: 'rejects an unknown member', input: 'blocked', expected: 'Invalid' },
  ),
  B05: cases(
    { name: 'maps open', input: 'open', expected: 'Ready for triage' },
    { name: 'maps resolved', input: 'resolved', expected: 'Ready to verify' },
    { name: 'maps closed', input: 'closed', expected: 'Completed work' },
  ),
  B06: cases(
    { name: 'accepts a member', input: 'in_progress', expected: true },
    { name: 'rejects a string outsider', input: 'blocked', expected: false },
    { name: 'rejects a non-string', input: 2, expected: false },
  ),
  B07: cases(
    {
      name: 'updates only the matching item',
      input: {
        items: [
          { id: 1, status: 'open' },
          { id: 2, status: 'open' },
        ],
        id: 2,
        status: 'resolved',
      },
      expected: [
        { id: 1, status: 'open' },
        { id: 2, status: 'resolved' },
      ],
    },
    {
      name: 'keeps an unknown id unchanged',
      input: { items: [{ id: 1, status: 'open' }], id: 9, status: 'closed' },
      expected: [{ id: 1, status: 'open' }],
    },
    { name: 'handles an empty list', input: { items: [], id: 1, status: 'open' }, expected: [] },
  ),
  B08: cases(
    { name: 'reads Error-like input', input: { kind: 'error', message: 'Network failed' }, expected: 'Network failed' },
    { name: 'keeps a thrown string', input: { kind: 'string', value: 'Timeout' }, expected: 'Timeout' },
    { name: 'uses a safe fallback', input: { kind: 'number', value: 42 }, expected: 'Unknown error' },
  ),
  B09: cases(
    { name: 'renders idle', input: { kind: 'idle' }, expected: 'Not started' },
    { name: 'renders success', input: { kind: 'success', value: 3 }, expected: 'Loaded:3' },
    { name: 'renders error', input: { kind: 'error', message: 'Denied' }, expected: 'Error:Denied' },
  ),
  A01: cases(
    {
      name: 'returns the first page',
      input: { items: [1, 2, 3, 4], page: 1, pageSize: 2 },
      expected: { items: [1, 2], page: 1, pageSize: 2, total: 4 },
    },
    {
      name: 'returns the final short page',
      input: { items: [1, 2, 3], page: 2, pageSize: 2 },
      expected: { items: [3], page: 2, pageSize: 2, total: 3 },
    },
    {
      name: 'normalizes invalid numbers',
      input: { items: [1, 2], page: 0, pageSize: -1 },
      expected: { items: [1, 2], page: 1, pageSize: 20, total: 2 },
    },
  ),
  A02: cases(
    {
      name: 'maps strings to lengths',
      input: { items: ['a', 'abc'], page: 1, pageSize: 20, total: 2, operation: 'length' },
      expected: { items: [1, 3], page: 1, pageSize: 20, total: 2 },
    },
    {
      name: 'maps records to titles',
      input: { items: [{ title: 'A' }, { title: 'B' }], page: 2, pageSize: 2, total: 4, operation: 'title' },
      expected: { items: ['A', 'B'], page: 2, pageSize: 2, total: 4 },
    },
    {
      name: 'keeps empty metadata',
      input: { items: [], page: 1, pageSize: 10, total: 0, operation: 'length' },
      expected: { items: [], page: 1, pageSize: 10, total: 0 },
    },
  ),
  A03: cases(
    {
      name: 'indexes by id',
      input: {
        items: [
          { id: 2, name: 'B' },
          { id: 1, name: 'A' },
        ],
        key: 'id',
      },
      expected: [
        [2, { id: 2, name: 'B' }],
        [1, { id: 1, name: 'A' }],
      ],
    },
    {
      name: 'indexes by code',
      input: { items: [{ code: 'x', value: 1 }], key: 'code' },
      expected: [['x', { code: 'x', value: 1 }]],
    },
    { name: 'handles empty input', input: { items: [], key: 'id' }, expected: [] },
  ),
  A04: cases(
    {
      name: 'groups by status',
      input: {
        items: [
          { status: 'open', id: 1 },
          { status: 'open', id: 2 },
          { status: 'closed', id: 3 },
        ],
        key: 'status',
      },
      expected: { open: [1, 2], closed: [3] },
    },
    {
      name: 'groups number keys',
      input: {
        items: [
          { team: 2, id: 1 },
          { team: 3, id: 2 },
        ],
        key: 'team',
      },
      expected: { '2': [1], '3': [2] },
    },
    { name: 'handles empty input', input: { items: [], key: 'status' }, expected: {} },
  ),
  A05: cases(
    {
      name: 'updates a string field',
      input: { object: { title: 'Old', count: 1 }, key: 'title', value: 'New' },
      expected: { title: 'New', count: 1 },
    },
    {
      name: 'updates a number field',
      input: { object: { title: 'A', count: 1 }, key: 'count', value: 2 },
      expected: { title: 'A', count: 2 },
    },
    {
      name: 'does not mutate source shape',
      input: { object: { active: false }, key: 'active', value: true },
      expected: { active: true },
    },
  ),
  A06: cases(
    {
      name: 'derives a preview',
      input: { id: 1, title: 'Decoder', status: 'open', description: 'hidden' },
      expected: { id: 1, title: 'Decoder', status: 'open' },
    },
    {
      name: 'keeps field errors',
      input: { title: ['Required'], dueDate: ['Invalid'] },
      expected: { title: ['Required'], dueDate: ['Invalid'] },
    },
    {
      name: 'drops unknown view fields',
      input: { id: 2, title: 'A', status: 'closed', secret: 'drop' },
      expected: { id: 2, title: 'A', status: 'closed' },
    },
  ),
  A07: cases(
    { name: 'accepts one field', input: { title: 'Changed' }, expected: true },
    { name: 'accepts several fields', input: { title: 'Changed', dueDate: null }, expected: true },
    { name: 'rejects an empty patch', input: {}, expected: false },
  ),
  A08: cases(
    {
      name: 'decodes a valid preview',
      input: { id: 1, title: 'Safe', status: 'open' },
      expected: { ok: true, value: { id: 1, title: 'Safe', status: 'open' } },
    },
    {
      name: 'rejects an invalid status',
      input: { id: 1, title: 'Safe', status: 'blocked' },
      expected: { ok: false, path: '$.status' },
    },
    { name: 'rejects null', input: null, expected: { ok: false, path: '$' } },
  ),
  A09: cases(
    {
      name: 'decodes every item',
      input: [{ id: 1, title: 'A', status: 'open' }],
      expected: { ok: true, values: [{ id: 1, title: 'A', status: 'open' }] },
    },
    {
      name: 'reports an indexed path',
      input: [
        { id: 1, title: 'A', status: 'open' },
        { id: 2, title: 'B', status: 'blocked' },
      ],
      expected: { ok: false, paths: ['$[1].status'] },
    },
    { name: 'rejects a non-array', input: {}, expected: { ok: false, paths: ['$'] } },
  ),
  C01: cases(
    { name: 'accepts a valid envelope', input: { items: [], page: 1, pageSize: 20, total: 0 }, expected: true },
    { name: 'rejects page zero', input: { items: [], page: 0, pageSize: 20, total: 0 }, expected: false },
    {
      name: 'rejects total below item count',
      input: { items: [1, 2], page: 1, pageSize: 20, total: 1 },
      expected: false,
    },
  ),
  C02: cases(
    { name: 'decodes and validates email', input: 'ada@example.com', expected: { decoded: true, valid: true } },
    { name: 'decodes but rejects blank domain', input: 'ada@', expected: { decoded: true, valid: false } },
    { name: 'rejects a non-string before domain validation', input: 3, expected: { decoded: false, valid: false } },
  ),
  C03: cases(
    { name: 'omits defaults', input: '?page=1&sort=updated', expected: '' },
    { name: 'keeps meaningful values', input: '?page=2&status=open', expected: '?page=2&status=open' },
    { name: 'normalizes invalid numbers', input: '?page=-3&status=closed', expected: '?status=closed' },
  ),
  C04: cases(
    {
      name: 'keeps allowed unique ids',
      input: ['literal-unions', 'runtime-decoder', 'literal-unions'],
      expected: ['literal-unions', 'runtime-decoder'],
    },
    { name: 'drops retired and non-string ids', input: ['retired', 2, 'wire-scalars'], expected: ['wire-scalars'] },
    { name: 'recovers from a non-array', input: { completed: [] }, expected: [] },
  ),
  C05: cases(
    { name: 'validates a safe id', input: { kind: 'id', value: 248 }, expected: true },
    { name: 'rejects an impossible date', input: { kind: 'date', value: '2026-02-30' }, expected: false },
    { name: 'requires an instant offset', input: { kind: 'instant', value: '2026-08-30T10:00:00' }, expected: false },
  ),
  C06: cases(
    {
      name: 'classifies validation',
      input: { status: 400, title: 'Validation failed', errors: { title: ['Required'] } },
      expected: 'validation',
    },
    { name: 'classifies not found', input: { status: 404, title: 'Missing' }, expected: 'not-found' },
    { name: 'rejects an HTML error body', input: '<html>500</html>', expected: 'unknown' },
  ),
  C07: cases(
    {
      name: 'decodes JSON success',
      input: { status: 200, body: { id: 1 } },
      expected: { kind: 'json', value: { id: 1 } },
    },
    { name: 'models 204 separately', input: { status: 204, body: null }, expected: { kind: 'no-content' } },
    {
      name: 'classifies an error response',
      input: { status: 500, body: { title: 'Failed' } },
      expected: { kind: 'problem', status: 500 },
    },
  ),
  C08: cases(
    { name: 'accepts a valid select value', input: 'resolved', expected: 'resolved' },
    { name: 'rejects a forged value', input: 'blocked', expected: null },
    { name: 'rejects a non-string', input: 2, expected: null },
  ),
  C09: cases(
    {
      name: 'keeps an optimistic success',
      input: { items: [{ id: 1, status: 'open' }], id: 1, next: 'closed', failed: false },
      expected: [{ id: 1, status: 'closed' }],
    },
    {
      name: 'rolls back a failure',
      input: { items: [{ id: 1, status: 'open' }], id: 1, next: 'closed', failed: true },
      expected: [{ id: 1, status: 'open' }],
    },
    {
      name: 'does not touch another id',
      input: { items: [{ id: 1, status: 'open' }], id: 2, next: 'closed', failed: false },
      expected: [{ id: 1, status: 'open' }],
    },
  ),
};
