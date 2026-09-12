'use client';

import { Mail, Search, UserPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { issueflowApi } from '@/src/api/issueflowApi';
import { EmptyState, ErrorState, MemberAvatar, PageHeader, TableSkeleton } from '@/src/components/ui';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const members = useQuery({ queryKey: ['members'], queryFn: issueflowApi.getMembers });
  const issues = useQuery({
    queryKey: ['issues', 'overview'],
    queryFn: issueflowApi.getOverview,
  });
  const filtered = useMemo(
    () =>
      (members.data ?? []).filter(
        (member) =>
          (!search || `${member.displayName} ${member.email}`.toLowerCase().includes(search.toLowerCase())) &&
          (!role || member.role === role),
      ),
    [members.data, role, search],
  );

  if (members.isError) return <ErrorState message={members.error.message} onRetry={() => members.refetch()} />;
  if (issues.isError) return <ErrorState message={issues.error.message} onRetry={() => issues.refetch()} />;
  if (members.isPending || issues.isPending) return <TableSkeleton />;
  return (
    <>
      <div className="breadcrumb">
        Workspace <b>/</b> Team
      </div>
      <PageHeader
        eyebrow="Acme Studio"
        title="Team"
        description="See ownership, focus, and workload across everyone in the workspace."
        actions={
          <a className="primary-button" href="mailto:?subject=Join%20our%20IssueFlow%20workspace">
            <UserPlus size={18} />
            Invite member
          </a>
        }
      />
      <section className="team-summary">
        <div>
          <MemberAvatar member={members.data?.[0] ?? null} size="large" />
          <MemberAvatar member={members.data?.[1] ?? null} size="large" />
          <MemberAvatar member={members.data?.[2] ?? null} size="large" />
          <span>+{Math.max(0, (members.data?.length ?? 3) - 3)}</span>
        </div>
        <p>
          <strong>{members.data?.length ?? 0} members</strong>
          <span>working across Product engineering</span>
        </p>
        <i />
        <p>
          <strong>{issues.data?.byStatus.in_progress ?? 0} active issues</strong>
          <span>currently moving</span>
        </p>
      </section>
      <section className="team-panel">
        <header>
          <label className="table-search">
            <Search size={16} />
            <span className="sr-only">Search team</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search people…"
            />
          </label>
          <label className="select-control">
            <span className="sr-only">Filter by role</span>
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="">All roles</option>
              <option>Admin</option>
              <option>Developer</option>
              <option>Designer</option>
              <option>Product</option>
            </select>
          </label>
          <span>{filtered.length} people</span>
        </header>
        {members.isPending ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState title="No teammates found" description="Try a different name, email, or role." />
        ) : (
          <div className="member-grid">
            {filtered.map((member) => {
              const workload = issues.data?.workloads.find((item) => item.memberId === member.id);
              const owned = workload?.assigned ?? 0;
              const active = workload?.inProgress ?? 0;
              return (
                <article className="member-card" key={member.id}>
                  <header>
                    <MemberAvatar member={member} size="large" />
                    <span className="member-presence" />
                    <a href={`mailto:${member.email}`} aria-label={`Email ${member.displayName}`}>
                      <Mail size={16} />
                    </a>
                  </header>
                  <h2>{member.displayName}</h2>
                  <p>{member.role}</p>
                  <a href={`mailto:${member.email}`}>{member.email}</a>
                  <div>
                    <span>
                      <strong>{owned}</strong> assigned
                    </span>
                    <span>
                      <strong>{active}</strong> in progress
                    </span>
                  </div>
                  <footer>
                    <i>
                      <b style={{ width: `${Math.min(100, (active / Math.max(owned, 1)) * 100)}%` }} />
                    </i>
                    <span>{active ? 'Actively contributing' : 'Available for work'}</span>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
