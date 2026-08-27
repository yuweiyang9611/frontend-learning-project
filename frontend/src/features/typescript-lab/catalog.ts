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
  labConstants,
  labData,
  mapPage,
  nextIssueStatus,
  paginate,
  parseAssignmentIntent,
  parsePipelineOptions,
  runIssuePipeline,
  runQueryBuilder,
  runValidation,
  statusMeta,
  summarizeIssue,
  toAssignmentPatch,
  updateField,
  type ExampleResult,
} from './examples';
import { isIssuePriority, isIssueStatus, type IssueInput, type IssueQuery } from '@/src/features/issues/types';

export type LessonCategory = 'Foundations' | 'Modeling' | 'Boundaries';
export type LessonLevel = 'Core' | 'Applied' | 'Advanced';
export type LessonCheck = 'Compiler' | 'Runtime' | 'Compiler + runtime';
export type LessonInputMode = 'none' | 'text' | 'json';

export interface LabRunResult {
  ok: boolean;
  title: string;
  output: string;
  notes: readonly string[];
}

export interface TypeScriptLesson {
  id: string;
  order: number;
  title: string;
  category: LessonCategory;
  level: LessonLevel;
  check: LessonCheck;
  summary: string;
  csharpBridge: string;
  productionPath: string;
  concepts: readonly string[];
  code: string;
  challenge: string;
  inputMode: LessonInputMode;
  inputLabel?: string;
  inputHint?: string;
  defaultInput: string;
  run: (input: string) => LabRunResult;
}

const baseIssueInput: IssueInput = {
  title: 'Teach runtime type guards',
  description: 'Use an IssueFlow contract instead of a disconnected toy.',
  status: 'open',
  priority: 'high',
  assigneeId: 2,
  tags: ['typescript', 'contracts'],
  dueDate: null,
};

function print(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

function success(title: string, value: unknown, notes: readonly string[]): LabRunResult {
  return { ok: true, title, output: print(value), notes };
}

function failure(title: string, error: string, notes: readonly string[]): LabRunResult {
  return { ok: false, title, output: error, notes };
}

function fromExample<T>(result: ExampleResult<T>, title: string): LabRunResult {
  return result.ok ? success(title, result.value, result.notes) : failure('Input rejected', result.error, result.notes);
}

function parseJsonInput(input: string): ExampleResult<unknown> {
  try {
    return { ok: true, value: JSON.parse(input) as unknown, notes: ['JSON.parse returns a runtime value, not proof.'] };
  } catch (error: unknown) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Invalid JSON.',
      notes: ['The caught value is unknown until narrowed.'],
    };
  }
}

function runStatus(input: string): LabRunResult {
  if (!isIssueStatus(input)) {
    return failure('Invalid union member', `"${input}" is not an IssueStatus.`, [
      'The guard checks runtime input against the as const tuple.',
    ]);
  }
  return success('Union narrowed', { current: input, metadata: statusMeta[input], next: nextIssueStatus(input) }, [
    'The exhaustive switch must handle every IssueStatus member.',
  ]);
}

function runKeyof(input: string): LabRunResult {
  const [rawKey, ...rest] = input.split('=');
  const value = rest.join('=').trim();
  if (rawKey === 'title' || rawKey === 'description') {
    return success('Field updated', updateField(baseIssueInput, rawKey, value), [
      `T[K] is string because K narrowed to "${rawKey}".`,
    ]);
  }
  if (rawKey === 'priority' && isIssuePriority(value)) {
    return success('Priority updated', updateField(baseIssueInput, rawKey, value), [
      'A number or arbitrary string cannot reach this branch.',
    ]);
  }
  return failure('Input rejected', 'Use title=<text>, description=<text>, or priority=<low|medium|high|critical>.', [
    'keyof keeps the field name and value type connected.',
  ]);
}

function runValidationLesson(input: string): LabRunResult {
  const parsed = parseJsonInput(input);
  if (!parsed.ok) return fromExample(parsed, 'Parsed');
  const decoded = decodeIssueInputPatch(parsed.value);
  if (!decoded.ok) return fromExample(decoded, 'Input decoded');
  const candidate = { ...baseIssueInput, ...decoded.value };
  const errors = runValidation(candidate);
  return success(Object.keys(errors).length ? 'Validation found issues' : 'Input is valid', errors, [
    ...decoded.notes,
    'The lab calls the same validateIssue function used by IssueForm.',
  ]);
}

function runQueryLesson(input: string): LabRunResult {
  const parsed = parseJsonInput(input);
  if (!parsed.ok) return fromExample(parsed, 'Parsed');
  const options = parsePipelineOptions(parsed.value);
  if (!options.ok) return fromExample(options, 'Query accepted');
  const query: Partial<IssueQuery> = options.value;
  return success('Typed URL created', runQueryBuilder(query) || '(defaults produce no query string)', [
    'Defaults are omitted and URLSearchParams handles encoding.',
  ]);
}

function runPipelineLesson(input: string): LabRunResult {
  const parsed = parseJsonInput(input);
  if (!parsed.ok) return fromExample(parsed, 'Parsed');
  const options = parsePipelineOptions(parsed.value);
  if (!options.ok) return fromExample(options, 'Options accepted');
  const result = runIssuePipeline(labData.issues, options.value);
  return success(
    'Pipeline complete',
    {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      issueKeys: result.items.map((item) => item.key),
    },
    ['The source array stays unchanged; total is calculated before paging.'],
  );
}

export const typescriptLessons = [
  {
    id: 'runtime-vs-types',
    order: 1,
    title: 'TypeScript vs. runtime',
    category: 'Boundaries',
    level: 'Core',
    check: 'Compiler + runtime',
    summary: 'A type assertion changes the compiler’s view, not the JSON that arrived over the network.',
    csharpBridge:
      'Like accepting object/JsonElement, or deserializing a DTO but skipping domain validation; neither proves invariants.',
    productionPath: 'src/api/issueflowApi.ts · request<T>()',
    concepts: ['unknown', 'type guard', 'JSON', 'narrowing'],
    code: `const raw: unknown = JSON.parse(source);
// any would allow unchecked property access.

const result = decodeIssuePreview(raw);
if (result.ok) {
  // result.value is now IssuePreview
  console.log(result.value.status);
}`,
    challenge: 'Add a dueDate field to IssuePreview and validate YYYY-MM-DD without using as.',
    inputMode: 'json',
    inputLabel: 'Untrusted API payload',
    inputHint: 'Try changing status to "blocked" or removing title.',
    defaultInput: JSON.stringify(
      {
        id: 248,
        key: 'IF-248',
        title: 'Make external data prove its type',
        status: 'in_progress',
        priority: 'high',
        assignee: { displayName: 'Maya Chen' },
      },
      null,
      2,
    ),
    run: (input) => fromExample(decodeJson(input, decodeIssuePreview), 'Payload decoded'),
  },
  {
    id: 'structural-typing',
    order: 2,
    title: 'Interfaces and structural typing',
    category: 'Foundations',
    level: 'Core',
    check: 'Compiler',
    summary: 'Functions can request the smallest shape they need instead of depending on a complete Issue.',
    csharpBridge:
      'Unlike nominal C# interfaces, TypeScript accepts any structurally compatible value without an implements clause.',
    productionPath: 'src/features/issues/types.ts · Issue / Member',
    concepts: ['interface', 'Pick', 'structural typing', 'constraints'],
    code: `interface HasIssueHeading {
  key: string;
  title: string;
}
type IssueHeading = Pick<Issue, 'key' | 'title'>;

function getIssueHeading<
  T extends Pick<Issue, 'key' | 'title'>
>(issue: T): string {
  return issue.key + ' · ' + issue.title;
}

getIssueHeading({ key: 'IF-9', title: 'Small shape' });`,
    challenge: 'Create a function that accepts anything with id and updatedAt, then returns a cache key.',
    inputMode: 'none',
    defaultInput: '',
    run: () =>
      success(
        'Both shapes are compatible',
        [
          getIssueHeading(labData.issues[0]),
          getIssueHeading({ key: 'IF-9', title: 'A smaller compatible object', debugOnly: true }),
        ],
        ['Extra properties do not stop structural compatibility.'],
      ),
  },
  {
    id: 'literal-unions',
    order: 3,
    title: 'as const, unions, and never',
    category: 'Modeling',
    level: 'Core',
    check: 'Compiler + runtime',
    summary: 'A readonly tuple becomes the single source for a precise string union and exhaustive mappings.',
    csharpBridge:
      'Closest to an enum plus an explicit exhaustive guard; C# enum values and switch analysis have different edge cases.',
    productionPath: 'src/features/issues/types.ts · ISSUE_STATUSES',
    concepts: ['as const', 'union', 'Record', 'never', 'satisfies'],
    code: `const statuses = [
  'open', 'in_progress', 'resolved', 'closed'
] as const;

type IssueStatus = (typeof statuses)[number];

type StatusMeta = { label: string; order: number };
const meta = {
  open: { label: 'Open', order: 0 },
  in_progress: { label: 'In progress', order: 1 },
  resolved: { label: 'Resolved', order: 2 },
  closed: { label: 'Closed', order: 3 },
} as const satisfies Record<IssueStatus, StatusMeta>;`,
    challenge: 'Add a hypothetical blocked status and observe every exhaustive location that TypeScript identifies.',
    inputMode: 'text',
    inputLabel: 'Issue status',
    inputHint: `Try "in_progress" and then "in-progress".`,
    defaultInput: 'in_progress',
    run: runStatus,
  },
  {
    id: 'optional-null',
    order: 4,
    title: 'Optional is not nullable',
    category: 'Modeling',
    level: 'Core',
    check: 'Compiler + runtime',
    summary: 'PATCH needs three assignment states: omit the field, send null, or send a member ID.',
    csharpBridge: 'Equivalent to tracking both property presence and a nullable value in a PATCH DTO.',
    productionPath: 'src/features/issues/types.ts · IssueUpdate',
    concepts: ['Partial', 'optional', 'null', 'discriminated union'],
    code: `type AssignmentIntent =
  | { kind: 'keep' }
  | { kind: 'unassign' }
  | { kind: 'assign'; memberId: number };

// {} !== { assigneeId: null }
const patch = toAssignmentPatch(intent);`,
    challenge: 'Model the same three states for dueDate and explain what JSON.stringify does with undefined.',
    inputMode: 'text',
    inputLabel: 'Assignment intent',
    inputHint: 'Use keep, unassign, or assign:2.',
    defaultInput: 'unassign',
    run: (input) => {
      const parsed = parseAssignmentIntent(input);
      return parsed.ok
        ? success('PATCH shape created', toAssignmentPatch(parsed.value), [
            ...parsed.notes,
            'Without exactOptionalPropertyTypes, undefined can exist in memory; JSON.stringify still omits that property.',
          ])
        : fromExample(parsed, 'Intent parsed');
    },
  },
  {
    id: 'generics',
    order: 5,
    title: 'Generics preserve relationships',
    category: 'Foundations',
    level: 'Applied',
    check: 'Compiler + runtime',
    summary: 'One paginator can keep the item type whether it receives Issues, Members, or summaries.',
    csharpBridge: 'Directly comparable to PagedResult<T> and generic constraints in C#.',
    productionPath: 'src/features/issues/types.ts · PagedResult<T>',
    concepts: ['generic', 'constraint', 'map', 'immutability'],
    code: `function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize: number
): PagedResult<T> { /* slice without mutation */ }

function indexById<T extends { id: number }>(
  items: readonly T[]
): Map<number, T> { /* ... */ }`,
    challenge: 'Add a generic groupBy<T, K extends PropertyKey> without losing the value type.',
    inputMode: 'text',
    inputLabel: 'Page and page size',
    inputHint: 'Use page,pageSize — for example 2,4.',
    defaultInput: '2,4',
    run: (input) => {
      const [page = 1, pageSize = 5] = input.split(',').map(Number);
      if (!Number.isFinite(page) || !Number.isFinite(pageSize)) {
        return failure('Input rejected', 'Use two numbers separated by a comma.', [
          'Generic types do not replace input validation.',
        ]);
      }
      const result = paginate(labData.members, page, pageSize);
      const names = mapPage(result, (member) => member.displayName);
      const index = indexById(result.items);
      return success('Generic result retained', { ...names, indexedIds: [...index.keys()] }, [
        'The original member array was not mutated.',
      ]);
    },
  },
  {
    id: 'utility-types',
    order: 6,
    title: 'Utility types from real models',
    category: 'Modeling',
    level: 'Applied',
    check: 'Compiler + runtime',
    summary: 'Pick, Omit, Partial, Record, and Readonly transform the Issue contract without copying its declarations.',
    csharpBridge:
      'Think projection DTOs, patch DTOs, and dictionaries; Readonly is only a shallow compile-time restriction.',
    productionPath: 'src/features/issues/types.ts · IssueUpdate / statusLabels',
    concepts: ['Pick', 'Omit', 'Partial', 'Record', 'Readonly'],
    code: `type IssueSummary = Pick<
  Issue,
  'id' | 'key' | 'title' | 'status' | 'priority'
>;

type IssuePatch = Partial<IssueInput>;
type IssueCreate = Omit<IssueInput, 'status'>;
type IssueSnapshot = Readonly<IssueSummary>;
type Errors<T> =
  Partial<Record<keyof T, readonly string[]>>;`,
    challenge: 'Replace one handwritten view type with a utility type and prove it with expectTypeOf.',
    inputMode: 'none',
    defaultInput: '',
    run: () => {
      const current = summarizeIssue(labData.issues[0]);
      const changed = applyPatch(current, { priority: 'critical' });
      return success('New shallow copy', { current, changed }, [
        'applyPatch returns a shallow copy; Readonly does not freeze objects or nested values at runtime.',
      ]);
    },
  },
  {
    id: 'keyof-fields',
    order: 7,
    title: 'keyof and indexed access',
    category: 'Foundations',
    level: 'Applied',
    check: 'Compiler + runtime',
    summary: 'A generic field updater keeps each property name connected to exactly the right value type.',
    csharpBridge: 'Comparable to a strongly typed property selector, but expressed entirely in the type system.',
    productionPath: 'src/features/issues/IssueForm.tsx',
    concepts: ['keyof', 'T[K]', 'generic function', 'form state'],
    code: `function updateField<
  T extends object,
  K extends keyof T
>(value: T, key: K, next: T[K]): T {
  return { ...value, [key]: next };
}

updateField(input, 'priority', 'critical');
// updateField(input, 'priority', 3); // type error

function readText(
  event: React.ChangeEvent<HTMLInputElement>
) {
  return event.currentTarget.value;
}`,
    challenge: 'Create a FieldConfig<K> type whose input kind depends on IssueInput[K].',
    inputMode: 'text',
    inputLabel: 'Field update',
    inputHint: 'Try title=New title or priority=critical.',
    defaultInput: 'priority=critical',
    run: runKeyof,
  },
  {
    id: 'validation',
    order: 8,
    title: 'Typed validation results',
    category: 'Boundaries',
    level: 'Applied',
    check: 'Runtime',
    summary:
      'Unknown JSON is decoded field by field before the production validator runs; the Lab also shows a stricter generic error map.',
    csharpBridge:
      'This mirrors validation problem details keyed by DTO property, while still validating the wire shape first.',
    productionPath: 'src/features/issues/types.ts · validateIssue',
    concepts: ['Record', 'keyof', 'form validation', 'boundary values'],
    code: `type FieldErrors<T> =
  Partial<Record<keyof T, readonly string[]>>;

const errors = validateIssue(input);
// { title?: string[]; dueDate?: string[]; ... }`,
    challenge: 'Add table-driven tests for title lengths 99, 100, and 101.',
    inputMode: 'json',
    inputLabel: 'Partial IssueInput override',
    inputHint: 'Try an empty title or dueDate in the past.',
    defaultInput: JSON.stringify({ title: '  ', dueDate: '2000-01-01' }, null, 2),
    run: runValidationLesson,
  },
  {
    id: 'query-builder',
    order: 9,
    title: 'Typed query builder',
    category: 'Boundaries',
    level: 'Applied',
    check: 'Compiler + runtime',
    summary: 'A Partial<IssueQuery> becomes a shareable URL while invalid enum-like values are rejected first.',
    csharpBridge:
      'Comparable to binding and validating the supported subset of a query DTO before executing a request.',
    productionPath: 'src/features/issues/types.ts · buildIssueQuery',
    concepts: ['Partial', 'URLSearchParams', 'type guard', 'defaults'],
    code: `const parsed: unknown = JSON.parse(source);
const options = parsePipelineOptions(parsed);

if (options.ok) {
  const search = buildIssueQuery(options.value);
}`,
    challenge: 'Add an overdue boolean filter from parser to URL and test both true and false.',
    inputMode: 'json',
    inputLabel: 'Query options',
    inputHint: 'Defaults disappear; special characters are encoded.',
    defaultInput: JSON.stringify(
      { page: 2, pageSize: 10, search: 'focus & keyboard', status: 'open', sortBy: 'priority', sortDirection: 'desc' },
      null,
      2,
    ),
    run: runQueryLesson,
  },
  {
    id: 'array-pipeline',
    order: 10,
    title: 'Array pipeline and stable sorting',
    category: 'Modeling',
    level: 'Advanced',
    check: 'Runtime',
    summary: 'Filter, sort, project, and page realistic Issue data without mutating the source array.',
    csharpBridge: 'The mental model is close to LINQ, but array methods execute in the browser.',
    productionPath: 'src/api/issueflowApi.ts · mockList (adapted with tags + stable tie-break)',
    concepts: ['filter', 'map', 'sort', 'immutability', 'stable order'],
    code: `const filtered = issues.filter(matchesQuery);
const sorted = filtered
  .map((issue, index) => ({ issue, index }))
  .sort(stableCompare)
  .map(({ issue }) => summarizeIssue(issue));

return paginate(sorted, page, pageSize);`,
    challenge: 'Add assignee filtering and prove the original seed array stays byte-for-byte unchanged.',
    inputMode: 'json',
    inputLabel: 'Pipeline options',
    inputHint: 'Try search, status, priority, sortBy, page, and pageSize.',
    defaultInput: JSON.stringify(
      { search: 'keyboard', sortBy: 'priority', sortDirection: 'desc', page: 1, pageSize: 5 },
      null,
      2,
    ),
    run: runPipelineLesson,
  },
  {
    id: 'wire-scalars',
    order: 11,
    title: 'Safe IDs, calendar dates, and instants',
    category: 'Boundaries',
    level: 'Advanced',
    check: 'Compiler + runtime',
    summary:
      '.NET long, DateOnly, and DateTimeOffset all need deliberate JSON representations and runtime checks in TypeScript.',
    csharpBridge:
      'long maps safely to number only within Number.MAX_SAFE_INTEGER; DateOnly and DateTimeOffset have different time semantics.',
    productionPath: 'backend/IssueFlow.Api/Features/Issues/IssueContracts.cs · frontend/src/features/issues/types.ts',
    concepts: ['Number.isSafeInteger', 'branded type', 'DateOnly', 'DateTimeOffset', 'ISO 8601'],
    code: `type CalendarDate =
  string & { readonly __brand: 'CalendarDate' };
type IsoInstant =
  string & { readonly __brand: 'IsoInstant' };

function checkScalars(raw: Record<string, unknown>) {
  const idIsSafe = isPositiveIntegerId(raw.id);
  const dueDateIsValid =
    raw.dueDate === null || isCalendarDate(raw.dueDate);
  const updatedAtIsValid = isIsoInstant(raw.updatedAt);
  return { idIsSafe, dueDateIsValid, updatedAtIsValid };
}`,
    challenge:
      'Change the backend ID contract to a string and compare the migration cost with waiting until IDs exceed MAX_SAFE_INTEGER.',
    inputMode: 'json',
    inputLabel: '.NET wire scalar payload',
    inputHint: 'Try an impossible date, a timestamp without an offset, or 9007199254740992 as id.',
    defaultInput: JSON.stringify({ id: 248, dueDate: '2026-09-15', updatedAt: '2026-08-27T09:00:00Z' }, null, 2),
    run: (input) => fromExample(decodeJson(input, decodeWireScalars), 'Wire scalars decoded'),
  },
  {
    id: 'unknown-state-errors',
    order: 12,
    title: 'unknown, state unions, and errors',
    category: 'Boundaries',
    level: 'Advanced',
    check: 'Compiler + runtime',
    summary:
      'A RemoteData discriminated union makes illegal UI-state combinations impossible; HTTP number ranges still need runtime checks.',
    csharpBridge:
      'Similar to a result hierarchy with pattern matching, but C# has no native closed discriminated union with identical exhaustiveness.',
    productionPath: 'src/api/issueflowApi.ts · ApiError; src/screens/IssuesPage.tsx · Query flags (conceptual model)',
    concepts: ['unknown', 'discriminated union', 'never', 'error taxonomy'],
    code: `type RemoteData<T> =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'success'; data: T }
  | { state: 'error'; message: string };

function render<T>(value: RemoteData<T>) {
  switch (value.state) { /* exhaustive */ }
}

type ApiFailure =
  | { kind: 'validation'; status: 400; errors: FieldErrors }
  | { kind: 'client_http'; status: number }
  | { kind: 'server'; status: number }
  | { kind: 'network'; message: string }
  | { kind: 'cancelled' };`,
    challenge: 'Add a cancelled state to RemoteData and let assertNever reveal every missing UI-state branch.',
    inputMode: 'text',
    inputLabel: 'HTTP status to classify',
    inputHint: 'Try an error status such as 400, 401, 403, 404, 409, 418, or 503.',
    defaultInput: '409',
    run: (input) => {
      const status = Number(input);
      if (!Number.isInteger(status) || status < 400 || status > 599) {
        return failure('Input rejected', 'Enter an HTTP error status from 400 to 599.', [
          'Success and redirect statuses are not ApiFailure values.',
        ]);
      }
      const failureValue = classifyHttpStatus(status, { title: ['Title is required.'] });
      return success(
        'Failure narrowed',
        {
          failure: failureValue,
          message: explainApiFailure(failureValue),
          timeline: [
            describeRemoteData({ state: 'idle' }),
            describeRemoteData({ state: 'loading' }),
            describeRemoteData({ state: 'success', data: { recovered: true } }),
            describeRemoteData({ state: 'error', message: explainApiFailure(failureValue) }),
          ],
        },
        [
          'The production app uses Query flags; RemoteData is a closed teaching model of the same UI states.',
          'ApiFailure discriminates shapes, while classifyHttpStatus enforces numeric HTTP ranges at runtime.',
        ],
      );
    },
  },
] as const satisfies readonly TypeScriptLesson[];

export const lessonCategories = ['All', 'Foundations', 'Modeling', 'Boundaries'] as const;
export type LessonCategoryFilter = (typeof lessonCategories)[number];

export function findLesson(id: string | null): TypeScriptLesson {
  return typescriptLessons.find((lesson) => lesson.id === id) ?? typescriptLessons[0];
}

export function filterLessons(search: string, category: LessonCategoryFilter): readonly TypeScriptLesson[] {
  const query = search.trim().toLowerCase();
  return typescriptLessons.filter(
    (lesson) =>
      (category === 'All' || lesson.category === category) &&
      (!query || `${lesson.title} ${lesson.summary} ${lesson.concepts.join(' ')}`.toLowerCase().includes(query)),
  );
}

export const labOverview = {
  lessonCount: typescriptLessons.length,
  compilerExamples: typescriptLessons.filter((lesson) => lesson.check.includes('Compiler')).length,
  runtimeExamples: typescriptLessons.filter((lesson) => lesson.check.includes('runtime') || lesson.check === 'Runtime')
    .length,
  sourceModels: [labConstants.statuses.length, labConstants.priorities.length],
} as const;
