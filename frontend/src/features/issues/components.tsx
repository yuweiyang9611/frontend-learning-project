'use client';

import { ChevronDown, ChevronLeft, ChevronRight, Filter, MoreHorizontal, Pencil, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MemberAvatar, PriorityMark, StatusBadge, formatRelative } from '@/src/components/ui';
import {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  priorityLabels,
  statusLabels,
  type Issue,
  type IssuePriority,
  type IssueSort,
  type IssueStatus,
  type Member,
  type SortDirection,
} from './types';

export function IssueFilters({
  search,
  status,
  priority,
  assigneeId,
  members,
  resultCount,
  view,
  onSearch,
  onStatus,
  onPriority,
  onAssignee,
  onView,
}: {
  search: string;
  status: IssueStatus | '';
  priority: IssuePriority | '';
  assigneeId?: number;
  members: Member[];
  resultCount: number;
  view: 'page' | 'stream';
  onSearch: (value: string) => void;
  onStatus: (value: IssueStatus | '') => void;
  onPriority: (value: IssuePriority | '') => void;
  onAssignee: (value?: number) => void;
  onView: (value: 'page' | 'stream') => void;
}) {
  const activeCount = Number(Boolean(status)) + Number(Boolean(priority)) + Number(Boolean(assigneeId));
  return (
    <div className="toolbar issue-filters">
      <label className="table-search">
        <Search size={16} />
        <span className="sr-only">Search issues</span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search title or description…"
        />
      </label>
      <label className="select-control">
        <Filter size={15} />
        <span className="sr-only">Filter by status</span>
        <select value={status} onChange={(event) => onStatus(event.target.value as IssueStatus | '')}>
          <option value="">All status</option>
          {ISSUE_STATUSES.map((value) => (
            <option key={value} value={value}>
              {statusLabels[value]}
            </option>
          ))}
        </select>
        <ChevronDown size={13} />
      </label>
      <label className="select-control">
        <span className="sr-only">Filter by priority</span>
        <select value={priority} onChange={(event) => onPriority(event.target.value as IssuePriority | '')}>
          <option value="">All priority</option>
          {ISSUE_PRIORITIES.map((value) => (
            <option key={value} value={value}>
              {priorityLabels[value]}
            </option>
          ))}
        </select>
        <ChevronDown size={13} />
      </label>
      <label className="select-control assignee-filter">
        <span className="sr-only">Filter by assignee</span>
        <select
          value={assigneeId ?? ''}
          onChange={(event) => onAssignee(event.target.value ? Number(event.target.value) : undefined)}
        >
          <option value="">All assignees</option>
          {members.map((member) => (
            <option value={member.id} key={member.id}>
              {member.displayName}
            </option>
          ))}
        </select>
        <ChevronDown size={13} />
      </label>
      <div className="view-segment" aria-label="List loading mode">
        <button className={view === 'page' ? 'active' : ''} type="button" onClick={() => onView('page')}>
          Pages
        </button>
        <button className={view === 'stream' ? 'active' : ''} type="button" onClick={() => onView('stream')}>
          Stream
        </button>
      </div>
      <span className="result-count">
        {resultCount} issues{activeCount > 0 && ` · ${activeCount} filters`}
      </span>
    </div>
  );
}

function SortButton({
  field,
  label,
  sortBy,
  direction,
  onSort,
}: {
  field: IssueSort;
  label: string;
  sortBy: IssueSort;
  direction: SortDirection;
  onSort: (field: IssueSort) => void;
}) {
  const active = field === sortBy;
  return (
    <button
      type="button"
      className={active ? 'sort-button active' : 'sort-button'}
      onClick={() => onSort(field)}
      aria-label={`Sort by ${label} ${active ? direction : ''}`}
    >
      {label}
      {active && <span aria-hidden="true">{direction === 'asc' ? '↑' : '↓'}</span>}
    </button>
  );
}

export function IssueTable({
  issues,
  sortBy,
  direction,
  pendingId,
  onSort,
  onStatus,
  onDelete,
}: {
  issues: Issue[];
  sortBy: IssueSort;
  direction: SortDirection;
  pendingId: number | null;
  onSort: (field: IssueSort) => void;
  onStatus: (issue: Issue, status: IssueStatus) => void;
  onDelete: (issue: Issue) => void;
}) {
  return (
    <div className="table-scroll desktop-issue-list">
      <table className="issue-table">
        <thead>
          <tr>
            <th>
              <input type="checkbox" aria-label="Select all issues" />
            </th>
            <th aria-sort={sortBy === 'title' ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
              <SortButton field="title" label="Issue" sortBy={sortBy} direction={direction} onSort={onSort} />
            </th>
            <th aria-sort={sortBy === 'status' ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
              <SortButton field="status" label="Status" sortBy={sortBy} direction={direction} onSort={onSort} />
            </th>
            <th aria-sort={sortBy === 'priority' ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
              <SortButton field="priority" label="Priority" sortBy={sortBy} direction={direction} onSort={onSort} />
            </th>
            <th>Assignee</th>
            <th aria-sort={sortBy === 'updatedAt' ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
              <SortButton field="updatedAt" label="Updated" sortBy={sortBy} direction={direction} onSort={onSort} />
            </th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr key={issue.id} className={pendingId === issue.id ? 'row-pending' : ''}>
              <td>
                <input type="checkbox" aria-label={`Select ${issue.key}`} />
              </td>
              <td>
                <Link to={`/issues/${issue.id}`}>{issue.title}</Link>
                <small>
                  <b>{issue.key}</b> · {issue.tags.slice(0, 2).join(' · ')}
                </small>
              </td>
              <td>
                <label className="status-select">
                  <span className="sr-only">Change status for {issue.key}</span>
                  <StatusBadge status={issue.status} />
                  <select
                    value={issue.status}
                    onChange={(event) => onStatus(issue, event.target.value as IssueStatus)}
                    disabled={pendingId === issue.id}
                  >
                    {ISSUE_STATUSES.map((value) => (
                      <option value={value} key={value}>
                        {statusLabels[value]}
                      </option>
                    ))}
                  </select>
                </label>
              </td>
              <td>
                <PriorityMark priority={issue.priority} />
              </td>
              <td>
                <span className="assignee">
                  <MemberAvatar member={issue.assignee} size="small" />
                  {issue.assignee?.displayName ?? 'Unassigned'}
                </span>
              </td>
              <td>
                <time dateTime={issue.updatedAt}>{formatRelative(issue.updatedAt)}</time>
              </td>
              <td>
                <details className="row-actions">
                  <summary aria-label={`Actions for ${issue.key}`}>
                    <MoreHorizontal size={17} />
                  </summary>
                  <div>
                    <Link to={`/issues/${issue.id}/edit`}>
                      <Pencil size={14} />
                      Edit
                    </Link>
                    <button type="button" onClick={() => onDelete(issue)}>
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function IssueCards({
  issues,
  pendingId,
  onStatus,
  onDelete,
}: {
  issues: Issue[];
  pendingId: number | null;
  onStatus: (issue: Issue, status: IssueStatus) => void;
  onDelete: (issue: Issue) => void;
}) {
  return (
    <div className="mobile-issue-list">
      {issues.map((issue) => (
        <article className={pendingId === issue.id ? 'issue-card pending' : 'issue-card'} key={issue.id}>
          <header>
            <span>{issue.key}</span>
            <details className="row-actions">
              <summary aria-label={`Actions for ${issue.key}`}>
                <MoreHorizontal size={18} />
              </summary>
              <div>
                <Link to={`/issues/${issue.id}/edit`}>
                  <Pencil size={14} />
                  Edit
                </Link>
                <button type="button" onClick={() => onDelete(issue)}>
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </details>
          </header>
          <Link className="card-title" to={`/issues/${issue.id}`}>
            {issue.title}
          </Link>
          <p>{issue.description}</p>
          <div className="card-tags">
            {issue.tags.slice(0, 2).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <footer>
            <label className="status-select">
              <StatusBadge status={issue.status} />
              <select
                aria-label={`Change status for ${issue.key}`}
                value={issue.status}
                onChange={(event) => onStatus(issue, event.target.value as IssueStatus)}
              >
                {ISSUE_STATUSES.map((value) => (
                  <option value={value} key={value}>
                    {statusLabels[value]}
                  </option>
                ))}
              </select>
            </label>
            <PriorityMark priority={issue.priority} />
            <MemberAvatar member={issue.assignee} size="small" />
          </footer>
        </article>
      ))}
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = total ? (safePage - 1) * pageSize + 1 : 0;
  const end = Math.min(safePage * pageSize, total);
  return (
    <footer className="pagination">
      <span>
        Showing {start}–{end} of {total}
      </span>
      <div>
        <button type="button" onClick={() => onPage(safePage - 1)} disabled={safePage <= 1}>
          <ChevronLeft size={14} />
          Previous
        </button>
        <span>
          Page <b>{safePage}</b> of {pageCount}
        </span>
        <button type="button" onClick={() => onPage(safePage + 1)} disabled={safePage >= pageCount}>
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </footer>
  );
}
