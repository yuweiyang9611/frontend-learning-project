import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { issueflowApi } from '@/src/api/issueflowApi';
import { ISSUE_STATUSES, ISSUE_PRIORITIES, type Issue, type IssueStatus, type PagedResult } from '../issues/types';

function useColumn(status: IssueStatus) {
  return useInfiniteQuery({
    queryKey: ['issues', 'board', status],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      issueflowApi.listIssues({ status, page: pageParam, pageSize: 25, sortBy: 'priority', sortDirection: 'desc' }),
    getNextPageParam: (page) => (page.page * page.pageSize < page.total ? page.page + 1 : undefined),
  });
}
type Column = { items: Issue[]; total: number };
type Move = { original: Issue; issue: Issue; pending: boolean };
export function useBoard(notify: (title: string, error?: string) => void) {
  const queries = [useColumn('open'), useColumn('in_progress'), useColumn('resolved'), useColumn('closed')];
  const client = useQueryClient();
  const operations = useRef(new Map<number, Move>());
  const frozen = useRef<Column[] | null>(null);
  const syncingRef = useRef(false);
  const lastKeyboardMove = useRef<number | null>(null);
  const [view, setView] = useState<{ operations: Map<number, Move>; frozen: Column[] | null; syncing: boolean }>({
    operations: new Map(),
    frozen: null,
    syncing: false,
  });
  function publish() {
    setView({ operations: new Map(operations.current), frozen: frozen.current, syncing: syncingRef.current });
  }
  const [syncError, setSyncError] = useState('');
  const live = queries.map((q) => ({
    items: q.data?.pages.flatMap((p) => p.items) ?? [],
    total: q.data?.pages[0]?.total ?? 0,
  }));
  const base = view.frozen ?? live;
  const all = new Map(base.flatMap((c) => c.items).map((i) => [i.id, i]));
  for (const [id, move] of view.operations) all.set(id, move.issue);
  const columns = ISSUE_STATUSES.map((status, index) => {
    let total = base[index].total;
    for (const move of view.operations.values()) {
      if (move.original.status === status) total--;
      if (move.issue.status === status) total++;
    }
    return {
      items: [...all.values()]
        .filter((i) => i.status === status)
        .sort((a, b) => ISSUE_PRIORITIES.indexOf(b.priority) - ISSUE_PRIORITIES.indexOf(a.priority) || b.id - a.id),
      total,
    };
  });
  async function sync() {
    if (syncingRef.current || [...operations.current.values()].some((m) => m.pending)) return;
    syncingRef.current = true;
    setSyncError('');
    publish();
    try {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['issues'] }, { throwOnError: true }),
        client.invalidateQueries({ queryKey: ['issue'] }, { throwOnError: true }),
      ]);

      const focused = lastKeyboardMove.current === null ? undefined : operations.current.get(lastKeyboardMove.current);
      if (focused) {
        const index = ISSUE_STATUSES.indexOf(focused.issue.status);
        const key = ['issues', 'board', focused.issue.status];
        let data = client.getQueryData<InfiniteData<PagedResult<Issue>>>(key);
        while (data && !data.pages.some((page) => page.items.some((issue) => issue.id === focused.issue.id))) {
          const last = data.pages[data.pages.length - 1];
          if (last.page * last.pageSize >= last.total) break;
          const previousLength = data.pages.length;
          const next = await queries[index].fetchNextPage();
          if (next.error) throw next.error;
          data = next.data;
          if (!data || data.pages.length <= previousLength) throw new Error('Could not reveal the moved card.');
        }
      }
      operations.current.clear();
      frozen.current = null;
    } catch {
      setSyncError('The board could not refresh. Confirmed moves remain visible. Retry synchronization.');
    } finally {
      syncingRef.current = false;
      publish();
      if (lastKeyboardMove.current !== null) {
        const id = lastKeyboardMove.current;
        requestAnimationFrame(() => document.getElementById('board-status-' + id)?.focus());
      }
    }
  }
  async function move(issue: Issue, status: IssueStatus, keyboard = false) {
    if (issue.status === status || syncingRef.current || operations.current.has(issue.id)) return;
    if (keyboard) lastKeyboardMove.current = issue.id;
    frozen.current ??= live;
    operations.current.set(issue.id, { original: issue, issue: { ...issue, status }, pending: true });
    publish();
    if (keyboard) requestAnimationFrame(() => document.getElementById('board-card-' + issue.id)?.focus());
    await client.cancelQueries({ queryKey: ['issues', 'board'] });
    try {
      const saved = await issueflowApi.updateIssue(issue.id, { status });
      operations.current.set(issue.id, { original: issue, issue: saved, pending: false });
      client.setQueryData(['issue', issue.id], saved);
      notify(saved.key + ' moved');
    } catch (e) {
      operations.current.delete(issue.id);
      notify('Card returned to its previous column', e instanceof Error ? e.message : 'Could not save the move.');
      if (keyboard) requestAnimationFrame(() => document.getElementById('board-status-' + issue.id)?.focus());
    }
    publish();
    await sync();
  }
  return {
    queries,
    columns,
    move,
    sync,
    syncError,
    syncing: view.syncing,
    locked: (id: number) => view.syncing || view.operations.has(id),
    batchActive: Boolean(view.frozen),
  };
}
