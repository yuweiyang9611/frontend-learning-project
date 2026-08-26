import type { Attachment, Comment, Issue, Member } from '@/src/features/issues/types';

export const seedMembers: Member[] = [
  {
    id: 1,
    displayName: 'Jordan Davis',
    email: 'jordan@issueflow.dev',
    avatarUrl: null,
    role: 'Admin',
    initials: 'JD',
    color: 'green',
  },
  {
    id: 2,
    displayName: 'Maya Chen',
    email: 'maya@issueflow.dev',
    avatarUrl: null,
    role: 'Developer',
    initials: 'MC',
    color: 'violet',
  },
  {
    id: 3,
    displayName: 'Theo Martin',
    email: 'theo@issueflow.dev',
    avatarUrl: null,
    role: 'Developer',
    initials: 'TM',
    color: 'blue',
  },
  {
    id: 4,
    displayName: 'Nora Singh',
    email: 'nora@issueflow.dev',
    avatarUrl: null,
    role: 'Product',
    initials: 'NS',
    color: 'orange',
  },
  {
    id: 5,
    displayName: 'Alex Rivera',
    email: 'alex@issueflow.dev',
    avatarUrl: null,
    role: 'Designer',
    initials: 'AR',
    color: 'teal',
  },
  {
    id: 6,
    displayName: 'Sam Okafor',
    email: 'sam@issueflow.dev',
    avatarUrl: null,
    role: 'Developer',
    initials: 'SO',
    color: 'rose',
  },
  {
    id: 7,
    displayName: 'Iris Park',
    email: 'iris@issueflow.dev',
    avatarUrl: null,
    role: 'Product',
    initials: 'IP',
    color: 'violet',
  },
  {
    id: 8,
    displayName: 'Leo Fischer',
    email: 'leo@issueflow.dev',
    avatarUrl: null,
    role: 'Designer',
    initials: 'LF',
    color: 'blue',
  },
];

const titles = [
  'Refresh session after returning from sleep',
  'Add bulk actions to the issue table',
  'Empty state copy does not match filters',
  'Improve keyboard focus inside dialogs',
  'Persist table density preference',
  'Show active filters in shared issue URLs',
  'Add confirmation before deleting comments',
  'Optimize board rendering for large projects',
  'Support markdown in issue descriptions',
  'Fix overlapping toast on small screens',
  'Add assignee workload to dashboard',
  'Document authentication error states',
  'Improve due date timezone handling',
  'Add drag preview to Kanban cards',
  'Expose API validation details in forms',
  'Create activity timeline for issue updates',
  'Add quick search keyboard shortcut',
  'Restore filters after browser navigation',
  'Audit contrast for priority indicators',
  'Add pagination metadata to the API client',
  'Handle offline mutation failures gracefully',
  'Improve upload progress feedback',
  'Add team directory role filters',
  'Reduce initial JavaScript bundle size',
];

const descriptions = [
  'The current experience loses useful context. Update the flow so people can continue without repeating work, and include clear recovery guidance.',
  'Build the smallest accessible version first. Preserve keyboard behavior, meaningful labels, loading feedback, and a stable URL throughout the change.',
  'The API contract is already stable. Keep the request shape unchanged and surface validation errors next to the field that needs attention.',
  'Product teams need a predictable interaction on desktop and mobile. Verify the empty, loading, success, and error states before closing this issue.',
];

const tags = [
  ['frontend', 'accessibility'],
  ['workflow', 'productivity'],
  ['api', 'reliability'],
  ['design-system'],
  ['performance'],
  ['authentication', 'security'],
  ['responsive', 'mobile'],
  ['testing'],
];

function isoDaysAgo(days: number, hours = 0) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(Math.max(8, 17 - hours), (days * 13) % 60, 0, 0);
  return date.toISOString();
}

function dueIn(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export const seedIssues: Issue[] = Array.from({ length: 72 }, (_, index) => {
  const statuses: Issue['status'][] = [
    'in_progress',
    'open',
    'open',
    'resolved',
    'closed',
    'open',
    'in_progress',
    'resolved',
  ];
  const priorities: Issue['priority'][] = ['critical', 'high', 'medium', 'high', 'low', 'medium', 'high', 'low'];
  const member = index % 7 === 6 ? null : seedMembers[(index + 1) % seedMembers.length];
  return {
    id: 248 - index,
    key: `IF-${248 - index}`,
    title:
      titles[index % titles.length] + (index >= titles.length ? ` · ${Math.floor(index / titles.length) + 1}` : ''),
    description: descriptions[index % descriptions.length],
    status: statuses[index % statuses.length],
    priority: priorities[index % priorities.length],
    assignee: member,
    reporter: seedMembers[index % seedMembers.length],
    tags: tags[index % tags.length],
    dueDate: index % 4 === 0 ? null : dueIn((index % 24) + 2),
    createdAt: isoDaysAgo(42 - (index % 38), index % 5),
    updatedAt: isoDaysAgo(Math.floor(index / 4), index % 7),
  };
});

export const seedComments: Comment[] = [
  {
    id: 1,
    issueId: 248,
    author: seedMembers[3],
    body: 'I reproduced this after waking Chrome with the tab in the background. The refresh request is never retried.',
    createdAt: isoDaysAgo(1, 2),
  },
  {
    id: 2,
    issueId: 248,
    author: seedMembers[1],
    body: 'I have a fix in progress. It preserves the original destination and announces the session recovery state.',
    createdAt: isoDaysAgo(0, 3),
  },
  {
    id: 3,
    issueId: 247,
    author: seedMembers[0],
    body: 'Let’s keep the first version to status and assignee changes so the interaction stays easy to understand.',
    createdAt: isoDaysAgo(2, 1),
  },
];

export const seedAttachments: Attachment[] = [
  {
    id: 1,
    issueId: 248,
    originalFileName: 'session-network-trace.txt',
    contentType: 'text/plain',
    size: 18432,
    createdAt: isoDaysAgo(1),
    downloadUrl: null,
  },
];
