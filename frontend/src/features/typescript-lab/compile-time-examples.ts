import { indexById, updateField, type CalendarDate, type IssueSummary } from './examples';
import type { IssueInput, IssueStatus } from '@/src/features/issues/types';

export const validStatus: IssueStatus = 'in_progress';

// @ts-expect-error "blocked" is intentionally outside the IssueStatus union.
export const invalidStatus: IssueStatus = 'blocked';

declare const issueInput: IssueInput;

updateField(issueInput, 'priority', 'critical');

// @ts-expect-error A priority field cannot receive a number.
updateField(issueInput, 'priority', 3);

indexById([{ id: 1, title: 'Valid generic constraint' }]);

// @ts-expect-error Every value passed to indexById must have a numeric id.
indexById([{ key: 'IF-1' }]);

declare const readonlySummary: Readonly<IssueSummary>;

// @ts-expect-error Readonly prevents accidental mutation of a snapshot.
readonlySummary.title = 'This assignment should never compile';

declare const uncheckedDate: string;

// @ts-expect-error A plain string has not passed the CalendarDate runtime guard.
export const brandedDate: CalendarDate = uncheckedDate;
