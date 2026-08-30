import { describe, expect, it } from 'vitest';
import {
  buildIssueQuery,
  isIssuePriority,
  isCalendarDate,
  isIssueSort,
  isIssueStatus,
  isPositiveIntegerId,
  isSortDirection,
  validateIssue,
  type IssueInput,
} from './types';

const validIssue: IssueInput = {
  title: 'Improve keyboard navigation',
  description: 'Keep focus visible throughout the issue workflow.',
  status: 'open',
  priority: 'high',
  assigneeId: 2,
  tags: ['accessibility'],
  dueDate: null,
};

describe('issue validation', () => {
  it('accepts a complete issue', () => {
    expect(validateIssue(validIssue)).toEqual({});
  });

  it('reports an empty title and an overlong description', () => {
    const errors = validateIssue({ ...validIssue, title: '  ', description: 'x'.repeat(5_001) });
    expect(errors.title).toContain('Title is required.');
    expect(errors.description).toContain('Description must be 5,000 characters or fewer.');
  });

  it('rejects a due date in the past', () => {
    expect(validateIssue({ ...validIssue, dueDate: '2000-01-01' }).dueDate).toBeDefined();
  });

  it('rejects a normalized-but-impossible JavaScript date', () => {
    expect(isCalendarDate('2026-02-30')).toBe(false);
    expect(validateIssue({ ...validIssue, dueDate: '2026-02-30' }).dueDate).toContain(
      'Due date must be a real calendar date in YYYY-MM-DD format.',
    );
  });
});

describe('buildIssueQuery', () => {
  it('omits defaults and encodes meaningful filters', () => {
    expect(
      buildIssueQuery({
        page: 1,
        pageSize: 20,
        search: 'focus & keyboard',
        status: 'in_progress',
        sortBy: 'updatedAt',
        sortDirection: 'desc',
      }),
    ).toBe('?search=focus+%26+keyboard&status=in_progress');
  });

  it('includes pagination and sort overrides', () => {
    expect(buildIssueQuery({ page: 3, pageSize: 10, sortBy: 'title', sortDirection: 'asc' })).toBe(
      '?page=3&pageSize=10&sortBy=title&sortDirection=asc',
    );
  });
});

describe('runtime type guards', () => {
  it('accepts values from the source tuples', () => {
    expect(isIssueStatus('in_progress')).toBe(true);
    expect(isIssuePriority('critical')).toBe(true);
    expect(isIssueSort('updatedAt')).toBe(true);
    expect(isSortDirection('asc')).toBe(true);
  });

  it('rejects invalid external values instead of trusting a type assertion', () => {
    expect(isIssueStatus('in-progress')).toBe(false);
    expect(isIssuePriority(3)).toBe(false);
    expect(isIssueSort('assignee')).toBe(false);
    expect(isSortDirection('sideways')).toBe(false);
  });

  it('accepts only positive IDs that JavaScript can represent exactly', () => {
    expect(isPositiveIntegerId(248)).toBe(true);
    expect(isPositiveIntegerId(0)).toBe(false);
    expect(isPositiveIntegerId(1.5)).toBe(false);
    expect(isPositiveIntegerId(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
  });
});
