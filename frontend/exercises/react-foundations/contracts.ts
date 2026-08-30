import type { ComponentType } from 'react';

export const ISSUE_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export interface IssuePreview {
  id: number;
  key: string;
  title: string;
  status: IssueStatus;
}

export type RemoteIssues =
  | { state: 'loading' }
  | { state: 'empty' }
  | { state: 'success'; issues: readonly IssuePreview[] }
  | { state: 'error'; message: string; retry: () => void };

export interface IssueHeadingProps {
  issue: Pick<IssuePreview, 'key' | 'title' | 'status'>;
}

export interface StatusSelectProps {
  value: IssueStatus;
  onChange: (next: IssueStatus) => void;
}

export interface RemoteIssuesPanelProps {
  value: RemoteIssues;
}

export interface EscapeDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
}

export interface SaveStatusButtonProps {
  save: () => Promise<void>;
}

export interface StatusEditorProps {
  issue: Pick<IssuePreview, 'key' | 'status'>;
  save: (next: IssueStatus) => Promise<void>;
}

export interface ReactFoundationSolutions {
  IssueHeading: ComponentType<IssueHeadingProps>;
  summarizeIssues: (issues: readonly IssuePreview[]) => {
    total: number;
    open: number;
    resolved: number;
  };
  parseIssueStatus: (raw: string) => IssueStatus | null;
  StatusSelect: ComponentType<StatusSelectProps>;
  RemoteIssuesPanel: ComponentType<RemoteIssuesPanelProps>;
  EscapeDialog: ComponentType<EscapeDialogProps>;
  SaveStatusButton: ComponentType<SaveStatusButtonProps>;
  StatusEditor: ComponentType<StatusEditorProps>;
}

export const REACT_FOUNDATION_DAYS = [50, 51, 52, 53, 54, 55, 56] as const;
export type ReactFoundationDay = (typeof REACT_FOUNDATION_DAYS)[number];
