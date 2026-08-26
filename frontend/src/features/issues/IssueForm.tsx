'use client';

import { CalendarDays, ChevronDown, Save, Tag, UserRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ApiError } from '@/src/api/issueflowApi';
import { Spinner } from '@/src/components/ui';
import {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  priorityLabels,
  statusLabels,
  validateIssue,
  type FieldErrors,
  type IssueInput,
  type Member,
} from './types';

export const emptyIssueInput: IssueInput = {
  title: '',
  description: '',
  status: 'open',
  priority: 'medium',
  assigneeId: null,
  tags: [],
  dueDate: null,
};

export default function IssueForm({
  initialValue = emptyIssueInput,
  members,
  pending,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialValue?: IssueInput;
  members: Member[];
  pending: boolean;
  submitLabel: string;
  onSubmit: (value: IssueInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<IssueInput>(initialValue);
  const [tagText, setTagText] = useState(initialValue.tags.join(', '));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');

  const change = <K extends keyof IssueInput>(key: K, next: IssueInput[K]) => {
    setValue((current) => ({ ...current, [key]: next }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextValue = {
      ...value,
      tags: tagText
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    };
    const clientErrors = validateIssue(nextValue);
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      const firstField = Object.keys(clientErrors)[0];
      document.getElementById(firstField)?.focus();
      return;
    }
    setFormError('');
    try {
      await onSubmit(nextValue);
    } catch (reason) {
      if (reason instanceof ApiError) {
        setErrors(reason.errors);
        setFormError(reason.message);
      } else setFormError('The issue could not be saved. Try again.');
    }
  };

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return (
    <form className="issue-form" onSubmit={submit} noValidate>
      {formError && (
        <div className="form-banner error" role="alert">
          {formError}
        </div>
      )}
      <section className="form-section">
        <header>
          <span>01</span>
          <div>
            <h2>Issue details</h2>
            <p>Give the team enough context to understand the problem and the desired outcome.</p>
          </div>
        </header>
        <div className="field">
          <div className="label-row">
            <label htmlFor="title">
              Title <b>*</b>
            </label>
            <small>{value.title.length}/100</small>
          </div>
          <input
            id="title"
            name="title"
            required
            maxLength={100}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'title-error' : 'title-help'}
            value={value.title}
            onChange={(event) => change('title', event.target.value)}
            placeholder="Summarize the issue in one clear sentence"
          />
          <small id="title-help">Use an action or observed problem, not a vague topic.</small>
          {errors.title && (
            <span className="field-error" id="title-error">
              {errors.title[0]}
            </span>
          )}
        </div>
        <div className="field">
          <div className="label-row">
            <label htmlFor="description">Description</label>
            <small>{value.description.length}/5,000</small>
          </div>
          <textarea
            id="description"
            name="description"
            rows={9}
            maxLength={5000}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? 'description-error' : undefined}
            value={value.description}
            onChange={(event) => change('description', event.target.value)}
            placeholder="What happened? What did you expect? Add links, steps, or decisions that will help."
          />
          {errors.description && (
            <span className="field-error" id="description-error">
              {errors.description[0]}
            </span>
          )}
        </div>
      </section>
      <section className="form-section">
        <header>
          <span>02</span>
          <div>
            <h2>Workflow</h2>
            <p>Set the state and urgency so this issue lands in the right place.</p>
          </div>
        </header>
        <div className="field-grid two">
          <div className="field">
            <label htmlFor="status">Status</label>
            <div className="select-field">
              <select
                id="status"
                value={value.status}
                onChange={(event) => change('status', event.target.value as IssueInput['status'])}
              >
                {ISSUE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="priority">Priority</label>
            <div className="select-field">
              <select
                id="priority"
                value={value.priority}
                onChange={(event) => change('priority', event.target.value as IssueInput['priority'])}
              >
                {ISSUE_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priorityLabels[priority]}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} />
            </div>
          </div>
        </div>
      </section>
      <section className="form-section">
        <header>
          <span>03</span>
          <div>
            <h2>Ownership & timing</h2>
            <p>Assign a clear owner, useful labels, and a realistic due date.</p>
          </div>
        </header>
        <div className="field-grid two">
          <div className="field">
            <label htmlFor="assignee">Assignee</label>
            <div className="select-field with-icon">
              <UserRound size={16} />
              <select
                id="assignee"
                value={value.assigneeId ?? ''}
                onChange={(event) => change('assigneeId', event.target.value ? Number(event.target.value) : null)}
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.displayName} · {member.role}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="dueDate">Due date</label>
            <div className="input-with-icon">
              <CalendarDays size={16} />
              <input
                id="dueDate"
                type="date"
                min={today}
                value={value.dueDate ?? ''}
                aria-invalid={Boolean(errors.dueDate)}
                aria-describedby={errors.dueDate ? 'dueDate-error' : undefined}
                onChange={(event) => change('dueDate', event.target.value || null)}
              />
            </div>
            {errors.dueDate && (
              <span className="field-error" id="dueDate-error">
                {errors.dueDate[0]}
              </span>
            )}
          </div>
        </div>
        <div className="field">
          <label htmlFor="tags">Tags</label>
          <div className="input-with-icon">
            <Tag size={16} />
            <input
              id="tags"
              value={tagText}
              onChange={(event) => setTagText(event.target.value)}
              placeholder="frontend, accessibility, auth"
            />
          </div>
          <small>Separate tags with commas.</small>
        </div>
      </section>
      <footer className="form-actions">
        <button className="secondary-button" type="button" onClick={onCancel} disabled={pending}>
          Cancel
        </button>
        <button className="primary-button" type="submit" disabled={pending}>
          {pending ? <Spinner label="Saving issue" /> : <Save size={17} />}
          {pending ? 'Saving…' : submitLabel}
        </button>
      </footer>
    </form>
  );
}
