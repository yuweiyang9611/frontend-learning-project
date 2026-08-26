'use client';

import { Bell, Palette, UserRound } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { PageHeader } from '@/src/components/ui';

const tabs = [
  { to: '/settings/profile', label: 'Profile', icon: UserRound },
  { to: '/settings/account', label: 'Account & notifications', icon: Bell },
  { to: '/settings/appearance', label: 'Appearance', icon: Palette },
];

export default function SettingsLayout() {
  return (
    <>
      <div className="breadcrumb">
        Workspace <b>/</b> Settings
      </div>
      <PageHeader
        eyebrow="Personal workspace"
        title="Settings"
        description="Shape IssueFlow around how you work, without changing the team’s shared data."
      />
      <div className="settings-layout">
        <nav aria-label="Settings sections">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <section className="settings-panel">
          <Outlet />
        </section>
      </div>
    </>
  );
}
