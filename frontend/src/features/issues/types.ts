export const ISSUE_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
export const ISSUE_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export const ISSUE_SORTS = ['createdAt', 'updatedAt', 'title', 'priority', 'status'] as const;
export const SORT_DIRECTIONS = ['asc', 'desc'] as const;

export type IssueStatus = (typeof ISSUE_STATUSES)[number];
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number];
export type SortDirection = (typeof SORT_DIRECTIONS)[number];
export type IssueSort = (typeof ISSUE_SORTS)[number];

export interface Member {
  id: number;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: 'Admin' | 'Developer' | 'Designer' | 'Product';
  initials: string;
  color: 'violet' | 'blue' | 'orange' | 'green' | 'rose' | 'teal';
}

export interface Issue {
  id: number;
  key: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  assignee: Member | null;
  reporter: Member;
  tags: string[];
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  issueId: number;
  author: Member;
  body: string;
  createdAt: string;
}

export interface Attachment {
  id: number;
  issueId: number;
  originalFileName: string;
  contentType: string;
  size: number;
  createdAt: string;
  downloadUrl: string | null;
}

export interface IssueQuery {
  page: number;
  pageSize: number;
  search?: string;
  status?: IssueStatus | '';
  priority?: IssuePriority | '';
  assigneeId?: number;
  sortBy?: IssueSort;
  sortDirection?: SortDirection;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface IssueInput {
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeId: number | null;
  tags: string[];
  dueDate: string | null;
}

export type IssueUpdate = Partial<IssueInput>;

export interface FieldErrors {
  title?: string[];
  description?: string[];
  dueDate?: string[];
  [field: string]: string[] | undefined;
}

export interface Session {
  email: string;
  displayName: string;
  initials: string;
  role: 'Admin' | 'Member';
}

export const statusLabels = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
} as const satisfies Record<IssueStatus, string>;

export const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
} as const satisfies Record<IssuePriority, string>;

function isOneOf<const Values extends readonly string[]>(values: Values, value: unknown): value is Values[number] {
  return typeof value === 'string' && (values as readonly string[]).includes(value);
}

export const isIssueStatus = (value: unknown): value is IssueStatus => isOneOf(ISSUE_STATUSES, value);
export const isIssuePriority = (value: unknown): value is IssuePriority => isOneOf(ISSUE_PRIORITIES, value);
export const isIssueSort = (value: unknown): value is IssueSort => isOneOf(ISSUE_SORTS, value);
export const isSortDirection = (value: unknown): value is SortDirection => isOneOf(SORT_DIRECTIONS, value);
export const isPositiveIntegerId = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

export function validateIssue(input: IssueInput): FieldErrors {
  const errors: FieldErrors = {};
  const title = input.title.trim();
  if (!title) errors.title = ['Title is required.'];
  else if (title.length > 100) errors.title = ['Title must be 100 characters or fewer.'];
  if (input.description.length > 5000) errors.description = ['Description must be 5,000 characters or fewer.'];
  if (input.dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(`${input.dueDate}T00:00:00`) < today) errors.dueDate = ['Due date cannot be in the past.'];
  }
  return errors;
}

export function buildIssueQuery(query: Partial<IssueQuery>): string {
  const params = new URLSearchParams();
  if (query.page && query.page !== 1) params.set('page', String(query.page));
  if (query.pageSize && query.pageSize !== 20) params.set('pageSize', String(query.pageSize));
  if (query.search) params.set('search', query.search);
  if (query.status) params.set('status', query.status);
  if (query.priority) params.set('priority', query.priority);
  if (query.assigneeId) params.set('assigneeId', String(query.assigneeId));
  if (query.sortBy && query.sortBy !== 'updatedAt') params.set('sortBy', query.sortBy);
  if (query.sortDirection && query.sortDirection !== 'desc') params.set('sortDirection', query.sortDirection);
  const value = params.toString();
  return value ? `?${value}` : '';
}
