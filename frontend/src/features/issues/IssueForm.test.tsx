import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import IssueForm from './IssueForm';
import { seedMembers } from '@/src/data/seed';

describe('IssueForm', () => {
  it('shows and focuses the required title error', async () => {
    const user = userEvent.setup();
    render(
      <IssueForm
        members={seedMembers}
        pending={false}
        submitLabel="Create issue"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Create issue' }));
    expect(await screen.findByText('Title is required.')).toBeVisible();
    expect(screen.getByLabelText(/Title/)).toHaveFocus();
  });

  it('submits normalized tags with the entered workflow values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <IssueForm
        members={seedMembers}
        pending={false}
        submitLabel="Create issue"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );
    await user.type(screen.getByLabelText(/Title/), 'Make filters shareable');
    await user.type(screen.getByLabelText('Description'), 'Keep URL state in sync.');
    await user.selectOptions(screen.getByLabelText('Priority'), 'high');
    await user.selectOptions(screen.getByLabelText('Assignee'), '2');
    await user.type(screen.getByLabelText('Tags'), ' Frontend, URL State ');
    await user.click(screen.getByRole('button', { name: 'Create issue' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      title: 'Make filters shareable',
      priority: 'high',
      assigneeId: 2,
      tags: ['frontend', 'url state'],
    });
  });
});
