import { seedIssues, seedMembers } from '@/src/data/seed';
import {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  buildIssueQuery,
  isIssuePriority,
  isIssueSort,
  isIssueStatus,
  isPositiveIntegerId,
  isSortDirection,
  validateIssue,
  type FieldErrors,
  type Issue,
  type IssueInput,
  type IssuePriority,
  type IssueQuery,
  type IssueSort,
  type IssueStatus,
  type Member,
  type PagedResult,
  type SortDirection,
} from '@/src/features/issues/types';

export type ExampleResult<T> =
  { ok: true; value: T; notes: readonly string[] } | { ok: false; error: string; notes: readonly string[] };

export type IssueSummary = Pick<Issue, 'id' | 'key' | 'title' | 'status' | 'priority'>;
export type IssueDraft = Omit<IssueInput, 'status' | 'priority'> & Partial<Pick<IssueInput, 'status' | 'priority'>>;
export type IssuePatch = Partial<IssueInput>;
export type TypedFieldErrors<T extends object> = Partial<Record<keyof T, readonly string[]>>;
export type IssueFieldErrors = TypedFieldErrors<IssueInput>;
export type IssueKey = `IF-${number}`;

declare const calendarDateBrand: unique symbol;
declare const isoInstantBrand: unique symbol;

export type CalendarDate = string & { readonly [calendarDateBrand]: true };
export type IsoInstant = string & { readonly [isoInstantBrand]: true };

export interface IssuePreview {
  id: number;
  key: IssueKey;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeName: string | null;
}

export type AssignmentIntent = { kind: 'keep' } | { kind: 'unassign' } | { kind: 'assign'; memberId: number };

export type RemoteData<T> =
  { state: 'idle' } | { state: 'loading' } | { state: 'success'; data: T } | { state: 'error'; message: string };

export type ApiFailure =
  | { kind: 'validation'; status: 400; errors: FieldErrors }
  | { kind: 'bad_request'; status: 400 }
  | { kind: 'unauthorized'; status: 401 }
  | { kind: 'forbidden'; status: 403 }
  | { kind: 'not_found'; status: 404 }
  | { kind: 'conflict'; status: 409 }
  | { kind: 'client_http'; status: number }
  | { kind: 'server'; status: number }
  | { kind: 'network'; message: string }
  | { kind: 'cancelled' };

export interface WireScalarPreview {
  id: number;
  dueDate: CalendarDate | null;
  updatedAt: IsoInstant;
}

export interface IssuePipelineOptions {
  search?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  sortBy?: IssueSort;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
}

const ISSUE_INPUT_KEYS = [
  'title',
  'description',
  'status',
  'priority',
  'assigneeId',
  'tags',
  'dueDate',
] as const satisfies readonly (keyof IssueInput)[];

export const statusMeta = {
  open: { label: 'Open', order: 0, intent: 'Start here' },
  in_progress: { label: 'In progress', order: 1, intent: 'Work is active' },
  resolved: { label: 'Resolved', order: 2, intent: 'Solution delivered' },
  closed: { label: 'Closed', order: 3, intent: 'Work archived' },
} as const satisfies Record<IssueStatus, { label: string; order: number; intent: string }>;

export const priorityWeight = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
} as const satisfies Record<IssuePriority, number>;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isIssueKey(value: unknown): value is IssueKey {
  return typeof value === 'string' && /^IF-[1-9]\d*$/.test(value);
}

export function isCalendarDate(value: unknown): value is CalendarDate {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1) return false;
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function isIsoInstant(value: unknown): value is IsoInstant {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if (!match) return false;
  const [, year, month, day, hour, minute, second, zone, , offsetHour = '0', offsetMinute = '0'] = match;
  if (!isCalendarDate(`${year}-${month}-${day}`)) return false;
  if (Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) return false;
  if (zone !== 'Z' && (Number(offsetHour) > 14 || Number(offsetMinute) > 59)) return false;
  if (Number(offsetHour) === 14 && Number(offsetMinute) !== 0) return false;
  return Number.isFinite(Date.parse(value));
}

export function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${String(value)}`);
}

export function nextIssueStatus(status: IssueStatus): IssueStatus {
  switch (status) {
    case 'open':
      return 'in_progress';
    case 'in_progress':
      return 'resolved';
    case 'resolved':
      return 'closed';
    case 'closed':
      return 'open';
    default:
      return assertNever(status);
  }
}

export function getIssueHeading<T extends Pick<Issue, 'key' | 'title'>>(issue: T): string {
  return `${issue.key} · ${issue.title}`;
}

export function toAssignmentPatch(intent: AssignmentIntent): IssuePatch {
  switch (intent.kind) {
    case 'keep':
      return {};
    case 'unassign':
      return { assigneeId: null };
    case 'assign':
      return { assigneeId: intent.memberId };
    default:
      return assertNever(intent);
  }
}

export function parseAssignmentIntent(value: string): ExampleResult<AssignmentIntent> {
  if (value === 'keep') {
    return { ok: true, value: { kind: 'keep' }, notes: ['No property is sent, so the server keeps its value.'] };
  }
  if (value === 'unassign') {
    return { ok: true, value: { kind: 'unassign' }, notes: ['Explicit null means remove the assignee.'] };
  }
  const match = /^assign:(\d+)$/.exec(value);
  const memberId = match ? Number(match[1]) : Number.NaN;
  if (match && isPositiveIntegerId(memberId)) {
    return {
      ok: true,
      value: { kind: 'assign', memberId },
      notes: ['A number means replace the assignee with that member.'],
    };
  }
  return {
    ok: false,
    error: 'Use keep, unassign, or assign:<member id>.',
    notes: ['Optional and nullable are different API states.'],
  };
}

export function paginate<T>(items: readonly T[], page = 1, pageSize = 10): PagedResult<T> {
  const safePage = Number.isSafeInteger(page) ? Math.max(1, page) : 1;
  const safePageSize = Number.isSafeInteger(pageSize) ? Math.max(1, pageSize) : 10;
  const start = (safePage - 1) * safePageSize;
  return {
    items: items.slice(start, start + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    total: items.length,
  };
}

export function mapPage<T, U>(page: PagedResult<T>, project: (item: T) => U): PagedResult<U> {
  return { ...page, items: page.items.map(project) };
}

export function indexById<T extends { id: number }>(items: readonly T[]): Map<number, T> {
  return new Map(items.map((item) => [item.id, item]));
}

export function summarizeIssue(issue: Issue): IssueSummary {
  const { id, key, title, status, priority } = issue;
  return { id, key, title, status, priority };
}

export function applyPatch<T extends object>(value: Readonly<T>, patch: Partial<T>): T {
  return { ...value, ...patch };
}

export function updateField<T extends object, K extends keyof T>(value: T, key: K, nextValue: T[K]): T {
  return { ...value, [key]: nextValue };
}

export function decodeIssuePreview(value: unknown): ExampleResult<IssuePreview> {
  if (!isRecord(value)) {
    return { ok: false, error: 'Expected an object.', notes: ['unknown must be narrowed before property access.'] };
  }

  const errors: string[] = [];
  if (!isPositiveIntegerId(value.id)) errors.push('id must be a positive safe integer');
  if (!isIssueKey(value.key)) errors.push('key must match IF-<positive number>');
  if (typeof value.title !== 'string' || !value.title.trim()) errors.push('title must be a non-empty string');
  if (!isIssueStatus(value.status)) errors.push('status is not part of IssueStatus');
  if (!isIssuePriority(value.priority)) errors.push('priority is not part of IssuePriority');

  const assigneeName =
    value.assignee === null
      ? null
      : isRecord(value.assignee) && typeof value.assignee.displayName === 'string'
        ? value.assignee.displayName
        : undefined;
  if (assigneeName === undefined) errors.push('assignee must be null or contain displayName');

  if (errors.length) {
    return {
      ok: false,
      error: errors.join('; '),
      notes: ['A type assertion would hide these problems without changing the runtime value.'],
    };
  }

  return {
    ok: true,
    value: {
      id: value.id as number,
      key: value.key as IssueKey,
      title: (value.title as string).trim(),
      status: value.status as IssueStatus,
      priority: value.priority as IssuePriority,
      assigneeName: assigneeName as string | null,
    },
    notes: [
      'The returned value is typed only after every external field is checked.',
      'The IssueKey template type approximates a shape; the regex is what enforces a positive integer at runtime.',
    ],
  };
}

export function decodeIssueInputPatch(value: unknown): ExampleResult<Partial<IssueInput>> {
  if (!isRecord(value)) {
    return { ok: false, error: 'Expected an object.', notes: ['Validation starts only after decoding unknown.'] };
  }

  const patch: Partial<IssueInput> = {};
  const errors: string[] = [];
  for (const key of Object.keys(value)) {
    if (!(ISSUE_INPUT_KEYS as readonly string[]).includes(key)) errors.push(`unknown IssueInput field: ${key}`);
  }
  if ('title' in value) {
    if (typeof value.title === 'string') patch.title = value.title;
    else errors.push('title must be a string');
  }
  if ('description' in value) {
    if (typeof value.description === 'string') patch.description = value.description;
    else errors.push('description must be a string');
  }
  if ('status' in value) {
    if (isIssueStatus(value.status)) patch.status = value.status;
    else errors.push('status is not part of IssueStatus');
  }
  if ('priority' in value) {
    if (isIssuePriority(value.priority)) patch.priority = value.priority;
    else errors.push('priority is not part of IssuePriority');
  }
  if ('assigneeId' in value) {
    if (value.assigneeId === null || isPositiveIntegerId(value.assigneeId)) patch.assigneeId = value.assigneeId;
    else errors.push('assigneeId must be null or a positive safe integer');
  }
  if ('tags' in value) {
    if (Array.isArray(value.tags) && value.tags.every((tag) => typeof tag === 'string')) patch.tags = value.tags;
    else errors.push('tags must be an array of strings');
  }
  if ('dueDate' in value) {
    if (value.dueDate === null || isCalendarDate(value.dueDate)) patch.dueDate = value.dueDate;
    else errors.push('dueDate must be null or a real YYYY-MM-DD calendar date');
  }

  return errors.length
    ? { ok: false, error: errors.join('; '), notes: ['No assertion can replace these runtime checks.'] }
    : { ok: true, value: patch, notes: ['Every supplied field was narrowed before production validation.'] };
}

export function decodeWireScalars(value: unknown): ExampleResult<WireScalarPreview> {
  if (!isRecord(value)) {
    return { ok: false, error: 'Expected an object.', notes: ['Wire values begin as unknown.'] };
  }
  const errors: string[] = [];
  if (!isPositiveIntegerId(value.id)) errors.push('id must fit inside JavaScript’s safe integer range');
  if (value.dueDate !== null && !isCalendarDate(value.dueDate)) {
    errors.push('dueDate must be null or a real YYYY-MM-DD calendar date');
  }
  if (!isIsoInstant(value.updatedAt)) errors.push('updatedAt must be an ISO 8601 timestamp with Z or an offset');
  if (errors.length) {
    return {
      ok: false,
      error: errors.join('; '),
      notes: ['A .NET long that may exceed Number.MAX_SAFE_INTEGER should cross the wire as a string.'],
    };
  }
  return {
    ok: true,
    value: {
      id: value.id as number,
      dueDate: value.dueDate as CalendarDate | null,
      updatedAt: value.updatedAt as IsoInstant,
    },
    notes: [
      'DateOnly is a calendar date; DateTimeOffset is an instant with an offset.',
      'The brands document decoded values but do not validate anything by themselves.',
    ],
  };
}

export function decodeJson<T>(source: string, decoder: (value: unknown) => ExampleResult<T>): ExampleResult<T> {
  try {
    return decoder(JSON.parse(source) as unknown);
  } catch (error: unknown) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Invalid JSON.',
      notes: ['catch values are unknown until narrowed.'],
    };
  }
}

export function describeRemoteData<T>(value: RemoteData<T>): string {
  switch (value.state) {
    case 'idle':
      return 'Waiting to start.';
    case 'loading':
      return 'Loading data…';
    case 'success':
      return `Loaded: ${JSON.stringify(value.data)}`;
    case 'error':
      return `Failed: ${value.message}`;
    default:
      return assertNever(value);
  }
}

export function classifyHttpStatus(status: number, errors: FieldErrors = {}): ApiFailure {
  if (!Number.isInteger(status) || status < 400 || status > 599) {
    throw new RangeError('HTTP failure status must be an integer from 400 to 599.');
  }
  switch (status) {
    case 400:
      return Object.keys(errors).length ? { kind: 'validation', status, errors } : { kind: 'bad_request', status };
    case 401:
      return { kind: 'unauthorized', status };
    case 403:
      return { kind: 'forbidden', status };
    case 404:
      return { kind: 'not_found', status };
    case 409:
      return { kind: 'conflict', status };
    default:
      return status < 500 ? { kind: 'client_http', status } : { kind: 'server', status };
  }
}

export function explainApiFailure(failure: ApiFailure): string {
  switch (failure.kind) {
    case 'validation':
      return `Fix ${Object.keys(failure.errors).length} invalid field(s).`;
    case 'bad_request':
      return 'The request could not be parsed or accepted.';
    case 'unauthorized':
      return 'Sign in before trying again.';
    case 'forbidden':
      return 'Your account cannot perform this action.';
    case 'not_found':
      return 'The requested record could not be found.';
    case 'conflict':
      return 'The change conflicts with an existing record.';
    case 'client_http':
      return `The request failed with HTTP ${failure.status}.`;
    case 'server':
      return `The server returned ${failure.status}.`;
    case 'network':
      return `The network request failed: ${failure.message}`;
    case 'cancelled':
      return 'The request was cancelled.';
    default:
      return assertNever(failure);
  }
}

function compareIssues(left: Issue, right: Issue, sortBy: IssueSort): number {
  if (sortBy === 'priority') return priorityWeight[left.priority] - priorityWeight[right.priority];
  if (sortBy === 'status') return statusMeta[left.status].order - statusMeta[right.status].order;
  if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
    return new Date(left[sortBy]).getTime() - new Date(right[sortBy]).getTime();
  }
  return left.title.localeCompare(right.title);
}

export function runIssuePipeline(
  source: readonly Issue[],
  options: IssuePipelineOptions = {},
): PagedResult<IssueSummary> {
  const search = options.search?.trim().toLowerCase() ?? '';
  const sortBy = options.sortBy ?? 'updatedAt';
  const direction = options.sortDirection === 'asc' ? 1 : -1;
  const filtered = source.filter((issue) => {
    const haystack = `${issue.key} ${issue.title} ${issue.description} ${issue.tags.join(' ')}`.toLowerCase();
    return (
      (!search || haystack.includes(search)) &&
      (!options.status || issue.status === options.status) &&
      (!options.priority || issue.priority === options.priority)
    );
  });
  const sorted = filtered
    .map((issue, index) => ({ issue, index }))
    .sort((left, right) => {
      const result = compareIssues(left.issue, right.issue, sortBy) * direction;
      return result || left.index - right.index;
    })
    .map(({ issue }) => summarizeIssue(issue));
  return paginate(sorted, options.page, options.pageSize);
}

export function parsePipelineOptions(value: unknown): ExampleResult<IssuePipelineOptions> {
  if (!isRecord(value)) {
    return { ok: false, error: 'Expected an options object.', notes: ['Query input begins as unknown.'] };
  }
  const options: IssuePipelineOptions = {};
  if (value.search !== undefined) {
    if (typeof value.search !== 'string') {
      return { ok: false, error: 'search must be a string.', notes: ['Query fields are narrowed independently.'] };
    }
    options.search = value.search;
  }
  if (value.status !== undefined) {
    if (!isIssueStatus(value.status)) {
      return { ok: false, error: 'Invalid status.', notes: ['The status guard prevents unsafe casts.'] };
    }
    options.status = value.status;
  }
  if (value.priority !== undefined) {
    if (!isIssuePriority(value.priority)) {
      return { ok: false, error: 'Invalid priority.', notes: ['The priority guard narrows unknown.'] };
    }
    options.priority = value.priority;
  }
  if (value.sortBy !== undefined) {
    if (!isIssueSort(value.sortBy)) {
      return { ok: false, error: 'Invalid sortBy.', notes: ['Only the IssueSort tuple is accepted.'] };
    }
    options.sortBy = value.sortBy;
  }
  if (value.sortDirection !== undefined) {
    if (!isSortDirection(value.sortDirection)) {
      return { ok: false, error: 'Invalid sortDirection.', notes: ['Only asc or desc is accepted.'] };
    }
    options.sortDirection = value.sortDirection;
  }
  if (value.page !== undefined) {
    if (!isPositiveIntegerId(value.page)) {
      return { ok: false, error: 'page must be a positive safe integer.', notes: ['Invalid paging is rejected.'] };
    }
    options.page = value.page;
  }
  if (value.pageSize !== undefined) {
    if (!isPositiveIntegerId(value.pageSize) || value.pageSize > 100) {
      return {
        ok: false,
        error: 'pageSize must be an integer from 1 to 100.',
        notes: ['The API caps pageSize at 100.'],
      };
    }
    options.pageSize = value.pageSize;
  }
  return { ok: true, value: options, notes: ['Every optional field is narrowed independently.'] };
}

export function runValidation(input: IssueInput): FieldErrors {
  return validateIssue(input);
}

export function runQueryBuilder(query: Partial<IssueQuery>): string {
  return buildIssueQuery(query);
}

export const labData = {
  issues: seedIssues,
  members: seedMembers,
} as const satisfies { issues: readonly Issue[]; members: readonly Member[] };

export const labConstants = {
  statuses: ISSUE_STATUSES,
  priorities: ISSUE_PRIORITIES,
} as const;
