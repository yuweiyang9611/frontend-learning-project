import { useEffect, useState } from 'react';
import { ISSUE_STATUSES, type IssueStatus, type ReactFoundationSolutions } from './contracts';

const statusLabels: Record<IssueStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const referenceReactFoundations = {
  IssueHeading({ issue }) {
    return (
      <h2>
        {issue.key} · {issue.title} · {statusLabels[issue.status]}
      </h2>
    );
  },

  summarizeIssues(issues) {
    return {
      total: issues.length,
      open: issues.filter((issue) => issue.status === 'open').length,
      resolved: issues.filter((issue) => issue.status === 'resolved').length,
    };
  },

  parseIssueStatus(raw) {
    return ISSUE_STATUSES.includes(raw as IssueStatus) ? (raw as IssueStatus) : null;
  },

  StatusSelect({ value, onChange }) {
    return (
      <label>
        Status
        <select
          value={value}
          onChange={(event) => {
            const next = referenceReactFoundations.parseIssueStatus(event.currentTarget.value);
            if (next) onChange(next);
          }}
        >
          {ISSUE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </label>
    );
  },

  RemoteIssuesPanel({ value }) {
    switch (value.state) {
      case 'loading':
        return <p role="status">Loading issues…</p>;
      case 'empty':
        return <p>No issues yet.</p>;
      case 'success':
        return <p>{value.issues.length} issues loaded.</p>;
      case 'error':
        return (
          <div role="alert">
            <p>{value.message}</p>
            <button type="button" onClick={value.retry}>
              Try again
            </button>
          </div>
        );
    }
  },

  EscapeDialog({ open, title, onClose }) {
    useEffect(() => {
      if (!open) return undefined;
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose, open]);

    return open ? (
      <div role="dialog" aria-modal="true" aria-label={title}>
        {title}
      </div>
    ) : null;
  },

  SaveStatusButton({ save }) {
    const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    async function submit() {
      setState('saving');
      try {
        await save();
        setState('saved');
      } catch {
        setState('error');
      }
    }
    return (
      <div>
        <button type="button" disabled={state === 'saving'} onClick={submit}>
          {state === 'saving' ? 'Saving…' : 'Save status'}
        </button>
        {state === 'saved' && <p role="status">Status saved.</p>}
        {state === 'error' && <p role="alert">Could not save status.</p>}
      </div>
    );
  },

  StatusEditor({ issue, save }) {
    const [selected, setSelected] = useState(issue.status);
    const [message, setMessage] = useState('');
    async function submit() {
      setMessage('Saving…');
      try {
        await save(selected);
        setMessage('Saved.');
      } catch {
        setMessage('Save failed. Try again.');
      }
    }
    return (
      <section aria-labelledby={`editor-${issue.key}`}>
        <h2 id={`editor-${issue.key}`}>Edit {issue.key}</h2>
        <referenceReactFoundations.StatusSelect value={selected} onChange={setSelected} />
        <button type="button" onClick={submit}>
          Save
        </button>
        {message && <p role={message.startsWith('Save failed') ? 'alert' : 'status'}>{message}</p>}
      </section>
    );
  },
} satisfies ReactFoundationSolutions;
