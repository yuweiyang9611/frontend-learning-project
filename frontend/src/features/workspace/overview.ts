import { ISSUE_STATUSES, type Issue, type IssueStatus, type Member } from '../issues/types';

export interface WorkspaceOverview {
  asOf: string;
  total: number;
  byStatus: Record<IssueStatus, number>;
  updatedLast7Days: number;
  activeAssignees: number;
  activeMembers: number;
  workloads: { memberId: number; assigned: number; inProgress: number }[];
  recentIssues: Issue[];
  focus: { issue: Issue | null; relatedCount: number; progress: number; members: Member[] };
}

/** Shared domain calculation; callers must supply all issues, never a single page. */
export function createOverview(issues: Issue[], members: Member[], asOf = new Date().toISOString()): WorkspaceOverview {
  const sorted = [...issues].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || b.id - a.id);
  const focus = sorted.find((issue) => issue.priority === 'critical' && issue.status !== 'closed') ?? sorted[0] ?? null;
  const related = focus ? sorted.filter((issue) => issue.tags.some((tag) => focus.tags.includes(tag))) : [];
  const now = Date.parse(asOf);
  return {
    asOf,
    total: issues.length,
    byStatus: Object.fromEntries(
      ISSUE_STATUSES.map((status) => [status, issues.filter((issue) => issue.status === status).length]),
    ) as Record<IssueStatus, number>,
    updatedLast7Days: issues.filter((issue) => {
      const age = now - Date.parse(issue.updatedAt);
      return age >= 0 && age <= 7 * 86400_000;
    }).length,
    activeAssignees: new Set(
      issues.filter((issue) => issue.status === 'in_progress' && issue.assignee).map((issue) => issue.assignee!.id),
    ).size,
    activeMembers: new Set(
      issues.flatMap((issue) => (issue.assignee ? [issue.reporter.id, issue.assignee.id] : [issue.reporter.id])),
    ).size,
    workloads: members.map((member) => {
      const assigned = issues.filter((issue) => issue.assignee?.id === member.id);
      return {
        memberId: member.id,
        assigned: assigned.length,
        inProgress: assigned.filter((issue) => issue.status === 'in_progress').length,
      };
    }),
    recentIssues: sorted.slice(0, 6),
    focus: {
      issue: focus,
      relatedCount: related.length,
      progress: related.length
        ? Math.round(
            (100 * related.filter((issue) => issue.status === 'resolved' || issue.status === 'closed').length) /
              related.length,
          )
        : 0,
      members: [
        ...new Map(
          related.filter((issue) => issue.assignee).map((issue) => [issue.assignee!.id, issue.assignee!]),
        ).values(),
      ],
    },
  };
}
