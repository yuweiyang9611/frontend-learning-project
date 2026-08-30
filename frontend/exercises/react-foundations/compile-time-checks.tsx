import type { ComponentProps } from 'react';
import type { IssueHeadingProps, StatusSelectProps } from './contracts';
import { workbenchReactFoundations } from './workbench';

const heading: IssueHeadingProps = {
  issue: { key: 'IF-1', title: 'Typed props', status: 'open' },
};
const onStatus: StatusSelectProps['onChange'] = (next) => next;
const headingProps: ComponentProps<typeof workbenchReactFoundations.IssueHeading> = heading;
void onStatus;
void headingProps;

// @ts-expect-error a heading requires status because the component reads it
const missingStatus: IssueHeadingProps = { issue: { key: 'IF-2', title: 'Missing' } };
// @ts-expect-error a DOM string outside the union cannot enter the callback
onStatus('blocked');
// @ts-expect-error async save receives a validated IssueStatus
const invalidSave: ComponentProps<typeof workbenchReactFoundations.StatusEditor>['save'] = async (next: 'blocked') =>
  next;
void missingStatus;
void invalidSave;
