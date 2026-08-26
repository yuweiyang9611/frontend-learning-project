import { describe, expect, it } from 'vitest';
import { buildIssueQuery, validateIssue, type IssueInput } from './types';

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
