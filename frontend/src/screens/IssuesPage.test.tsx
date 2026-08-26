import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { issueflowApi } from '@/src/api/issueflowApi';
import IssuesPage from './IssuesPage';

vi.mock('@/src/app/AppProviders', () => ({ useToast: () => ({ toast: vi.fn() }) }));

describe('IssuesPage search', () => {
  beforeEach(() => {
    vi.spyOn(issueflowApi, 'getMembers').mockResolvedValue([]);
    vi.spyOn(issueflowApi, 'listIssues').mockResolvedValue({ items: [], page: 1, pageSize: 10, total: 0 });
  });

  it('debounces search and refreshes the query from URL state', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/issues']}>
          <IssuesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(issueflowApi.listIssues).toHaveBeenCalled());
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search issues' }), { target: { value: 'keyboard' } });
    await waitFor(
      () => expect(issueflowApi.listIssues).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'keyboard' })),
      { timeout: 1_500 },
    );
  });
});
