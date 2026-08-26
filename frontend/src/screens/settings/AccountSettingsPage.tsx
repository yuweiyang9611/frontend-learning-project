'use client';

import { useState } from 'react';
import { useToast } from '@/src/app/AppProviders';

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <label className="toggle-row">
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <i aria-hidden="true">
        <b />
      </i>
    </label>
  );
}

export default function AccountSettingsPage() {
  const { toast } = useToast();
  const [assigned, setAssigned] = useState(true);
  const [mentions, setMentions] = useState(true);
  const [digest, setDigest] = useState(false);
  const exportPreferences = () => {
    const blob = new Blob([JSON.stringify({ notifications: { assigned, mentions, digest } }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'issueflow-preferences.json';
    link.click();
    URL.revokeObjectURL(url);
    toast('Export downloaded', { description: 'Your notification preferences were saved as JSON.' });
  };
  return (
    <div className="settings-form">
      <header>
        <p className="eyebrow">Inbox control</p>
        <h2>Account & notifications</h2>
        <p>Choose the moments that deserve your attention. Important changes always remain visible in activity.</p>
      </header>
      <div className="settings-group">
        <h3>Email notifications</h3>
        <Toggle
          checked={assigned}
          onChange={setAssigned}
          label="Issue assignments"
          description="When someone assigns an issue to you."
        />
        <Toggle
          checked={mentions}
          onChange={setMentions}
          label="Comments and mentions"
          description="When someone mentions you or replies to your work."
        />
        <Toggle
          checked={digest}
          onChange={setDigest}
          label="Weekly digest"
          description="A quiet Monday summary of movement across the workspace."
        />
      </div>
      <div className="danger-zone">
        <div>
          <strong>Export account data</strong>
          <p>Download a portable JSON copy of your profile preferences.</p>
        </div>
        <button className="secondary-button" type="button" onClick={exportPreferences}>
          Request export
        </button>
      </div>
    </div>
  );
}
