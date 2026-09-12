'use client';
import { Save } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { issueflowApi } from '@/src/api/issueflowApi';
import { useAuth, useToast } from '@/src/app/AppProviders';
import { ErrorState, TableSkeleton } from '@/src/components/ui';
import { decodeProfileInput } from '@/src/features/workspace/contracts';

export default function ProfileSettingsPage() {
  const { updateProfile } = useAuth();
  const { toast } = useToast();
  const query = useQuery({ queryKey: ['me', 'settings'], queryFn: issueflowApi.getSettings });
  const [draft, setDraft] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const name = draft ?? query.data?.session.displayName ?? '';
  async function save(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    const decoded = decodeProfileInput({ displayName: name });
    if (!decoded.ok) {
      setError(decoded.errors.displayName?.[0] ?? 'Invalid name.');
      input.current?.focus();
      return;
    }
    setPending(true);
    setError('');
    try {
      await updateProfile(decoded.value.displayName);
      setDraft(null);
      toast('Profile saved');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save profile.');
      input.current?.focus();
    } finally {
      setPending(false);
    }
  }
  if (query.isPending) return <TableSkeleton />;
  if (query.isError) return <ErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  return (
    <form className="settings-form" onSubmit={save}>
      <header>
        <p className="eyebrow">Identity</p>
        <h2>Profile details</h2>
        <p>Your display name appears beside your work. Your sign-in provider manages your email.</p>
      </header>
      <div className="field">
        <label htmlFor="displayName">Display name</label>
        <input
          ref={input}
          id="displayName"
          value={name}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={100}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'profile-error' : undefined}
          disabled={pending}
        />
      </div>
      <div className="field">
        <label htmlFor="profileEmail">Email</label>
        <input id="profileEmail" value={query.data.session.email} readOnly />
      </div>
      <div className="field">
        <label htmlFor="role">Role</label>
        <input id="role" value={query.data.session.role} readOnly />
      </div>
      {error && (
        <p id="profile-error" role="alert">
          {error}
        </p>
      )}
      <footer>
        <button className="primary-button" type="submit" disabled={pending}>
          <Save size={16} />
          {pending ? 'Saving…' : 'Save profile'}
        </button>
      </footer>
    </form>
  );
}
