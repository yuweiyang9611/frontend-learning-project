import { env } from 'cloudflare:workers';
import { seedAttachments, seedComments, seedIssues, seedMembers } from '@/src/data/seed';
import {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  validateIssue,
  type Attachment,
  type Comment,
  type FieldErrors,
  type Issue,
  type IssueInput,
  type IssuePriority,
  type IssueQuery,
  type IssueSort,
  type IssueStatus,
  type IssueUpdate,
  type Member,
  type PagedResult,
  type SortDirection,
} from '@/src/features/issues/types';

type RuntimeEnv = { DB: D1Database; UPLOADS?: R2Bucket };

interface IssueRow {
  id: number;
  issue_key: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  tags_json: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  assignee_id: number | null;
  assignee_name: string | null;
  assignee_email: string | null;
  assignee_avatar: string | null;
  assignee_role: Member['role'] | null;
  assignee_initials: string | null;
  assignee_color: Member['color'] | null;
  reporter_id: number;
  reporter_name: string;
  reporter_email: string;
  reporter_avatar: string | null;
  reporter_role: Member['role'];
  reporter_initials: string;
  reporter_color: Member['color'];
}

interface MemberRow {
  id: number;
  display_name: string;
  email: string;
  avatar_url: string | null;
  role: Member['role'];
  initials: string;
  color: Member['color'];
}

interface CommentRow {
  id: number;
  issue_id: number;
  body: string;
  created_at: string;
  author_id: number;
  author_name: string;
  author_email: string;
  author_avatar: string | null;
  author_role: Member['role'];
  author_initials: string;
  author_color: Member['color'];
}

interface AttachmentRow {
  id: number;
  issue_id: number;
  object_key: string | null;
  original_file_name: string;
  content_type: string;
  size: number;
  created_at: string;
}

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY,
    display_name TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE,
    avatar_url TEXT,
    role TEXT NOT NULL,
    initials TEXT NOT NULL,
    color TEXT NOT NULL
  )`,
  'CREATE UNIQUE INDEX IF NOT EXISTS ux_members_email ON members(email)',
  `CREATE TABLE IF NOT EXISTS issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issue_key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL COLLATE NOCASE UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL CHECK(status IN ('open','in_progress','resolved','closed')),
    priority TEXT NOT NULL CHECK(priority IN ('low','medium','high','critical')),
    assignee_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
    reporter_id INTEGER NOT NULL REFERENCES members(id),
    tags_json TEXT NOT NULL DEFAULT '[]',
    due_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS idx_issues_updated_at ON issues(updated_at DESC, id DESC)',
  'CREATE INDEX IF NOT EXISTS idx_issues_status_updated_at ON issues(status, updated_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_issues_priority_updated_at ON issues(priority, updated_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_issues_assignee_updated_at ON issues(assignee_id, updated_at DESC)',
  `CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES members(id),
    body TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS idx_comments_issue_created_at ON comments(issue_id, created_at)',
  `CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    object_key TEXT,
    original_file_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    created_at TEXT NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS idx_attachments_issue_created_at ON attachments(issue_id, created_at)',
  `CREATE TABLE IF NOT EXISTS local_sessions (
    token_hash TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    initials TEXT NOT NULL,
    expires_at TEXT NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS idx_local_sessions_expires_at ON local_sessions(expires_at)',
];

let initialization: Promise<void> | undefined;

export function runtimeEnv(): RuntimeEnv {
  return env as unknown as RuntimeEnv;
}

async function initialize(database: D1Database) {
  await database.batch(schemaStatements.map((sql) => database.prepare(sql)));
  const memberCount = await database.prepare('SELECT COUNT(*) AS count FROM members').first<{ count: number }>();
  if (Number(memberCount?.count ?? 0) === 0) {
    await database.batch(
      seedMembers.map((member) =>
        database
          .prepare(
            `INSERT INTO members (id, display_name, email, avatar_url, role, initials, color)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            member.id,
            member.displayName,
            member.email,
            member.avatarUrl,
            member.role,
            member.initials,
            member.color,
          ),
      ),
    );
  }

  const issueCount = await database.prepare('SELECT COUNT(*) AS count FROM issues').first<{ count: number }>();
  if (Number(issueCount?.count ?? 0) === 0) {
    await database.batch(
      seedIssues.map((issue) =>
        database
          .prepare(
            `INSERT INTO issues
       (id, issue_key, title, description, status, priority, assignee_id, reporter_id, tags_json, due_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            issue.id,
            issue.key,
            issue.title,
            issue.description,
            issue.status,
            issue.priority,
            issue.assignee?.id ?? null,
            issue.reporter.id,
            JSON.stringify(issue.tags),
            issue.dueDate,
            issue.createdAt,
            issue.updatedAt,
          ),
      ),
    );

    if (seedComments.length) {
      await database.batch(
        seedComments.map((comment) =>
          database
            .prepare('INSERT INTO comments (id, issue_id, author_id, body, created_at) VALUES (?, ?, ?, ?, ?)')
            .bind(comment.id, comment.issueId, comment.author.id, comment.body, comment.createdAt),
        ),
      );
    }
    if (seedAttachments.length) {
      await database.batch(
        seedAttachments.map((attachment) =>
          database
            .prepare(
              `INSERT INTO attachments
         (id, issue_id, object_key, original_file_name, content_type, size, created_at)
         VALUES (?, ?, NULL, ?, ?, ?, ?)`,
            )
            .bind(
              attachment.id,
              attachment.issueId,
              attachment.originalFileName,
              attachment.contentType,
              attachment.size,
              attachment.createdAt,
            ),
        ),
      );
    }
  }
  await database.prepare('PRAGMA optimize').run();
}

export async function getDatabase() {
  const database = runtimeEnv().DB;
  if (!database) throw new Error('The DB binding is unavailable.');
  initialization ??= initialize(database).catch((error) => {
    initialization = undefined;
    throw error;
  });
  await initialization;
  return database;
}

function memberFromRow(row: MemberRow): Member {
  return {
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    avatarUrl: row.avatar_url,
    role: row.role,
    initials: row.initials,
    color: row.color,
  };
}

function issueFromRow(row: IssueRow): Issue {
  const assignee =
    row.assignee_id === null
      ? null
      : ({
          id: row.assignee_id,
          displayName: row.assignee_name ?? '',
          email: row.assignee_email ?? '',
          avatarUrl: row.assignee_avatar,
          role: row.assignee_role ?? 'Developer',
          initials: row.assignee_initials ?? '',
          color: row.assignee_color ?? 'violet',
        } satisfies Member);
  return {
    id: row.id,
    key: row.issue_key,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assignee,
    reporter: {
      id: row.reporter_id,
      displayName: row.reporter_name,
      email: row.reporter_email,
      avatarUrl: row.reporter_avatar,
      role: row.reporter_role,
      initials: row.reporter_initials,
      color: row.reporter_color,
    },
    tags: safeTags(row.tags_json),
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function safeTags(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((tag): tag is string => typeof tag === 'string') : [];
  } catch {
    return [];
  }
}

const issueSelect = `
  SELECT i.id, i.issue_key, i.title, i.description, i.status, i.priority,
         i.tags_json, i.due_date, i.created_at, i.updated_at,
         a.id AS assignee_id, a.display_name AS assignee_name, a.email AS assignee_email,
         a.avatar_url AS assignee_avatar, a.role AS assignee_role,
         a.initials AS assignee_initials, a.color AS assignee_color,
         r.id AS reporter_id, r.display_name AS reporter_name, r.email AS reporter_email,
         r.avatar_url AS reporter_avatar, r.role AS reporter_role,
         r.initials AS reporter_initials, r.color AS reporter_color
  FROM issues i
  LEFT JOIN members a ON a.id = i.assignee_id
  INNER JOIN members r ON r.id = i.reporter_id`;

export async function listMembers(): Promise<Member[]> {
  const database = await getDatabase();
  const result = await database
    .prepare(
      `SELECT id, display_name, email, avatar_url, role, initials, color
     FROM members ORDER BY display_name COLLATE NOCASE`,
    )
    .all<MemberRow>();
  return result.results.map(memberFromRow);
}

export async function memberIdForRequest(request: Request): Promise<number> {
  const database = await getDatabase();
  const email = request.headers.get('oai-authenticated-user-email');
  if (email) {
    const member = await database
      .prepare('SELECT id FROM members WHERE email = ? COLLATE NOCASE')
      .bind(email)
      .first<{ id: number }>();
    if (member) return member.id;
  }
  return 1;
}

export async function memberIdForEmail(email: string): Promise<number> {
  const database = await getDatabase();
  const member = await database
    .prepare('SELECT id FROM members WHERE email = ? COLLATE NOCASE')
    .bind(email)
    .first<{ id: number }>();
  return member?.id ?? 1;
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

export async function listIssues(query: IssueQuery): Promise<PagedResult<Issue>> {
  const database = await getDatabase();
  const where: string[] = [];
  const values: unknown[] = [];
  if (query.search?.trim()) {
    where.push("(i.title LIKE ? ESCAPE '\\' OR i.description LIKE ? ESCAPE '\\' OR i.issue_key LIKE ? ESCAPE '\\')");
    const needle = `%${escapeLike(query.search.trim())}%`;
    values.push(needle, needle, needle);
  }
  if (query.status) {
    where.push('i.status = ?');
    values.push(query.status);
  }
  if (query.priority) {
    where.push('i.priority = ?');
    values.push(query.priority);
  }
  if (query.assigneeId) {
    where.push('i.assignee_id = ?');
    values.push(query.assigneeId);
  }
  const whereSql = where.length ? ` WHERE ${where.join(' AND ')}` : '';
  const sortMap: Record<IssueSort, string> = {
    createdAt: 'i.created_at',
    updatedAt: 'i.updated_at',
    title: 'i.title COLLATE NOCASE',
    priority: "CASE i.priority WHEN 'critical' THEN 3 WHEN 'high' THEN 2 WHEN 'medium' THEN 1 ELSE 0 END",
    status: "CASE i.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'resolved' THEN 2 ELSE 3 END",
  };
  const direction = query.sortDirection === 'asc' ? 'ASC' : 'DESC';
  const page = Math.max(1, Math.floor(query.page || 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(query.pageSize || 20)));
  const count = await database
    .prepare(`SELECT COUNT(*) AS count FROM issues i${whereSql}`)
    .bind(...values)
    .first<{ count: number }>();
  const result = await database
    .prepare(
      `${issueSelect}${whereSql} ORDER BY ${sortMap[query.sortBy ?? 'updatedAt']} ${direction}, i.id ${direction} LIMIT ? OFFSET ?`,
    )
    .bind(...values, pageSize, (page - 1) * pageSize)
    .all<IssueRow>();
  return { items: result.results.map(issueFromRow), page, pageSize, total: Number(count?.count ?? 0) };
}

export async function findIssue(id: number): Promise<Issue | null> {
  const database = await getDatabase();
  const row = await database.prepare(`${issueSelect} WHERE i.id = ?`).bind(id).first<IssueRow>();
  return row ? issueFromRow(row) : null;
}

export function normalizeIssueInput(input: Partial<IssueInput>, current?: Issue): IssueInput {
  return {
    title: input.title ?? current?.title ?? '',
    description: input.description ?? current?.description ?? '',
    status: input.status ?? current?.status ?? 'open',
    priority: input.priority ?? current?.priority ?? 'medium',
    assigneeId: input.assigneeId === undefined ? (current?.assignee?.id ?? null) : input.assigneeId,
    tags: input.tags ?? current?.tags ?? [],
    dueDate: input.dueDate === undefined ? (current?.dueDate ?? null) : input.dueDate,
  };
}

export function validateServerIssue(input: IssueInput): FieldErrors {
  const errors = validateIssue(input);
  if (!ISSUE_STATUSES.includes(input.status)) errors.status = ['Choose a valid status.'];
  if (!ISSUE_PRIORITIES.includes(input.priority)) errors.priority = ['Choose a valid priority.'];
  if (!Array.isArray(input.tags) || input.tags.some((tag) => typeof tag !== 'string' || tag.trim().length > 30)) {
    errors.tags = ['Tags must be a list of names no longer than 30 characters.'];
  }
  return errors;
}

export async function duplicateTitle(title: string, excludingId?: number) {
  const database = await getDatabase();
  const sql = excludingId
    ? 'SELECT id FROM issues WHERE title = ? COLLATE NOCASE AND id != ?'
    : 'SELECT id FROM issues WHERE title = ? COLLATE NOCASE';
  return Boolean(
    await database
      .prepare(sql)
      .bind(title.trim(), ...(excludingId ? [excludingId] : []))
      .first(),
  );
}

export async function saveIssue(input: IssueInput, reporterId: number): Promise<Issue> {
  const database = await getDatabase();
  const next = await database.prepare('SELECT COALESCE(MAX(id), 0) + 1 AS id FROM issues').first<{ id: number }>();
  const id = Number(next?.id ?? 1);
  const now = new Date().toISOString();
  await database
    .prepare(
      `INSERT INTO issues
     (id, issue_key, title, description, status, priority, assignee_id, reporter_id, tags_json, due_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      `IF-${id}`,
      input.title.trim(),
      input.description.trim(),
      input.status,
      input.priority,
      input.assigneeId,
      reporterId,
      JSON.stringify(input.tags.map((tag) => tag.trim()).filter(Boolean)),
      input.dueDate,
      now,
      now,
    )
    .run();
  return (await findIssue(id))!;
}

export async function updateIssue(id: number, update: IssueUpdate, current: Issue): Promise<Issue> {
  const database = await getDatabase();
  const input = normalizeIssueInput(update, current);
  await database
    .prepare(
      `UPDATE issues SET title = ?, description = ?, status = ?, priority = ?, assignee_id = ?,
     tags_json = ?, due_date = ?, updated_at = ? WHERE id = ?`,
    )
    .bind(
      input.title.trim(),
      input.description.trim(),
      input.status,
      input.priority,
      input.assigneeId,
      JSON.stringify(input.tags.map((tag) => tag.trim()).filter(Boolean)),
      input.dueDate,
      new Date().toISOString(),
      id,
    )
    .run();
  return (await findIssue(id))!;
}

export async function deleteIssue(id: number) {
  const database = await getDatabase();
  const attachments = await database
    .prepare('SELECT object_key FROM attachments WHERE issue_id = ? AND object_key IS NOT NULL')
    .bind(id)
    .all<{ object_key: string }>();
  await database.prepare('DELETE FROM issues WHERE id = ?').bind(id).run();
  const bucket = runtimeEnv().UPLOADS;
  if (bucket) await Promise.all(attachments.results.map(({ object_key }) => bucket.delete(object_key)));
}

export async function listComments(issueId: number): Promise<Comment[]> {
  const database = await getDatabase();
  const result = await database
    .prepare(
      `SELECT c.id, c.issue_id, c.body, c.created_at,
            m.id AS author_id, m.display_name AS author_name, m.email AS author_email,
            m.avatar_url AS author_avatar, m.role AS author_role,
            m.initials AS author_initials, m.color AS author_color
     FROM comments c INNER JOIN members m ON m.id = c.author_id
     WHERE c.issue_id = ? ORDER BY c.created_at, c.id`,
    )
    .bind(issueId)
    .all<CommentRow>();
  return result.results.map((row) => ({
    id: row.id,
    issueId: row.issue_id,
    body: row.body,
    createdAt: row.created_at,
    author: {
      id: row.author_id,
      displayName: row.author_name,
      email: row.author_email,
      avatarUrl: row.author_avatar,
      role: row.author_role,
      initials: row.author_initials,
      color: row.author_color,
    },
  }));
}

export async function addComment(issueId: number, authorId: number, body: string): Promise<Comment> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  const result = await database
    .prepare('INSERT INTO comments (issue_id, author_id, body, created_at) VALUES (?, ?, ?, ?)')
    .bind(issueId, authorId, body.trim(), now)
    .run();
  const id = Number((result.meta as { last_row_id?: number }).last_row_id);
  return (await listComments(issueId)).find((comment) => comment.id === id)!;
}

export async function removeComment(issueId: number, commentId: number) {
  const database = await getDatabase();
  const result = await database
    .prepare('DELETE FROM comments WHERE issue_id = ? AND id = ?')
    .bind(issueId, commentId)
    .run();
  return Number(result.meta.changes ?? 0) > 0;
}

function attachmentFromRow(row: AttachmentRow): Attachment {
  return {
    id: row.id,
    issueId: row.issue_id,
    originalFileName: row.original_file_name,
    contentType: row.content_type,
    size: row.size,
    createdAt: row.created_at,
    downloadUrl: row.object_key ? `/api/attachments/${row.id}` : null,
  };
}

export async function listAttachments(issueId: number): Promise<Attachment[]> {
  const database = await getDatabase();
  const result = await database
    .prepare(
      `SELECT id, issue_id, object_key, original_file_name, content_type, size, created_at
     FROM attachments WHERE issue_id = ? ORDER BY created_at DESC, id DESC`,
    )
    .bind(issueId)
    .all<AttachmentRow>();
  return result.results.map(attachmentFromRow);
}

export async function addAttachment(issueId: number, file: File): Promise<Attachment> {
  const database = await getDatabase();
  const bucket = runtimeEnv().UPLOADS;
  if (!bucket) throw new Error('The UPLOADS binding is unavailable.');
  const objectKey = `issues/${issueId}/${crypto.randomUUID()}`;
  await bucket.put(objectKey, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { originalFileName: file.name, issueId: String(issueId) },
  });
  try {
    const result = await database
      .prepare(
        `INSERT INTO attachments (issue_id, object_key, original_file_name, content_type, size, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(issueId, objectKey, file.name, file.type, file.size, new Date().toISOString())
      .run();
    const id = Number((result.meta as { last_row_id?: number }).last_row_id);
    const row = await database
      .prepare(
        'SELECT id, issue_id, object_key, original_file_name, content_type, size, created_at FROM attachments WHERE id = ?',
      )
      .bind(id)
      .first<AttachmentRow>();
    return attachmentFromRow(row!);
  } catch (error) {
    await bucket.delete(objectKey);
    throw error;
  }
}

export async function findAttachment(id: number): Promise<AttachmentRow | null> {
  const database = await getDatabase();
  return await database
    .prepare(
      'SELECT id, issue_id, object_key, original_file_name, content_type, size, created_at FROM attachments WHERE id = ?',
    )
    .bind(id)
    .first<AttachmentRow>();
}

export function parseIssueQuery(searchParams: URLSearchParams): IssueQuery {
  const rawStatus = searchParams.get('status') ?? '';
  const rawPriority = searchParams.get('priority') ?? '';
  const rawSort = searchParams.get('sortBy') ?? 'updatedAt';
  const rawDirection = searchParams.get('sortDirection') ?? 'desc';
  const allowedSorts: IssueSort[] = ['createdAt', 'updatedAt', 'title', 'priority', 'status'];
  return {
    page: Math.max(1, Number(searchParams.get('page')) || 1),
    pageSize: Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 20)),
    search: searchParams.get('search')?.slice(0, 200) ?? '',
    status: ISSUE_STATUSES.includes(rawStatus as IssueStatus) ? (rawStatus as IssueStatus) : '',
    priority: ISSUE_PRIORITIES.includes(rawPriority as IssuePriority) ? (rawPriority as IssuePriority) : '',
    assigneeId: Number(searchParams.get('assigneeId')) || undefined,
    sortBy: allowedSorts.includes(rawSort as IssueSort) ? (rawSort as IssueSort) : 'updatedAt',
    sortDirection: (rawDirection === 'asc' ? 'asc' : 'desc') as SortDirection,
  };
}
