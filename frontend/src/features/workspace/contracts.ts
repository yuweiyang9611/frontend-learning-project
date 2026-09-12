import { decodeIssue, decodeIssues, decodeMembers, decodeSession, type Decoder } from '../issues/runtime-contracts';
import { ISSUE_STATUSES, type Session } from '../issues/types';
import type { WorkspaceOverview } from './overview';

export interface NotificationPreferences {
  assigned: boolean;
  mentions: boolean;
  digest: boolean;
}
export interface UserSettings {
  session: Session;
  notifications: NotificationPreferences;
}
export const defaultPreferences: NotificationPreferences = { assigned: true, mentions: true, digest: false };
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const count = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const invalid = (field: string, message: string) => ({ ok: false as const, errors: { [field]: [message] } });

export const decodeProfileInput: Decoder<{ displayName: string }> = (value) => {
  if (
    !record(value) ||
    Object.keys(value).some((key) => key !== 'displayName') ||
    typeof value.displayName !== 'string' ||
    !value.displayName.trim() ||
    value.displayName.trim().length > 100
  )
    return invalid('displayName', 'Display name must contain 1–100 characters. Only displayName may be changed.');
  return { ok: true, value: { displayName: value.displayName.trim() } };
};
export const decodePreferences: Decoder<NotificationPreferences> = (value) => {
  if (
    !record(value) ||
    Object.keys(value).length !== 3 ||
    typeof value.assigned !== 'boolean' ||
    typeof value.mentions !== 'boolean' ||
    typeof value.digest !== 'boolean'
  )
    return invalid('notifications', 'Send assigned, mentions and digest as boolean values.');
  return { ok: true, value: { assigned: value.assigned, mentions: value.mentions, digest: value.digest } };
};
export const decodeSettings: Decoder<UserSettings> = (value) => {
  if (!record(value)) return invalid('settings', 'Expected settings.');
  const session = decodeSession(value.session),
    notifications = decodePreferences(value.notifications);
  return session.ok && notifications.ok
    ? { ok: true, value: { session: session.value, notifications: notifications.value } }
    : invalid('settings', 'Invalid settings response.');
};
export const decodeOverview: Decoder<WorkspaceOverview> = (value) => {
  const bad = () => invalid('overview', 'Invalid workspace overview.');
  if (
    !record(value) ||
    typeof value.asOf !== 'string' ||
    !Number.isFinite(Date.parse(value.asOf)) ||
    !count(value.total) ||
    !count(value.updatedLast7Days) ||
    !count(value.activeAssignees) ||
    !count(value.activeMembers) ||
    !record(value.byStatus) ||
    !record(value.focus) ||
    !Array.isArray(value.workloads)
  )
    return bad();
  const statuses = value.byStatus;
  if (
    !ISSUE_STATUSES.every((status) => count(statuses[status])) ||
    ISSUE_STATUSES.reduce((sum, status) => sum + Number(statuses[status]), 0) !== value.total
  )
    return bad();
  const recent = decodeIssues(value.recentIssues),
    members = decodeMembers(value.focus.members);
  const issue = value.focus.issue === null ? { ok: true as const, value: null } : decodeIssue(value.focus.issue);
  if (
    !recent.ok ||
    !members.ok ||
    !issue.ok ||
    !count(value.focus.relatedCount) ||
    !count(value.focus.progress) ||
    value.focus.progress > 100
  )
    return bad();
  const workloads: WorkspaceOverview['workloads'] = [];
  for (const item of value.workloads) {
    if (
      !record(item) ||
      !count(item.memberId) ||
      item.memberId === 0 ||
      !count(item.assigned) ||
      !count(item.inProgress)
    )
      return bad();
    workloads.push({ memberId: item.memberId, assigned: item.assigned, inProgress: item.inProgress });
  }
  return {
    ok: true,
    value: {
      asOf: value.asOf,
      total: value.total,
      byStatus: Object.fromEntries(
        ISSUE_STATUSES.map((status) => [status, statuses[status]]),
      ) as WorkspaceOverview['byStatus'],
      updatedLast7Days: value.updatedLast7Days,
      activeAssignees: value.activeAssignees,
      activeMembers: value.activeMembers,
      workloads,
      recentIssues: recent.value,
      focus: {
        issue: issue.value,
        relatedCount: value.focus.relatedCount,
        progress: value.focus.progress,
        members: members.value,
      },
    },
  };
};
