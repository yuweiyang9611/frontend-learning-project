import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const members = sqliteTable(
  'members',
  {
    id: integer('id').primaryKey(),
    displayName: text('display_name').notNull(),
    email: text('email').notNull(),
    avatarUrl: text('avatar_url'),
    role: text('role').notNull(),
    initials: text('initials').notNull(),
    color: text('color').notNull(),
  },
  (table) => [uniqueIndex('ux_members_email').on(table.email)],
);

export const issues = sqliteTable(
  'issues',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    issueKey: text('issue_key').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    status: text('status').notNull(),
    priority: text('priority').notNull(),
    assigneeId: integer('assignee_id').references(() => members.id, { onDelete: 'set null' }),
    reporterId: integer('reporter_id')
      .notNull()
      .references(() => members.id),
    tagsJson: text('tags_json').notNull().default('[]'),
    dueDate: text('due_date'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('ux_issues_issue_key').on(table.issueKey),
    uniqueIndex('ux_issues_title_nocase').on(table.title),
    index('idx_issues_updated_at').on(table.updatedAt),
    index('idx_issues_status_updated_at').on(table.status, table.updatedAt),
    index('idx_issues_priority_updated_at').on(table.priority, table.updatedAt),
    index('idx_issues_assignee_updated_at').on(table.assigneeId, table.updatedAt),
  ],
);

export const comments = sqliteTable(
  'comments',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    issueId: integer('issue_id')
      .notNull()
      .references(() => issues.id, { onDelete: 'cascade' }),
    authorId: integer('author_id')
      .notNull()
      .references(() => members.id),
    body: text('body').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('idx_comments_issue_created_at').on(table.issueId, table.createdAt)],
);

export const attachments = sqliteTable(
  'attachments',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    issueId: integer('issue_id')
      .notNull()
      .references(() => issues.id, { onDelete: 'cascade' }),
    objectKey: text('object_key'),
    originalFileName: text('original_file_name').notNull(),
    contentType: text('content_type').notNull(),
    size: integer('size').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('idx_attachments_issue_created_at').on(table.issueId, table.createdAt)],
);

export const localSessions = sqliteTable(
  'local_sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    initials: text('initials').notNull(),
    expiresAt: text('expires_at').notNull(),
  },
  (table) => [index('idx_local_sessions_expires_at').on(table.expiresAt)],
);
