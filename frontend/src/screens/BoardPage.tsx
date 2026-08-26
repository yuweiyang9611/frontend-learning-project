'use client';

import { GripVertical, Plus } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { issueflowApi } from '@/src/api/issueflowApi';
import { useToast } from '@/src/app/AppProviders';
import { ErrorState, MemberAvatar, PageHeader, PriorityMark, TableSkeleton } from '@/src/components/ui';
import {
  ISSUE_STATUSES,
  statusLabels,
  type Issue,
  type IssueStatus,
  type PagedResult,
} from '@/src/features/issues/types';

const columnCopy: Record<IssueStatus, string> = {
  open: 'Ready for triage',
  in_progress: 'Actively moving',
  resolved: 'Ready to verify',
  closed: 'Completed work',
};

export default function BoardPage() {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [overStatus, setOverStatus] = useState<IssueStatus | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const query = useQuery({
    queryKey: ['issues', 'board'],
    queryFn: () => issueflowApi.listIssues({ page: 1, pageSize: 100, sortBy: 'priority', sortDirection: 'desc' }),
  });
  const mutation = useMutation({
    mutationFn: ({ issue, status }: { issue: Issue; status: IssueStatus }) =>
      issueflowApi.updateIssue(issue.id, { status }),
    onMutate: async ({ issue, status }) => {
      await queryClient.cancelQueries({ queryKey: ['issues', 'board'] });
      const previous = queryClient.getQueryData<PagedResult<Issue>>(['issues', 'board']);
      queryClient.setQueryData<PagedResult<Issue>>(['issues', 'board'], (current) =>
        current
          ? { ...current, items: current.items.map((item) => (item.id === issue.id ? { ...item, status } : item)) }
          : current,
      );
      return { previous };
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(['issues', 'board'], context?.previous);
      toast('Card returned to its previous column', { description: error.message, tone: 'error' });
    },
    onSuccess: (issue) => toast(`${issue.key} moved to ${statusLabels[issue.status]}`),
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['issue', variables.issue.id] });
    },
  });

  if (query.isPending) return <TableSkeleton />;
  if (query.isError) return <ErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  const issues = query.data.items;
  const move = (issue: Issue, status: IssueStatus) => {
    if (issue.status !== status) mutation.mutate({ issue, status });
  };
  const drop = (status: IssueStatus) => {
    const issue = issues.find((item) => item.id === draggedId);
    if (issue) move(issue, status);
    setDraggedId(null);
    setOverStatus(null);
  };

  return (
    <>
      <div className="breadcrumb">
        Workspace <b>/</b> Board
      </div>
      <PageHeader
        eyebrow="Live workflow"
        title="Product board"
        description="Move work through the flow. Every drag updates the shared issue state immediately."
        actions={
          <Link className="primary-button" to="/issues/new">
            <Plus size={18} />
            New issue
          </Link>
        }
      />
      <div className="board-toolbar">
        <p>
          <span className="live-dot" />
          Board synced · {issues.length} issues
        </p>
        <span>Drag cards or use each card’s status menu for keyboard access.</span>
      </div>
      <section className="kanban-board" aria-label="Issue board">
        {ISSUE_STATUSES.map((status) => {
          const columnIssues = issues.filter((issue) => issue.status === status);
          return (
            <div
              key={status}
              className={overStatus === status ? `kanban-column ${status} drag-over` : `kanban-column ${status}`}
              onDragOver={(event) => {
                event.preventDefault();
                setOverStatus(status);
              }}
              onDragLeave={() => setOverStatus(null)}
              onDrop={() => drop(status)}
            >
              <header>
                <div>
                  <i />
                  <h2>{statusLabels[status]}</h2>
                  <span>{columnIssues.length}</span>
                </div>
                <p>{columnCopy[status]}</p>
              </header>
              <div className="kanban-cards">
                {columnIssues.map((issue) => (
                  <article
                    className={
                      mutation.isPending && mutation.variables?.issue.id === issue.id
                        ? 'kanban-card pending'
                        : 'kanban-card'
                    }
                    key={issue.id}
                    draggable
                    onDragStart={(event) => {
                      setDraggedId(issue.id);
                      event.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => {
                      setDraggedId(null);
                      setOverStatus(null);
                    }}
                  >
                    <div className="card-grip">
                      <span>{issue.key}</span>
                      <GripVertical size={16} aria-hidden="true" />
                    </div>
                    <Link to={`/issues/${issue.id}`}>{issue.title}</Link>
                    <p>{issue.description}</p>
                    <div className="card-tags">
                      {issue.tags.slice(0, 2).map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                    <footer>
                      <PriorityMark priority={issue.priority} />
                      <MemberAvatar member={issue.assignee} size="small" />
                    </footer>
                    <label className="sr-only" htmlFor={`board-status-${issue.id}`}>
                      Change status for {issue.key}
                    </label>
                    <select
                      className="board-status-select"
                      id={`board-status-${issue.id}`}
                      value={issue.status}
                      onChange={(event) => move(issue, event.target.value as IssueStatus)}
                    >
                      {ISSUE_STATUSES.map((value) => (
                        <option key={value} value={value}>
                          {statusLabels[value]}
                        </option>
                      ))}
                    </select>
                  </article>
                ))}
                {columnIssues.length === 0 && <div className="empty-column">Drop an issue here</div>}
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
