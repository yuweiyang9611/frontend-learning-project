'use client';
import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { issueflowApi } from '@/src/api/issueflowApi';
import { useToast } from '@/src/app/AppProviders';
import { ErrorState, TableSkeleton } from '@/src/components/ui';
import type { NotificationPreferences, UserSettings } from '@/src/features/workspace/contracts';

export default function AccountSettingsPage() {
  const { toast } = useToast();
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['me', 'settings'], queryFn: issueflowApi.getSettings });
  const [draft, setDraft] = useState<NotificationPreferences | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const prefs = draft ?? query.data?.notifications;
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!prefs || pending) return;
    setPending(true);
    setError('');
    try {
      const notifications = await issueflowApi.savePreferences(prefs);
      client.setQueryData<UserSettings>(['me', 'settings'], (current) =>
        current ? { ...current, notifications } : current,
      );
      setDraft(null);
      toast('Preferences saved', { description: 'Email delivery is not connected yet.' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save preferences.');
    } finally {
      setPending(false);
    }
  }
  function exportSaved() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(query.data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'issueflow-preferences.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    toast('Export downloaded', { description: 'Your saved profile and preferences were exported.' });
  }
  if (query.isPending) return <TableSkeleton />;
  if (query.isError) return <ErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  return (
    <form className="settings-form" onSubmit={save}>
      <header>
        <p className="eyebrow">Inbox control</p>
        <h2>Account & notifications</h2>
        <p>Preferences are saved to your account. Email delivery is not connected yet.</p>
      </header>
      <div className="settings-group">
        <h3>Email notifications</h3>
        {(
          [
            ['assigned', 'Issue assignments', 'When someone assigns an issue to you.'],
            ['mentions', 'Comments and mentions', 'When someone mentions you or replies to your work.'],
            ['digest', 'Weekly digest', 'A weekly summary of work.'],
          ] as const
        ).map(([key, label, description]) => (
          <label className="toggle-row" key={key}>
            <span>
              <strong>{label}</strong>
              <small>{description}</small>
            </span>
            <input
              type="checkbox"
              checked={prefs![key]}
              disabled={pending}
              onChange={(e) => setDraft({ ...prefs!, [key]: e.target.checked })}
            />
            <i aria-hidden="true">
              <b />
            </i>
          </label>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
      <button className="primary-button" disabled={pending} type="submit">
        {pending ? 'Saving…' : 'Save preferences'}
      </button>
      <div className="danger-zone">
        <div>
          <strong>Export saved account data</strong>
          <p>Download your saved profile and notification preferences.</p>
        </div>
        <button className="secondary-button" type="button" onClick={exportSaved}>
          Request export
        </button>
      </div>
    </form>
  );
}
