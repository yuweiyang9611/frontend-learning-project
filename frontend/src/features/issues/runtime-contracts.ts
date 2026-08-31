import {
  isCalendarDate,
  isIssuePriority,
  isIssueStatus,
  isPositiveIntegerId,
  type Attachment,
  type Comment,
  type FieldErrors,
  type Issue,
  type IssueInput,
  type IssueUpdate,
  type Member,
  type PagedResult,
  type Session,
} from './types';

export type DecodeResult<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors };
export type Decoder<T> = (value: unknown) => DecodeResult<T>;

export interface ProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
  errors?: FieldErrors;
}

export interface LocalDatabaseContract {
  issues: Issue[];
  members: Member[];
  comments: Comment[];
  attachments: Attachment[];
}

export class ContractDecodeError extends Error {
  constructor(
    message: string,
    public readonly errors: FieldErrors,
  ) {
    super(message);
    this.name = 'ContractDecodeError';
  }
}

const ok = <T>(value: T): DecodeResult<T> => ({ ok: true, value });
const fail = <T>(field: string, message: string): DecodeResult<T> => ({
  ok: false,
  errors: { [field]: [message] },
});

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isIsoInstant(value: unknown): value is string {
  return typeof value === 'string' && /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) && Number.isFinite(Date.parse(value));
}

function collectFieldError(errors: FieldErrors, field: string, message: string) {
  errors[field] = [...(errors[field] ?? []), message];
}

function decodeIssueMutation(value: unknown): DecodeResult<IssueUpdate> {
  if (!isRecord(value)) return fail('body', 'The request body must be a JSON object.');
  const errors: FieldErrors = {};
  const result: IssueUpdate = {};

  if ('title' in value) {
    if (typeof value.title === 'string') result.title = value.title;
    else collectFieldError(errors, 'title', 'Title must be a string.');
  }
  if ('description' in value) {
    if (typeof value.description === 'string') result.description = value.description;
    else collectFieldError(errors, 'description', 'Description must be a string.');
  }
  if ('status' in value) {
    if (isIssueStatus(value.status)) result.status = value.status;
    else collectFieldError(errors, 'status', 'Choose a valid status.');
  }
  if ('priority' in value) {
    if (isIssuePriority(value.priority)) result.priority = value.priority;
    else collectFieldError(errors, 'priority', 'Choose a valid priority.');
  }
  if ('assigneeId' in value) {
    if (value.assigneeId === null || isPositiveIntegerId(value.assigneeId)) result.assigneeId = value.assigneeId;
    else collectFieldError(errors, 'assigneeId', 'Assignee ID must be a positive integer or null.');
  }
  if ('tags' in value) {
    if (isStringArray(value.tags)) result.tags = value.tags;
    else collectFieldError(errors, 'tags', 'Tags must be an array of strings.');
  }
  if ('dueDate' in value) {
    if (value.dueDate === null || isCalendarDate(value.dueDate)) result.dueDate = value.dueDate;
    else collectFieldError(errors, 'dueDate', 'Due date must be null or a real YYYY-MM-DD calendar date.');
  }

  return Object.keys(errors).length ? { ok: false, errors } : ok(result);
}

export const decodeIssueCreate: Decoder<Partial<IssueInput>> = decodeIssueMutation;
export const decodeIssueUpdate: Decoder<IssueUpdate> = decodeIssueMutation;

function decodeMember(value: unknown): DecodeResult<Member> {
  if (!isRecord(value)) return fail('member', 'Member must be an object.');
  const roles: Member['role'][] = ['Admin', 'Developer', 'Designer', 'Product'];
  const colors: Member['color'][] = ['violet', 'blue', 'orange', 'green', 'rose', 'teal'];
  if (
    !isPositiveIntegerId(value.id) ||
    typeof value.displayName !== 'string' ||
    typeof value.email !== 'string' ||
    !(value.avatarUrl === null || typeof value.avatarUrl === 'string') ||
    !roles.includes(value.role as Member['role']) ||
    typeof value.initials !== 'string' ||
    !colors.includes(value.color as Member['color'])
  ) {
    return fail('member', 'Member fields do not match the public contract.');
  }
  return ok({
    id: value.id,
    displayName: value.displayName,
    email: value.email,
    avatarUrl: value.avatarUrl,
    role: value.role as Member['role'],
    initials: value.initials,
    color: value.color as Member['color'],
  });
}

export const decodeIssue: Decoder<Issue> = (value) => {
  if (!isRecord(value)) return fail('issue', 'Issue must be an object.');
  const assignee = value.assignee === null ? ok<Member | null>(null) : decodeMember(value.assignee);
  const reporter = decodeMember(value.reporter);
  if (
    !isPositiveIntegerId(value.id) ||
    typeof value.key !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.description !== 'string' ||
    !isIssueStatus(value.status) ||
    !isIssuePriority(value.priority) ||
    !assignee.ok ||
    !reporter.ok ||
    !isStringArray(value.tags) ||
    !(value.dueDate === null || isCalendarDate(value.dueDate)) ||
    !isIsoInstant(value.createdAt) ||
    !isIsoInstant(value.updatedAt)
  ) {
    return fail('issue', 'Issue fields do not match the public contract.');
  }
  return ok({
    id: value.id,
    key: value.key,
    title: value.title,
    description: value.description,
    status: value.status,
    priority: value.priority,
    assignee: assignee.value,
    reporter: reporter.value,
    tags: value.tags,
    dueDate: value.dueDate,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  });
};

export const decodeMembers: Decoder<Member[]> = (value) => decodeArray(value, decodeMember, 'members');
export const decodeIssues: Decoder<Issue[]> = (value) => decodeArray(value, decodeIssue, 'issues');

export const decodeComment: Decoder<Comment> = (value) => {
  if (!isRecord(value)) return fail('comment', 'Comment must be an object.');
  const author = decodeMember(value.author);
  if (
    !isPositiveIntegerId(value.id) ||
    !isPositiveIntegerId(value.issueId) ||
    !author.ok ||
    typeof value.body !== 'string' ||
    !isIsoInstant(value.createdAt)
  ) {
    return fail('comment', 'Comment fields do not match the public contract.');
  }
  return ok({
    id: value.id,
    issueId: value.issueId,
    author: author.value,
    body: value.body,
    createdAt: value.createdAt,
  });
};

export const decodeComments: Decoder<Comment[]> = (value) => decodeArray(value, decodeComment, 'comments');

export const decodeAttachment: Decoder<Attachment> = (value) => {
  if (!isRecord(value)) return fail('attachment', 'Attachment must be an object.');
  if (
    !isPositiveIntegerId(value.id) ||
    !isPositiveIntegerId(value.issueId) ||
    typeof value.originalFileName !== 'string' ||
    typeof value.contentType !== 'string' ||
    typeof value.size !== 'number' ||
    value.size < 0 ||
    !isIsoInstant(value.createdAt) ||
    !(value.downloadUrl === null || typeof value.downloadUrl === 'string')
  ) {
    return fail('attachment', 'Attachment fields do not match the public contract.');
  }
  return ok({
    id: value.id,
    issueId: value.issueId,
    originalFileName: value.originalFileName,
    contentType: value.contentType,
    size: value.size,
    createdAt: value.createdAt,
    downloadUrl: value.downloadUrl,
  });
};

export const decodeAttachments: Decoder<Attachment[]> = (value) => decodeArray(value, decodeAttachment, 'attachments');

export const decodeSession: Decoder<Session> = (value) => {
  if (!isRecord(value)) return fail('session', 'Session must be an object.');
  if (
    typeof value.email !== 'string' ||
    typeof value.displayName !== 'string' ||
    typeof value.initials !== 'string' ||
    (value.role !== 'Admin' && value.role !== 'Member')
  ) {
    return fail('session', 'Session fields do not match the public contract.');
  }
  return ok({
    email: value.email,
    displayName: value.displayName,
    initials: value.initials,
    role: value.role,
  });
};

export const decodePagedIssues: Decoder<PagedResult<Issue>> = (value) => {
  if (!isRecord(value)) return fail('page', 'Paged result must be an object.');
  const items = decodeIssues(value.items);
  if (
    !items.ok ||
    !isPositiveIntegerId(value.page) ||
    !isPositiveIntegerId(value.pageSize) ||
    typeof value.total !== 'number' ||
    !Number.isSafeInteger(value.total) ||
    value.total < 0
  ) {
    return fail('page', 'Paged result fields do not match the public contract.');
  }
  return ok({ items: items.value, page: value.page, pageSize: value.pageSize, total: value.total });
};

export const decodeLocalDatabase: Decoder<LocalDatabaseContract> = (value) => {
  if (!isRecord(value)) return fail('database', 'Local database must be an object.');
  const issues = decodeIssues(value.issues);
  const members = decodeMembers(value.members);
  const comments = decodeComments(value.comments);
  const attachments = decodeAttachments(value.attachments);
  if (!issues.ok || !members.ok || !comments.ok || !attachments.ok) {
    return fail('database', 'Stored demo data is damaged or belongs to an unsupported version.');
  }
  return ok({
    issues: issues.value,
    members: members.value,
    comments: comments.value,
    attachments: attachments.value,
  });
};

export const decodeProblemDetails: Decoder<ProblemDetails> = (value) => {
  if (!isRecord(value)) return fail('problem', 'Problem Details must be an object.');
  const result: ProblemDetails = {};
  if (typeof value.title === 'string') result.title = value.title;
  if (typeof value.detail === 'string') result.detail = value.detail;
  if (typeof value.status === 'number') result.status = value.status;
  if (isRecord(value.errors)) {
    const errors: FieldErrors = {};
    for (const [field, messages] of Object.entries(value.errors)) {
      if (isStringArray(messages)) errors[field] = messages;
    }
    result.errors = errors;
  }
  return ok(result);
};

export function decodeArray<T>(value: unknown, decoder: Decoder<T>, field: string): DecodeResult<T[]> {
  if (!Array.isArray(value)) return fail(field, field + ' must be an array.');
  const decoded: T[] = [];
  for (const item of value) {
    const result = decoder(item);
    if (!result.ok) return { ok: false, errors: result.errors };
    decoded.push(result.value);
  }
  return ok(decoded);
}

export function unwrapDecoded<T>(result: DecodeResult<T>, label: string): T {
  if (result.ok) return result.value;
  throw new ContractDecodeError(label + ' did not match the expected runtime contract.', result.errors);
}
