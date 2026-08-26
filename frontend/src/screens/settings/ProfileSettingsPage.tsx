'use client';

import { Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useAuth, useToast } from '@/src/app/AppProviders';
import { MemberAvatar } from '@/src/components/ui';
import type { Member } from '@/src/features/issues/types';

export default function ProfileSettingsPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(session?.displayName ?? 'Jordan Davis');
  const [email, setEmail] = useState(session?.email ?? 'demo@issueflow.dev');
  const save = (event: FormEvent) => {
    event.preventDefault();
    toast('Profile saved', { description: 'Your display details have been updated for this demo session.' });
  };
  const member: Member = {
    id: 1,
    displayName: name,
    email,
    avatarUrl: null,
    role: 'Admin',
    initials: name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    color: 'green',
  };
  return (
    <form className="settings-form" onSubmit={save}>
      <header>
        <p className="eyebrow">Identity</p>
        <h2>Profile details</h2>
        <p>These details appear beside issues, comments, and activity across your workspace.</p>
      </header>
      <div className="avatar-editor">
        <MemberAvatar member={member} size="large" />
        <div>
          <strong>Profile image</strong>
          <p>IssueFlow uses initials from your authenticated profile.</p>
        </div>
      </div>
      <div className="field-grid two">
        <div className="field">
          <label htmlFor="displayName">Display name</label>
          <input id="displayName" value={name} onChange={(event) => setName(event.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="profileEmail">Email</label>
          <input
            id="profileEmail"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="role">Role</label>
        <input id="role" value="Workspace admin" disabled />
        <small>Roles are managed by workspace owners.</small>
      </div>
      <footer>
        <button className="primary-button" type="submit">
          <Save size={16} />
          Save profile
        </button>
      </footer>
    </form>
  );
}
