'use client';

import { Plus, RefreshCw } from 'lucide-react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { issueflowApi } from '@/src/api/issueflowApi';
import { useToast } from '@/src/app/AppProviders';
import { ConfirmDialog, EmptyState, ErrorState, PageHeader, Spinner, TableSkeleton } from '@/src/components/ui';
import { IssueCards, IssueFilters, IssueTable, Pagination } from '@/src/features/issues/components';
import {
  isIssuePriority,
  isIssueSort,
  isIssueStatus,
  isPositiveIntegerId,
  isSortDirection,
  type Issue,
  type IssueQuery,
  type IssueSort,
  type IssueStatus,
} from '@/src/features/issues/types';

type CacheSnapshot = [QueryKey, unknown][];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function patchIssueCache(value: unknown, id: number, change: Partial<Issue>, remove = false): unknown {
  if (!isRecord(value)) return value;
  if (Array.isArray(value.pages))
    return { ...value, pages: value.pages.map((page) => patchIssueCache(page, id, change, remove)) };
  if (Array.isArray(value.items))
    return {
      ...value,
      items: value.items.flatMap((item) =>
        isRecord(item) && item.id === id ? (remove ? [] : [{ ...item, ...change }]) : [item],
      ),
      total: remove && typeof value.total === 'number' ? Math.max(0, value.total - 1) : value.total,
    };
  if (value.id === id) return remove ? undefined : { ...value, ...change };
  return value;
}

export default function IssuesPage() {
  const [params, setParams] = useSearchParams();
  const searchParam = params.get('search') ?? '';
  const [search, setSearch] = useState(searchParam);
  const [deleteTarget, setDeleteTarget] = useState<Issue | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const page = Math.max(1, Number(params.get('page')) || 1);
  const pageSize = 10;
  const rawStatus = params.get('status');
  const rawPriority = params.get('priority');
  const rawAssigneeId = Number(params.get('assigneeId'));
  const rawSort = params.get('sortBy');
  const rawDirection = params.get('sortDirection');
  const status = isIssueStatus(rawStatus) ? rawStatus : '';
  const priority = isIssuePriority(rawPriority) ? rawPriority : '';
  const assigneeId = isPositiveIntegerId(rawAssigneeId) ? rawAssigneeId : undefined;
  const sortBy = isIssueSort(rawSort) ? rawSort : 'updatedAt';
  const sortDirection = isSortDirection(rawDirection) ? rawDirection : 'desc';
  const view = params.get('view') === 'stream' ? 'stream' : 'page';

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchParam), 0);
    return () => window.clearTimeout(timer);
  }, [searchParam]);
  useEffect(() => {
    if (search.trim() === searchParam) return;
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(params);
      const value = search.trim();
      if (value) next.set('search', value);
      else next.delete('search');
      next.delete('page');
      setParams(next, { replace: true });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [params, search, searchParam, setParams]);

  const baseQuery = useMemo<Omit<IssueQuery, 'page'>>(
    () => ({ pageSize, search: searchParam, status, priority, assigneeId, sortBy, sortDirection }),
    [assigneeId, priority, searchParam, sortBy, sortDirection, status],
  );
  const listQuery = useQuery({
    queryKey: ['issues', 'list', { ...baseQuery, page }],
    queryFn: () => issueflowApi.listIssues({ ...baseQuery, page }),
    enabled: view === 'page',
  });
  const streamQuery = useInfiniteQuery({
    queryKey: ['issues', 'stream', baseQuery],
    queryFn: ({ pageParam }) => issueflowApi.listIssues({ ...baseQuery, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.pageSize < lastPage.total ? lastPage.page + 1 : undefined,
    enabled: view === 'stream',
  });
  const { fetchNextPage, hasNextPage } = streamQuery;
  const membersQuery = useQuery({ queryKey: ['members'], queryFn: issueflowApi.getMembers });

  useEffect(() => {
    if (view !== 'stream' || !sentinel.current || !hasNextPage) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && fetchNextPage(), {
      rootMargin: '180px',
    });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, view]);

  const statusMutation = useMutation({
    mutationFn: ({ issue, status: nextStatus }: { issue: Issue; status: IssueStatus }) =>
      issueflowApi.updateIssue(issue.id, { status: nextStatus }),
    onMutate: async ({ issue, status: nextStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['issues'] });
      const previous: CacheSnapshot = queryClient.getQueriesData({ queryKey: ['issues'] });
      const previousDetail = queryClient.getQueryData(['issue', issue.id]);
      queryClient.setQueriesData({ queryKey: ['issues'] }, (value) =>
        patchIssueCache(value, issue.id, { status: nextStatus, updatedAt: new Date().toISOString() }),
      );
      queryClient.setQueryData(['issue', issue.id], (value) =>
        patchIssueCache(value, issue.id, { status: nextStatus }),
      );
      return { previous, previousDetail };
    },
    onError: (error, variables, context) => {
      context?.previous.forEach(([key, value]) => queryClient.setQueryData(key, value));
      queryClient.setQueryData(['issue', variables.issue.id], context?.previousDetail);
      toast('Status change rolled back', { description: error.message, tone: 'error' });
    },
    onSuccess: (_, variables) => toast(`${variables.issue.key} moved to ${variables.status.replace('_', ' ')}`),
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['issue', variables.issue.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (issue: Issue) => issueflowApi.deleteIssue(issue.id),
    onMutate: async (issue) => {
      await queryClient.cancelQueries({ queryKey: ['issues'] });
      const previous: CacheSnapshot = queryClient.getQueriesData({ queryKey: ['issues'] });
      queryClient.setQueriesData({ queryKey: ['issues'] }, (value) => patchIssueCache(value, issue.id, {}, true));
      return { previous };
    },
    onError: (error, _issue, context) => {
      context?.previous.forEach(([key, value]) => queryClient.setQueryData(key, value));
      toast('Issue was not deleted', { description: error.message, tone: 'error' });
    },
    onSuccess: (_, issue) => {
      toast(`${issue.key} deleted`, { description: 'The issue and its related activity were removed.' });
      setDeleteTarget(null);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['issues'] }),
  });

  const updateParam = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };
  const handleSort = (field: IssueSort) => {
    const next = new URLSearchParams(params);
    next.set('sortBy', field);
    next.set('sortDirection', field === sortBy && sortDirection === 'desc' ? 'asc' : 'desc');
    next.delete('page');
    setParams(next);
  };
  const clearFilters = () => {
    const next = new URLSearchParams();
    if (view === 'stream') next.set('view', 'stream');
    setSearch('');
    setParams(next);
  };

  const data =
    view === 'stream' ? (streamQuery.data?.pages.flatMap((item) => item.items) ?? []) : (listQuery.data?.items ?? []);
  const total = view === 'stream' ? (streamQuery.data?.pages[0]?.total ?? 0) : (listQuery.data?.total ?? 0);
  const pending = view === 'stream' ? streamQuery.isPending : listQuery.isPending;
  const error = view === 'stream' ? streamQuery.error : listQuery.error;
  const retry = view === 'stream' ? streamQuery.refetch : listQuery.refetch;
  const pendingId = statusMutation.isPending
    ? (statusMutation.variables?.issue.id ?? null)
    : deleteMutation.isPending
      ? (deleteMutation.variables?.id ?? null)
      : null;

  return (
    <>
      <div className="breadcrumb">
        Workspace <b>/</b> Issues
      </div>
      <PageHeader
        eyebrow="Product engineering"
        title="Issues"
        description="Track, prioritize, and move every piece of work forward."
        actions={
          <>
            <button className="secondary-button icon-label" type="button" onClick={() => retry()}>
              <RefreshCw size={15} />
              Refresh
            </button>
            <Link className="primary-button" to="/issues/new">
              <Plus size={18} />
              New issue
            </Link>
          </>
        }
      />
      <section className="issues-panel" aria-label="Issue workspace">
        <div className="panel-tabs">
          <button className={!assigneeId ? 'active' : ''} type="button" onClick={() => updateParam('assigneeId')}>
            All issues <span>{total}</span>
          </button>
          <button
            className={assigneeId === 1 ? 'active' : ''}
            type="button"
            onClick={() => updateParam('assigneeId', '1')}
          >
            Assigned to me
          </button>
          <button type="button" onClick={() => updateParam('status', 'open')}>
            Needs attention
          </button>
        </div>
        <IssueFilters
          search={search}
          status={status}
          priority={priority}
          assigneeId={assigneeId}
          members={membersQuery.data ?? []}
          resultCount={total}
          view={view}
          onSearch={setSearch}
          onStatus={(value) => updateParam('status', value)}
          onPriority={(value) => updateParam('priority', value)}
          onAssignee={(value) => updateParam('assigneeId', value ? String(value) : undefined)}
          onView={(value) => updateParam('view', value === 'stream' ? 'stream' : undefined)}
        />
        {pending ? (
          <TableSkeleton />
        ) : error ? (
          <ErrorState message={error.message} onRetry={() => retry()} />
        ) : data.length === 0 ? (
          <EmptyState
            title="No issues match this view"
            description="Try clearing a filter or create a new issue to start the flow."
            action={
              <div className="empty-actions">
                <button className="secondary-button" type="button" onClick={clearFilters}>
                  Clear filters
                </button>
                <Link className="primary-button" to="/issues/new">
                  Create issue
                </Link>
              </div>
            }
          />
        ) : (
          <>
            <IssueTable
              issues={data}
              sortBy={sortBy}
              direction={sortDirection}
              pendingId={pendingId}
              onSort={handleSort}
              onStatus={(issue, nextStatus) => statusMutation.mutate({ issue, status: nextStatus })}
              onDelete={setDeleteTarget}
            />
            <IssueCards
              issues={data}
              pendingId={pendingId}
              onStatus={(issue, nextStatus) => statusMutation.mutate({ issue, status: nextStatus })}
              onDelete={setDeleteTarget}
            />
            {view === 'page' ? (
              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPage={(value) => updateParam('page', String(value))}
              />
            ) : (
              <div className="stream-sentinel" ref={sentinel}>
                {streamQuery.hasNextPage ? (
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => streamQuery.fetchNextPage()}
                    disabled={streamQuery.isFetchingNextPage}
                  >
                    {streamQuery.isFetchingNextPage && <Spinner />}Load more issues
                  </button>
                ) : (
                  <span>You’ve reached the end of the issue stream.</span>
                )}
              </div>
            )}
          </>
        )}
      </section>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.key ?? 'issue'}?`}
        description="This permanently removes the issue, comments, and attachment metadata. This action cannot be undone."
        pending={deleteMutation.isPending}
        onClose={() => !deleteMutation.isPending && setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
      />
    </>
  );
}
