'use client';

import { AlertTriangle, CalendarDays, Inbox, LoaderCircle, RefreshCw, X, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import {
  priorityLabels,
  statusLabels,
  type IssuePriority,
  type IssueStatus,
  type Member,
} from '@/src/features/issues/types';

export function StatusBadge({ status }: { status: IssueStatus }) {
  return (
    <span className={`status ${status.replace('_', '-')}`}>
      <i />
      {statusLabels[status]}
    </span>
  );
}

export function PriorityMark({ priority }: { priority: IssuePriority }) {
  return (
    <span className={`priority ${priority}`}>
      <i />
      {priorityLabels[priority]}
    </span>
  );
}

export function MemberAvatar({
  member,
  size = 'medium',
}: {
  member: Member | null;
  size?: 'small' | 'medium' | 'large';
}) {
  return (
    <span className={`avatar avatar-${size} ${member?.color ?? 'neutral'}`} aria-hidden="true">
      {member?.initials ?? '—'}
    </span>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <span className="spinner" role="status">
      <LoaderCircle size={17} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function PageLoading() {
  return (
    <div className="page-loading" role="status" aria-label="Loading page">
      <div className="skeleton-line short" />
      <div className="skeleton-line title" />
      <div className="skeleton-grid">
        <i />
        <i />
        <i />
      </div>
      <div className="skeleton-table">
        {Array.from({ length: 6 }, (_, index) => (
          <i key={index} />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="table-skeleton" role="status" aria-label="Loading issues">
      {Array.from({ length: 7 }, (_, index) => (
        <div key={index}>
          <i />
          <span />
          <b />
          <em />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="state-card empty-state">
      <span>
        <Icon size={23} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="state-card error-state" role="alert">
      <span>
        <AlertTriangle size={23} />
      </span>
      <h2>Something went off track</h2>
      <p>{message ?? 'We could not load this part of IssueFlow. Try again in a moment.'}</p>
      {onRetry && (
        <button className="secondary-button" type="button" onClick={onRetry}>
          <RefreshCw size={15} />
          Try again
        </button>
      )}
    </div>
  );
}

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'small' | 'medium' | 'large';
}

export function Modal({ open, title, description, onClose, children, footer, size = 'medium' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement;
    const focusable = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    window.setTimeout(() => focusable()[0]?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const [first] = items;
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('modal-open');
      previousFocus.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        className={`modal modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
        ref={dialogRef}
      >
        <header>
          <div>
            <p className="eyebrow">IssueFlow</p>
            <h2 id="modal-title">{title}</h2>
            {description && <p id="modal-description">{description}</p>}
          </div>
          <button type="button" aria-label="Close dialog" onClick={onClose}>
            <X size={19} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  pending,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  pending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      size="small"
      footer={
        <>
          <button className="secondary-button" type="button" onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button className="danger-button" type="button" onClick={onConfirm} disabled={pending}>
            {pending && <Spinner />}
            {pending ? 'Deleting…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="confirm-visual">
        <AlertTriangle size={23} />
      </div>
    </Modal>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <section className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </section>
  );
}

export function DueDate({ value }: { value: string | null }) {
  if (!value) return <span className="muted-value">No due date</span>;
  const date = new Date(`${value}T00:00:00`);
  return (
    <span className="inline-detail">
      <CalendarDays size={14} />
      {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)}
    </span>
  );
}

export function formatRelative(value: string) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const absolute = Math.abs(seconds);
  if (absolute < 60) return formatter.format(seconds, 'second');
  if (absolute < 3600) return formatter.format(Math.round(seconds / 60), 'minute');
  if (absolute < 86400) return formatter.format(Math.round(seconds / 3600), 'hour');
  if (absolute < 604800) return formatter.format(Math.round(seconds / 86400), 'day');
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
