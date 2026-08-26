import { seedAttachments, seedComments, seedIssues, seedMembers } from '@/src/data/seed';
import {
  buildIssueQuery,
  validateIssue,
  type Attachment,
  type Comment,
  type FieldErrors,
  type Issue,
  type IssueInput,
  type IssueQuery,
  type IssueUpdate,
  type Member,
  type PagedResult,
  type Session,
} from '@/src/features/issues/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';
const USE_HTTP_API = process.env.NEXT_PUBLIC_DEMO_MODE !== 'local';
const DB_KEY = 'issueflow-demo-db-v3';
const SESSION_KEY = 'issueflow-session';

interface LocalDatabase {
  issues: Issue[];
  members: Member[];
  comments: Comment[];
  attachments: Attachment[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors: FieldErrors = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const pause = (ms = 220) => new Promise((resolve) => window.setTimeout(resolve, ms));

function freshDatabase(): LocalDatabase {
  return clone({ issues: seedIssues, members: seedMembers, comments: seedComments, attachments: seedAttachments });
}

function readDatabase(): LocalDatabase {
  const stored = localStorage.getItem(DB_KEY);
  if (!stored) {
    const database = freshDatabase();
    localStorage.setItem(DB_KEY, JSON.stringify(database));
    return database;
  }
  try {
    return JSON.parse(stored) as LocalDatabase;
  } catch {
    const database = freshDatabase();
    localStorage.setItem(DB_KEY, JSON.stringify(database));
    return database;
  }
}

function writeDatabase(database: LocalDatabase) {
  localStorage.setItem(DB_KEY, JSON.stringify(database));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: init?.body instanceof FormData ? init.headers : { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    let problem: { title?: string; detail?: string; errors?: FieldErrors } = {};
    try {
      problem = (await response.json()) as typeof problem;
    } catch {
      /* non-JSON failure */
    }
    throw new ApiError(
      problem.detail ?? problem.title ?? `Request failed with status ${response.status}.`,
      response.status,
      problem.errors ?? {},
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const priorityRank = { low: 0, medium: 1, high: 2, critical: 3 } as const;
const statusRank = { open: 0, in_progress: 1, resolved: 2, closed: 3 } as const;

async function mockList(query: IssueQuery): Promise<PagedResult<Issue>> {
  await pause();
  const database = readDatabase();
  const needle = query.search?.trim().toLowerCase();
  const filtered = database.issues.filter((issue) => {
    if (needle && !`${issue.title} ${issue.description} ${issue.key}`.toLowerCase().includes(needle)) return false;
    if (query.status && issue.status !== query.status) return false;
    if (query.priority && issue.priority !== query.priority) return false;
    if (query.assigneeId && issue.assignee?.id !== query.assigneeId) return false;
    return true;
  });
  const direction = query.sortDirection === 'asc' ? 1 : -1;
  const sortBy = query.sortBy ?? 'updatedAt';
  filtered.sort((left, right) => {
    if (sortBy === 'priority') return (priorityRank[left.priority] - priorityRank[right.priority]) * direction;
    if (sortBy === 'status') return (statusRank[left.status] - statusRank[right.status]) * direction;
    return String(left[sortBy]).localeCompare(String(right[sortBy])) * direction;
  });
  const start = (query.page - 1) * query.pageSize;
  return {
    items: clone(filtered.slice(start, start + query.pageSize)),
    page: query.page,
    pageSize: query.pageSize,
    total: filtered.length,
  };
}

async function mockGetIssue(id: number): Promise<Issue> {
  await pause(160);
  const issue = readDatabase().issues.find((item) => item.id === id);
  if (!issue) throw new ApiError('The requested issue could not be found.', 404);
  return clone(issue);
}

async function mockCreateIssue(input: IssueInput): Promise<Issue> {
  await pause(320);
  const errors = validateIssue(input);
  if (Object.keys(errors).length) throw new ApiError('Please correct the highlighted fields.', 400, errors);
  const database = readDatabase();
  if (database.issues.some((issue) => issue.title.toLowerCase() === input.title.trim().toLowerCase())) {
    throw new ApiError('An issue with this title already exists.', 409, {
      title: ['An issue with this title already exists.'],
    });
  }
  const id = Math.max(0, ...database.issues.map((issue) => issue.id)) + 1;
  const now = new Date().toISOString();
  const issue: Issue = {
    id,
    key: `IF-${id}`,
    title: input.title.trim(),
    description: input.description.trim(),
    status: input.status,
    priority: input.priority,
    assignee: database.members.find((member) => member.id === input.assigneeId) ?? null,
    reporter: database.members[0],
    tags: input.tags,
    dueDate: input.dueDate,
    createdAt: now,
    updatedAt: now,
  };
  database.issues.unshift(issue);
  writeDatabase(database);
  return clone(issue);
}

async function mockUpdateIssue(id: number, update: IssueUpdate): Promise<Issue> {
  await pause(260);
  const database = readDatabase();
  const index = database.issues.findIndex((issue) => issue.id === id);
  if (index < 0) throw new ApiError('The requested issue could not be found.', 404);
  const current = database.issues[index];
  const input: IssueInput = {
    title: update.title ?? current.title,
    description: update.description ?? current.description,
    status: update.status ?? current.status,
    priority: update.priority ?? current.priority,
    assigneeId: update.assigneeId === undefined ? (current.assignee?.id ?? null) : update.assigneeId,
    tags: update.tags ?? current.tags,
    dueDate: update.dueDate === undefined ? current.dueDate : update.dueDate,
  };
  const errors = validateIssue(input);
  if (Object.keys(errors).length) throw new ApiError('Please correct the highlighted fields.', 400, errors);
  const updated: Issue = {
    ...current,
    ...input,
    assignee: database.members.find((member) => member.id === input.assigneeId) ?? null,
    updatedAt: new Date().toISOString(),
  };
  database.issues[index] = updated;
  writeDatabase(database);
  return clone(updated);
}

async function mockDeleteIssue(id: number): Promise<void> {
  await pause(260);
  const database = readDatabase();
  if (!database.issues.some((issue) => issue.id === id))
    throw new ApiError('The requested issue could not be found.', 404);
  database.issues = database.issues.filter((issue) => issue.id !== id);
  database.comments = database.comments.filter((comment) => comment.issueId !== id);
  database.attachments = database.attachments.filter((attachment) => attachment.issueId !== id);
  writeDatabase(database);
}

async function mockComments(issueId: number): Promise<Comment[]> {
  await pause(140);
  return clone(
    readDatabase()
      .comments.filter((comment) => comment.issueId === issueId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  );
}

async function mockAddComment(issueId: number, body: string): Promise<Comment> {
  await pause(240);
  if (!body.trim()) throw new ApiError('Comment cannot be empty.', 400, { body: ['Comment cannot be empty.'] });
  const database = readDatabase();
  if (!database.issues.some((issue) => issue.id === issueId))
    throw new ApiError('The requested issue could not be found.', 404);
  const comment: Comment = {
    id: Math.max(0, ...database.comments.map((item) => item.id)) + 1,
    issueId,
    author: database.members[0],
    body: body.trim(),
    createdAt: new Date().toISOString(),
  };
  database.comments.push(comment);
  writeDatabase(database);
  return clone(comment);
}

async function mockDeleteComment(issueId: number, commentId: number): Promise<void> {
  await pause(180);
  const database = readDatabase();
  const originalLength = database.comments.length;
  database.comments = database.comments.filter((comment) => !(comment.issueId === issueId && comment.id === commentId));
  if (database.comments.length === originalLength) throw new ApiError('The requested comment could not be found.', 404);
  writeDatabase(database);
}

async function mockUpload(issueId: number, file: File): Promise<Attachment> {
  await pause(480);
  const allowed = ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'];
  if (file.size > 5 * 1024 * 1024) throw new ApiError('Files must be 5 MB or smaller.', 400);
  if (!allowed.includes(file.type)) throw new ApiError('Upload a PNG, JPEG, PDF, or text file.', 400);
  const database = readDatabase();
  const attachment: Attachment = {
    id: Math.max(0, ...database.attachments.map((item) => item.id)) + 1,
    issueId,
    originalFileName: file.name,
    contentType: file.type,
    size: file.size,
    createdAt: new Date().toISOString(),
    downloadUrl: null,
  };
  database.attachments.push(attachment);
  writeDatabase(database);
  return clone(attachment);
}

export const issueflowApi = {
  listIssues: (query: IssueQuery) =>
    USE_HTTP_API ? request<PagedResult<Issue>>(`/api/issues${buildIssueQuery(query)}`) : mockList(query),
  getIssue: (id: number) => (USE_HTTP_API ? request<Issue>(`/api/issues/${id}`) : mockGetIssue(id)),
  createIssue: (input: IssueInput) =>
    USE_HTTP_API
      ? request<Issue>('/api/issues', { method: 'POST', body: JSON.stringify(input) })
      : mockCreateIssue(input),
  updateIssue: (id: number, update: IssueUpdate) =>
    USE_HTTP_API
      ? request<Issue>(`/api/issues/${id}`, { method: 'PATCH', body: JSON.stringify(update) })
      : mockUpdateIssue(id, update),
  deleteIssue: (id: number) =>
    USE_HTTP_API ? request<void>(`/api/issues/${id}`, { method: 'DELETE' }) : mockDeleteIssue(id),
  getMembers: async () =>
    USE_HTTP_API ? request<Member[]>('/api/members') : (await pause(120), clone(readDatabase().members)),
  getComments: (issueId: number) =>
    USE_HTTP_API ? request<Comment[]>(`/api/issues/${issueId}/comments`) : mockComments(issueId),
  addComment: (issueId: number, body: string) =>
    USE_HTTP_API
      ? request<Comment>(`/api/issues/${issueId}/comments`, { method: 'POST', body: JSON.stringify({ body }) })
      : mockAddComment(issueId, body),
  deleteComment: (issueId: number, commentId: number) =>
    USE_HTTP_API
      ? request<void>(`/api/issues/${issueId}/comments/${commentId}`, { method: 'DELETE' })
      : mockDeleteComment(issueId, commentId),
  getAttachments: async (issueId: number) =>
    USE_HTTP_API
      ? request<Attachment[]>(`/api/issues/${issueId}/attachments`)
      : (await pause(120), clone(readDatabase().attachments.filter((item) => item.issueId === issueId))),
  uploadAttachment: async (issueId: number, file: File) => {
    if (!USE_HTTP_API) return mockUpload(issueId, file);
    const body = new FormData();
    body.append('file', file);
    return request<Attachment>(`/api/issues/${issueId}/attachments`, { method: 'POST', body });
  },
  login: async (email: string, password: string): Promise<Session> => {
    let session: Session;
    if (USE_HTTP_API) {
      session = await request<Session>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    } else {
      await pause(420);
      if (!/^\S+@\S+\.\S+$/.test(email))
        throw new ApiError('Enter a valid email address.', 400, { email: ['Enter a valid email address.'] });
      if (password.length < 6)
        throw new ApiError('Password must contain at least 6 characters.', 400, {
          password: ['Password must contain at least 6 characters.'],
        });
      session = {
        email,
        displayName: email.startsWith('demo') ? 'Jordan Davis' : email.split('@')[0],
        initials: email.startsWith('demo') ? 'JD' : email.slice(0, 2).toUpperCase(),
        role: 'Admin',
      };
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },
  logout: async () => {
    if (USE_HTTP_API) await request<void>('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem(SESSION_KEY);
  },
  restoreSession: async (): Promise<Session | null> => {
    if (!USE_HTTP_API) return issueflowApi.getStoredSession();
    try {
      const session = await request<Session>('/api/auth/session');
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return session;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return issueflowApi.getStoredSession();
    }
  },
  getStoredSession: (): Session | null => {
    const value = localStorage.getItem(SESSION_KEY);
    try {
      return value ? (JSON.parse(value) as Session) : null;
    } catch {
      return null;
    }
  },
  resetDemo: () => {
    if (!USE_HTTP_API) localStorage.setItem(DB_KEY, JSON.stringify(freshDatabase()));
  },
};
