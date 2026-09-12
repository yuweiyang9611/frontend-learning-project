'use client';
import { GripVertical, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/src/app/AppProviders';
import { ErrorState, MemberAvatar, PageHeader, PriorityMark, TableSkeleton } from '@/src/components/ui';
import { ISSUE_STATUSES, isIssueStatus, statusLabels, type IssueStatus } from '@/src/features/issues/types';
import { useBoard } from '@/src/features/workspace/useBoard';

const columnCopy: Record<IssueStatus, string> = {
  open: 'Ready for triage',
  in_progress: 'Actively moving',
  resolved: 'Ready to verify',
  closed: 'Completed work',
};
export default function BoardPage() {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [overStatus, setOverStatus] = useState<IssueStatus | null>(null);
  const { toast } = useToast();
  const board = useBoard((title, error) => toast(title, { description: error, tone: error ? 'error' : 'success' }));
  return (
    <>
      <div className="breadcrumb">
        Workspace <b>/</b> Board
      </div>
      <PageHeader
        eyebrow="Live workflow"
        title="Product board"
        description="Move work through the flow."
        actions={
          <Link className="primary-button" to="/issues/new">
            <Plus size={18} />
            New issue
          </Link>
        }
      />
      <div className="board-toolbar">
        <p role="status">
          {board.syncing ? 'Synchronizing…' : board.batchActive ? 'Changes awaiting synchronization' : 'Board synced'} ·{' '}
          {board.columns.reduce((sum, c) => sum + c.total, 0)} issues
        </p>
        <span>Drag cards or use each card’s status menu for keyboard access.</span>
      </div>
      {board.syncError && <ErrorState message={board.syncError} onRetry={() => board.sync()} />}
      <section className="kanban-board" aria-label="Issue board">
        {ISSUE_STATUSES.map((status, index) => {
          const query = board.queries[index],
            column = board.columns[index];
          return (
            <section
              aria-label={statusLabels[status]}
              className={`kanban-column ${status}${overStatus === status ? ' drag-over' : ''}`}
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                setOverStatus(status);
              }}
              onDragLeave={() => setOverStatus(null)}
              onDrop={() => {
                const issue = board.columns.flatMap((c) => c.items).find((i) => i.id === draggedId);
                if (issue) void board.move(issue, status);
                setDraggedId(null);
                setOverStatus(null);
              }}
            >
              <header>
                <div>
                  <i />
                  <h2>{statusLabels[status]}</h2>
                  <span>
                    {column.items.length} / {column.total}
                  </span>
                </div>
                <p>{columnCopy[status]}</p>
              </header>
              {query.isPending ? (
                <TableSkeleton />
              ) : query.isError ? (
                <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
              ) : null}
              <div className="kanban-cards">
                {column.items.map((issue) => (
                  <article
                    tabIndex={-1}
                    id={`board-card-${issue.id}`}
                    className={board.locked(issue.id) ? 'kanban-card pending' : 'kanban-card'}
                    key={issue.id}
                    draggable={!board.locked(issue.id)}
                    onDragStart={(e) => {
                      setDraggedId(issue.id);
                      e.dataTransfer.effectAllowed = 'move';
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
                      disabled={board.locked(issue.id)}
                      onChange={(e) => {
                        const next = e.currentTarget.value;
                        if (isIssueStatus(next)) void board.move(issue, next, true);
                      }}
                    >
                      {ISSUE_STATUSES.map((value) => (
                        <option key={value} value={value}>
                          {statusLabels[value]}
                        </option>
                      ))}
                    </select>
                  </article>
                ))}
                {!query.isPending && !query.isError && column.total === 0 && (
                  <div className="empty-column">Drop an issue here</div>
                )}
              </div>
              {query.hasNextPage && (
                <button
                  className="secondary-button"
                  disabled={query.isFetchingNextPage || board.batchActive}
                  onClick={() => void query.fetchNextPage()}
                >
                  Load more {statusLabels[status]}
                </button>
              )}
            </section>
          );
        })}
      </section>
    </>
  );
}
