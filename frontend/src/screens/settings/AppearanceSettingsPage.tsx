'use client';

import { Laptop, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from '@/src/app/AppProviders';

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [density, setDensity] = useState(() => localStorage.getItem('issueflow-density') ?? 'comfortable');
  useEffect(() => {
    document.documentElement.dataset.density = density;
  }, [density]);
  const changeDensity = (value: string) => {
    setDensity(value);
    localStorage.setItem('issueflow-density', value);
    document.documentElement.dataset.density = value;
  };
  return (
    <div className="settings-form">
      <header>
        <p className="eyebrow">Make it yours</p>
        <h2>Appearance</h2>
        <p>Choose a theme and information density that keeps the work comfortable to scan.</p>
      </header>
      <fieldset className="theme-options">
        <legend>Color theme</legend>
        {(
          [
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
            { value: 'system', label: 'System', icon: Laptop },
          ] as const
        ).map(({ value, label, icon: Icon }) => (
          <label className={theme === value ? 'active' : ''} key={value}>
            <input type="radio" name="theme" value={value} checked={theme === value} onChange={() => setTheme(value)} />
            <span className={`theme-preview ${value}`}>
              <i />
              <b />
              <em />
            </span>
            <strong>
              <Icon size={15} />
              {label}
            </strong>
            <small>{value === 'system' ? 'Follow this device' : `${label} all the time`}</small>
          </label>
        ))}
      </fieldset>
      <fieldset className="density-options">
        <legend>Issue list density</legend>
        <label>
          <input
            type="radio"
            name="density"
            value="comfortable"
            checked={density === 'comfortable'}
            onChange={() => changeDensity('comfortable')}
          />
          <span>
            <strong>Comfortable</strong>
            <small>More breathing room and description previews.</small>
          </span>
        </label>
        <label>
          <input
            type="radio"
            name="density"
            value="compact"
            checked={density === 'compact'}
            onChange={() => changeDensity('compact')}
          />
          <span>
            <strong>Compact</strong>
            <small>More issues visible at once.</small>
          </span>
        </label>
      </fieldset>
    </div>
  );
}
