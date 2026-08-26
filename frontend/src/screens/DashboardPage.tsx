'use client';

import { ArrowRight, CheckCircle2, CircleDot, Clock3, Plus, TrendingUp, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { issueflowApi } from '@/src/api/issueflowApi';
import { useAuth } from '@/src/app/AppProviders';
import {
  ErrorState,
  MemberAvatar,
  PageHeader,
  PriorityMark,
  StatusBadge,
  TableSkeleton,
  formatRelative,
} from '@/src/components/ui';
import { ISSUE_STATUSES, statusLabels, type IssueStatus } from '@/src/features/issues/types';

export default function DashboardPage() {
  const { session } = useAuth();
  const query = useQuery({
    queryKey: ['issues', 'dashboard'],
    queryFn: () => issueflowApi.listIssues({ page: 1, pageSize: 100, sortBy: 'updatedAt', sortDirection: 'desc' }),
  });

  if (query.isError) return <ErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  const issues = query.data?.items ?? [];
  const count = (status: IssueStatus) => issues.filter((issue) => issue.status === status).length;
  const open = count('open');
  const active = count('in_progress');
  const resolved = count('resolved');
  const total = Math.max(issues.length, 1);
  const updatedThisWeek = query.dataUpdatedAt
    ? issues.filter((issue) => query.dataUpdatedAt - new Date(issue.updatedAt).getTime() <= 7 * 86400_000).length
    : 0;
  const activeAssignees = new Set(
    issues
      .filter((issue) => issue.status === 'in_progress')
      .map((issue) => issue.assignee?.id)
      .filter(Boolean),
  ).size;
  const activeMembers = new Set(issues.flatMap((issue) => [issue.assignee?.id, issue.reporter.id]).filter(Boolean))
    .size;
  const focusIssue = issues.find((issue) => issue.priority === 'critical' && issue.status !== 'closed') ?? issues[0];
  const related = focusIssue ? issues.filter((issue) => issue.tags.some((tag) => focusIssue.tags.includes(tag))) : [];
  const focusProgress = related.length
    ? Math.round(
        (related.filter((issue) => issue.status === 'resolved' || issue.status === 'closed').length / related.length) *
          100,
      )
    : 0;
  const focusMembers = Array.from(
    new Map(related.filter((issue) => issue.assignee).map((issue) => [issue.assignee!.id, issue.assignee!])).values(),
  );
  const todayLabel = query.dataUpdatedAt
    ? new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(
        new Date(query.dataUpdatedAt),
      )
    : 'Today';
  const firstName = session?.displayName.split(/\s+/)[0] ?? 'there';

  return (
    <>
      <div className="breadcrumb">
        Workspace <b>/</b> Dashboard
      </div>
      <PageHeader
        eyebrow={todayLabel}
        title={`Good morning, ${firstName}`}
        description="Here’s what is moving across Product engineering today."
        actions={
          <Link className="primary-button" to="/issues/new">
            <Plus size={18} />
            New issue
          </Link>
        }
      />
      <section className="dashboard-metrics" aria-label="Workspace metrics">
        <article>
          <span className="metric-icon coral">
            <CircleDot size={19} />
          </span>
          <div>
            <small>Open issues</small>
            <strong>{query.isPending ? '—' : open}</strong>
            <p>
              <TrendingUp size={13} />
              {updatedThisWeek} updated this week
            </p>
          </div>
        </article>
        <article>
          <span className="metric-icon amber">
            <Clock3 size={19} />
          </span>
          <div>
            <small>In progress</small>
            <strong>{query.isPending ? '—' : active}</strong>
            <p>Across {activeAssignees} assignees</p>
          </div>
        </article>
        <article>
          <span className="metric-icon green">
            <CheckCircle2 size={19} />
          </span>
          <div>
            <small>Resolved</small>
            <strong>{query.isPending ? '—' : resolved}</strong>
            <p>
              <TrendingUp size={13} />
              {Math.round((resolved / total) * 100)}% of total
            </p>
          </div>
        </article>
        <article>
          <span className="metric-icon blue">
            <Users size={19} />
          </span>
          <div>
            <small>Active members</small>
            <strong>{query.isPending ? '—' : activeMembers}</strong>
            <p>Contributing to this project</p>
          </div>
        </article>
      </section>

      <div className="dashboard-grid">
        <section className="dashboard-panel activity-panel">
          <header>
            <div>
              <p className="eyebrow">Live workflow</p>
              <h2>Recently updated</h2>
            </div>
            <Link to="/issues">
              View all <ArrowRight size={14} />
            </Link>
          </header>
          {query.isPending ? (
            <TableSkeleton />
          ) : (
            <div className="recent-list">
              {issues.slice(0, 6).map((issue) => (
                <Link to={`/issues/${issue.id}`} key={issue.id} className="recent-item">
                  <MemberAvatar member={issue.assignee} />
                  <div>
                    <strong>{issue.title}</strong>
                    <small>
                      <b>{issue.key}</b> · {formatRelative(issue.updatedAt)}
                    </small>
                  </div>
                  <StatusBadge status={issue.status} />
                  <PriorityMark priority={issue.priority} />
                </Link>
              ))}
            </div>
          )}
        </section>
        <aside className="dashboard-side">
          <section className="dashboard-panel status-panel">
            <header>
              <div>
                <p className="eyebrow">Flow health</p>
                <h2>Status overview</h2>
              </div>
            </header>
            <div className="donut-wrap">
              <div
                className="donut"
                style={
                  {
                    '--open': `${(open / total) * 100}%`,
                    '--active': `${((open + active) / total) * 100}%`,
                    '--resolved': `${((open + active + resolved) / total) * 100}%`,
                  } as React.CSSProperties
                }
              >
                <span>
                  <strong>{issues.length}</strong>
                  <small>Total issues</small>
                </span>
              </div>
            </div>
            <ul>
              {ISSUE_STATUSES.map((status) => (
                <li key={status}>
                  <span>
                    <i className={`status-color ${status}`} />
                    {statusLabels[status]}
                  </span>
                  <strong>{count(status)}</strong>
                </li>
              ))}
            </ul>
          </section>
          <section className="focus-card">
            <span>Team focus</span>
            <h2>{focusIssue?.title ?? 'No active focus issue'}</h2>
            <p>
              {related.length} related issues · {focusProgress}% complete
            </p>
            <i>
              <b style={{ width: `${focusProgress}%` }} />
            </i>
            <div>
              {focusMembers.slice(0, 3).map((member) => (
                <MemberAvatar member={member} size="small" key={member.id} />
              ))}
              {focusMembers.length > 3 && <small>+{focusMembers.length - 3}</small>}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
