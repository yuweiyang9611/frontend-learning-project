import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, it, expect, vi } from 'vitest';
import type { Issue } from '@/src/features/issues/types';
import type { ReactNode } from 'react';
import { issueflowApi } from '@/src/api/issueflowApi';
import { createOverview } from '@/src/features/workspace/overview';
import { seedIssues, seedMembers } from '@/src/data/seed';
import DashboardPage from './DashboardPage';
import UsersPage from './UsersPage';
import BoardPage from './BoardPage';
import ProfileSettingsPage from './settings/ProfileSettingsPage';
import AccountSettingsPage from './settings/AccountSettingsPage';
const mocks = vi.hoisted(() => ({ toast: vi.fn(), updateProfile: vi.fn() }));
vi.mock('@/src/app/AppProviders', () => ({
  useToast: () => ({ toast: mocks.toast }),
  useAuth: () => ({ session: { displayName: 'Jordan Davis' }, updateProfile: mocks.updateProfile }),
}));
const session = { email: 'demo@issueflow.dev', displayName: 'Jordan Davis', initials: 'JD', role: 'Admin' as const };
const settings = { session, notifications: { assigned: true, mentions: true, digest: false } };
const summary = createOverview(seedIssues, seedMembers, '2026-09-12T00:00:00.000Z');
function mount(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return {
    ...render(
      <QueryClientProvider client={client}>
        <MemoryRouter>{node}</MemoryRouter>
      </QueryClientProvider>,
    ),
    client,
  };
}
beforeEach(() => {
  mocks.toast.mockReset();
  mocks.updateProfile.mockReset().mockResolvedValue({ ...session, displayName: 'New Name' });
  vi.spyOn(issueflowApi, 'getOverview').mockResolvedValue(summary);
  vi.spyOn(issueflowApi, 'getMembers').mockResolvedValue(seedMembers);
  vi.spyOn(issueflowApi, 'getSettings').mockResolvedValue(structuredClone(settings));
  vi.spyOn(issueflowApi, 'savePreferences').mockImplementation(async (p) => p);
});
it('dashboard displays server-wide totals rather than the recent six items', async () => {
  vi.mocked(issueflowApi.getOverview).mockResolvedValue({
    ...summary,
    total: 250,
    byStatus: { open: 240, in_progress: 5, resolved: 3, closed: 2 },
  });
  mount(<DashboardPage />);
  expect(await screen.findByText('250')).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Good morning, Jordan' })).toBeVisible();
  expect(screen.getAllByText('240').length).toBeGreaterThan(0);
});
it('dashboard exposes empty focus and can retry failures', async () => {
  vi.mocked(issueflowApi.getOverview)
    .mockRejectedValueOnce(new Error('Overview unavailable'))
    .mockResolvedValue(createOverview([], [], summary.asOf));
  mount(<DashboardPage />);
  expect(await screen.findByText('Overview unavailable')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: /try again/i }));
  expect(await screen.findByText('No active focus issue')).toBeVisible();
});
it('team uses complete workloads and filters by search and role', async () => {
  vi.mocked(issueflowApi.getOverview).mockResolvedValue({
    ...summary,
    workloads: seedMembers.map((m) => ({ memberId: m.id, assigned: 250, inProgress: 150 })),
  });
  mount(<UsersPage />);
  expect(await screen.findByText(seedMembers[0].displayName)).toBeVisible();
  expect(screen.getAllByText('250').length).toBe(seedMembers.length);
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search team' }), { target: { value: 'no such person' } });
  expect(screen.getByText('No teammates found')).toBeVisible();
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search team' }), { target: { value: '' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Filter by role' }), { target: { value: 'Admin' } });
  expect(screen.getByText(seedMembers[0].displayName)).toBeVisible();
});
it.each(['getMembers', 'getOverview'] as const)('team displays %s failure instead of zero workload', async (method) => {
  vi.mocked(issueflowApi[method]).mockRejectedValueOnce(new Error('Team unavailable')) as unknown;
  mount(<UsersPage />);
  expect(await screen.findByText('Team unavailable')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: /try again/i }));
  expect(await screen.findByText(seedMembers[0].displayName)).toBeVisible();
});
it('profile saves trimmed name, keeps email readonly and handles validation', async () => {
  mount(<ProfileSettingsPage />);
  const input = await screen.findByLabelText('Display name');
  expect(screen.getByLabelText('Email')).toHaveAttribute('readonly');
  fireEvent.change(input, { target: { value: '   ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
  expect(await screen.findByRole('alert')).toBeVisible();
  expect(input).toHaveFocus();
  fireEvent.change(input, { target: { value: ' New Name ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
  await waitFor(() => expect(mocks.updateProfile).toHaveBeenCalledWith('New Name'));
  await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith('Profile saved'));
});
it('profile preserves drafts after failure and prevents duplicate submissions', async () => {
  let reject!: (e: Error) => void;
  mocks.updateProfile.mockReturnValueOnce(new Promise((_resolve, r) => (reject = r)));
  mount(<ProfileSettingsPage />);
  const input = await screen.findByLabelText('Display name');
  fireEvent.change(input, { target: { value: 'Keep Draft' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
  expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  await act(async () => reject(new Error('Save unavailable')));
  expect(await screen.findByRole('alert')).toHaveTextContent('Save unavailable');
  expect(input).toHaveValue('Keep Draft');
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
  await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith('Profile saved'));
});
it.each([ProfileSettingsPage, AccountSettingsPage])('settings page supports load retry', async (Page) => {
  vi.mocked(issueflowApi.getSettings).mockRejectedValueOnce(new Error('Settings unavailable'));
  mount(<Page />);
  expect(await screen.findByText('Settings unavailable')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: /try again/i }));
  expect(
    await screen.findByRole('heading', {
      name: Page === ProfileSettingsPage ? 'Profile details' : 'Account & notifications',
    }),
  ).toBeVisible();
});
it('account persists preferences and exports saved state', async () => {
  const objectUrl = vi.fn().mockReturnValue('blob:test');
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: objectUrl });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  const { client } = mount(<AccountSettingsPage />);
  const toggle = await screen.findByRole('checkbox', { name: /Issue assignments/ });
  fireEvent.click(toggle);
  fireEvent.click(screen.getByRole('button', { name: 'Save preferences' }));
  await waitFor(() =>
    expect(issueflowApi.savePreferences).toHaveBeenCalledWith({ assigned: false, mentions: true, digest: false }),
  );
  await waitFor(() =>
    expect(client.getQueryData(['me', 'settings'])).toMatchObject({ notifications: { assigned: false } }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Request export' }));
  expect(objectUrl).toHaveBeenCalled();
  expect(mocks.toast).toHaveBeenCalledWith('Export downloaded', expect.anything());
});
it('account retains an unsaved draft on error', async () => {
  vi.mocked(issueflowApi.savePreferences).mockRejectedValueOnce(new Error('Preference write failed'));
  mount(<AccountSettingsPage />);
  const toggle = await screen.findByRole('checkbox', { name: /Weekly digest/ });
  fireEvent.click(toggle);
  fireEvent.click(screen.getByRole('button', { name: 'Save preferences' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Preference write failed');
  expect(toggle).toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: 'Save preferences' }));
  await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith('Preferences saved', expect.anything()));
});
function boardData(count = 2) {
  const issues: Issue[] = Array.from({ length: count }, (_, i) => ({
    ...seedIssues[0],
    id: i + 1,
    key: 'IF-' + (i + 1),
    title: 'Board ' + (i + 1),
    status: 'open' as const,
  }));
  vi.spyOn(issueflowApi, 'listIssues').mockImplementation(async (q) => {
    const list = issues.filter((i) => i.status === q.status).sort((a, b) => b.id - a.id);
    return { items: list.slice((q.page - 1) * 25, q.page * 25), total: list.length, page: q.page, pageSize: 25 };
  });
  return issues;
}
it('board loads all 101 cards and shows loaded/total counts', async () => {
  boardData(101);
  mount(<BoardPage />);
  const open = screen.getByRole('region', { name: 'Open' });
  expect(await within(open).findByText('25 / 101')).toBeVisible();
  for (const expected of [50, 75, 100, 101]) {
    fireEvent.click(screen.getByRole('button', { name: 'Load more Open' }));
    expect(await within(open).findByText(expected + ' / 101')).toBeVisible();
  }
  expect(screen.getAllByRole('combobox')).toHaveLength(101);
  expect(screen.queryByRole('button', { name: 'Load more Open' })).not.toBeInTheDocument();
});
it('board rolls back only a failing card during concurrent out-of-order moves', async () => {
  const issues = boardData();
  let resolve!: (i: (typeof issues)[number]) => void;
  let reject!: (e: Error) => void;
  vi.spyOn(issueflowApi, 'updateIssue').mockImplementation((id) =>
    id === 1 ? new Promise((r) => (resolve = r)) : new Promise((_r, j) => (reject = j)),
  );
  mount(<BoardPage />);
  const first = await screen.findByRole('combobox', { name: 'Change status for IF-1' }),
    second = screen.getByRole('combobox', { name: 'Change status for IF-2' });
  fireEvent.change(first, { target: { value: 'resolved' } });
  fireEvent.change(second, { target: { value: 'closed' } });
  await waitFor(() => expect(issueflowApi.updateIssue).toHaveBeenCalledTimes(2));
  expect(screen.getByRole('combobox', { name: 'Change status for IF-1' })).toBeDisabled();
  await act(async () => reject(new Error('Second failed')));
  expect(screen.getByRole('combobox', { name: 'Change status for IF-2' })).toHaveValue('open');
  const saved = { ...issues[0], status: 'resolved' as const };
  Object.assign(issues[0], saved);
  await act(async () => resolve(saved as (typeof issues)[number]));
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Change status for IF-1' })).not.toBeDisabled());
  expect(screen.getByRole('combobox', { name: 'Change status for IF-1' })).toHaveValue('resolved');
  expect(screen.getByRole('combobox', { name: 'Change status for IF-2' })).toHaveValue('open');
});
it('board retains a confirmed move when synchronization fails, then retries', async () => {
  const issues = boardData(1);
  vi.spyOn(issueflowApi, 'updateIssue').mockImplementation(async () => {
    Object.assign(issues[0], { status: 'closed' });
    vi.mocked(issueflowApi.listIssues).mockRejectedValue(new Error('Refresh down'));
    return { ...issues[0] };
  });
  mount(<BoardPage />);
  fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'closed' } });
  expect(await screen.findByText(/board could not refresh/)).toBeVisible();
  expect(screen.getByRole('combobox')).toHaveValue('closed');
  vi.mocked(issueflowApi.listIssues).mockImplementation(async (q) => ({
    items: q.status === 'closed' ? issues : [],
    page: 1,
    pageSize: 25,
    total: q.status === 'closed' ? 1 : 0,
  }));
  fireEvent.click(screen.getAllByRole('button', { name: /try again/i })[0]);
  await waitFor(() => expect(screen.getByRole('combobox')).not.toBeDisabled());
  expect(screen.getByRole('combobox')).toHaveValue('closed');
});
it('board supports drag/drop and column error retry', async () => {
  const issues = boardData(1);
  vi.mocked(issueflowApi.listIssues).mockRejectedValueOnce(new Error('Column unavailable'));
  vi.spyOn(issueflowApi, 'updateIssue').mockImplementation(async (_id, patch) => {
    Object.assign(issues[0], patch);
    return { ...issues[0] };
  });
  mount(<BoardPage />);
  expect(await screen.findByText('Column unavailable')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: /try again/i }));
  const select = await screen.findByRole('combobox');
  const card = select.closest('article')!;
  fireEvent.dragStart(card, { dataTransfer: { effectAllowed: '' } });
  const target = screen.getByRole('region', { name: 'Resolved' });
  fireEvent.dragOver(target);
  fireEvent.dragLeave(target);
  fireEvent.dragOver(target);
  fireEvent.drop(target);
  fireEvent.dragEnd(card);
  await waitFor(() => expect(issueflowApi.updateIssue).toHaveBeenCalledWith(1, { status: 'resolved' }));
});

it('keyboard move reveals a card beyond the first destination page and restores focus', async () => {
  const issues: Issue[] = [
    { ...seedIssues[0], id: 1, key: 'IF-1', title: 'Keyboard target', status: 'open', priority: 'low' },
    ...Array.from({ length: 30 }, (_, i) => ({
      ...seedIssues[0],
      id: i + 2,
      key: 'IF-' + (i + 2),
      title: 'Destination ' + i,
      status: 'closed' as const,
      priority: 'high' as const,
    })),
  ];
  vi.spyOn(issueflowApi, 'listIssues').mockImplementation(async (q) => {
    const items = issues.filter((i) => i.status === q.status).sort((a, b) => b.id - a.id);
    return { items: items.slice((q.page - 1) * 25, q.page * 25), page: q.page, pageSize: 25, total: items.length };
  });
  vi.spyOn(issueflowApi, 'updateIssue').mockImplementation(async (id, patch) => {
    const issue = issues.find((i) => i.id === id)!;
    Object.assign(issue, patch);
    return { ...issue };
  });
  mount(<BoardPage />);
  const select = await screen.findByRole('combobox', { name: 'Change status for IF-1' });
  fireEvent.change(select, { target: { value: 'closed' } });
  await waitFor(() =>
    expect(issueflowApi.listIssues).toHaveBeenCalledWith(expect.objectContaining({ status: 'closed', page: 2 })),
  );
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Change status for IF-1' })).toHaveFocus());
  expect(within(screen.getByRole('region', { name: 'Closed' })).getByText('31 / 31')).toBeVisible();
});
