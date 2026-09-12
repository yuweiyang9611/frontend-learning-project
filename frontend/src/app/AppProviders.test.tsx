import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import { AppProviders, useAuth, useTheme, useToast } from './AppProviders';
import { useQueryClient } from '@tanstack/react-query';
import { issueflowApi } from '@/src/api/issueflowApi';
const session = { email: 'demo@issueflow.dev', displayName: 'Jordan', initials: 'J', role: 'Admin' as const };
function Harness() {
  const auth = useAuth(),
    theme = useTheme(),
    { toast } = useToast(),
    client = useQueryClient();
  return (
    <>
      <p>
        {auth.ready ? 'ready' : 'loading'}:{auth.session?.displayName ?? 'anonymous'}
      </p>
      <p>{theme.theme}</p>
      <button onClick={() => void auth.login('demo@issueflow.dev', 'issueflow')}>Login</button>
      <button
        onClick={() => {
          client.setQueryData(['private'], 42);
          void auth.logout().then(() => toast(String(client.getQueryData(['private']))));
        }}
      >
        Logout
      </button>
      <button onClick={() => void auth.updateProfile('Updated')}>Rename</button>
      <button onClick={theme.toggleTheme}>Theme</button>
      <button onClick={() => theme.setTheme('system')}>System</button>
      <button onClick={() => toast('Saved')}>Toast</button>
      <button onClick={() => toast('Oops', { tone: 'error', description: 'Retry' })}>Error toast</button>
    </>
  );
}
it('restores, renames and clears query data when signing out', async () => {
  vi.spyOn(issueflowApi, 'restoreSession').mockResolvedValue(session);
  vi.spyOn(issueflowApi, 'login').mockResolvedValue(session);
  vi.spyOn(issueflowApi, 'logout').mockResolvedValue(undefined);
  vi.spyOn(issueflowApi, 'updateProfile').mockResolvedValue({ ...session, displayName: 'Updated' });
  render(
    <AppProviders>
      <Harness />
    </AppProviders>,
  );
  expect(await screen.findByText('ready:Jordan')).toBeVisible();
  fireEvent.click(screen.getByText('Rename'));
  expect(await screen.findByText('ready:Updated')).toBeVisible();
  fireEvent.click(screen.getByText('Logout'));
  expect(await screen.findByText('ready:anonymous')).toBeVisible();
  expect(await screen.findByText('undefined')).toBeVisible();
  fireEvent.click(screen.getByText('Login'));
  expect(await screen.findByText('ready:Jordan')).toBeVisible();
});
it('updates theme and offers dismissible notifications', async () => {
  vi.spyOn(issueflowApi, 'restoreSession').mockResolvedValue(null);
  render(
    <AppProviders>
      <Harness />
    </AppProviders>,
  );
  await screen.findByText('ready:anonymous');
  fireEvent.click(screen.getByText('Theme'));
  await waitFor(() => expect(document.documentElement.dataset.theme).toBe('dark'));
  expect(localStorage.getItem('issueflow-theme')).toBe('dark');
  fireEvent.click(screen.getByText('Theme'));
  await waitFor(() => expect(document.documentElement.dataset.theme).toBe('light'));
  fireEvent.click(screen.getByText('System'));
  expect(localStorage.getItem('issueflow-theme')).toBe('system');
  fireEvent.click(screen.getByText('Toast'));
  fireEvent.click(screen.getByText('Error toast'));
  expect(screen.getByText('Retry')).toBeVisible();
  fireEvent.click(screen.getAllByRole('button', { name: 'Dismiss notification' })[0]);
  expect(screen.queryByText('Saved')).not.toBeInTheDocument();
});
it('ignores session restoration after unmount', async () => {
  let resolve!: (value: typeof session) => void;
  vi.spyOn(issueflowApi, 'restoreSession').mockReturnValue(new Promise((r) => (resolve = r)));
  const view = render(
    <AppProviders>
      <Harness />
    </AppProviders>,
  );
  view.unmount();
  await act(async () => resolve(session));
});
