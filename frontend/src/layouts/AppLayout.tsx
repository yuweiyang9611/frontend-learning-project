'use client';

import {
  Bell,
  Braces,
  ChevronDown,
  CircleDot,
  Columns3,
  Gauge,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, useTheme, useToast } from '@/src/app/AppProviders';

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: Gauge },
  { to: '/issues', label: 'Issues', icon: CircleDot },
  { to: '/board', label: 'Board', icon: Columns3 },
  { to: '/users', label: 'Team', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const learningNavigation = [{ to: '/labs/typescript', label: 'TypeScript Lab', icon: Braces }];

function Brand() {
  return (
    <div className="brand-row">
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="brand-name">IssueFlow</span>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <Brand />
      <div className="workspace-switcher">
        <span className="workspace-icon">A</span>
        <span>
          <small>Workspace</small>
          <strong>Acme Studio</strong>
        </span>
      </div>
      <nav className="primary-nav" aria-label="Primary navigation">
        <p>Workspace</p>
        {navigation.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            <Icon size={18} strokeWidth={1.9} />
            <span>{label}</span>
          </NavLink>
        ))}
        <p className="learning-nav-label">Learning</p>
        {learningNavigation.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            <Icon size={18} strokeWidth={1.9} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-note">
        <strong>Keep work moving</strong>
        <p>Search, filter, and move issues without losing context.</p>
        <i>
          <span />
        </i>
      </div>
      <p className="sidebar-version">IssueFlow · Production</p>
    </>
  );
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    const timer = window.setTimeout(() => setMobileOpen(false), 0);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', shortcut);
    return () => document.removeEventListener('keydown', shortcut);
  }, []);
  useEffect(() => {
    if (!mobileOpen) return;
    const focusTimer = window.setTimeout(() => drawerCloseRef.current?.focus(), 0);
    const handleDrawerKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        window.setTimeout(() => menuButtonRef.current?.focus(), 0);
      }
    };
    document.addEventListener('keydown', handleDrawerKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleDrawerKey);
    };
  }, [mobileOpen]);

  const closeMobile = () => {
    setMobileOpen(false);
    window.setTimeout(() => menuButtonRef.current?.focus(), 0);
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = search.trim();
    setMobileOpen(false);
    navigate(query ? `/issues?search=${encodeURIComponent(query)}` : '/issues');
  };

  const handleLogout = async () => {
    await logout();
    toast('Signed out', { description: 'Your local session has ended.', tone: 'info' });
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <SidebarContent />
      </aside>
      {mobileOpen && (
        <div
          className="mobile-drawer-backdrop"
          onMouseDown={(event) => event.target === event.currentTarget && closeMobile()}
        >
          <aside id="mobile-navigation" className="mobile-drawer" aria-label="Mobile navigation">
            <button
              className="drawer-close"
              type="button"
              onClick={closeMobile}
              aria-label="Close navigation"
              ref={drawerCloseRef}
            >
              <X size={20} />
            </button>
            <SidebarContent onNavigate={closeMobile} />
          </aside>
        </div>
      )}
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-button"
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
            >
              <Menu size={20} />
            </button>
            <span className="project-switcher">Product engineering</span>
          </div>
          <div className="topbar-actions">
            <form className="global-search" onSubmit={submitSearch}>
              <Search size={16} />
              <label className="sr-only" htmlFor="global-search">
                Search workspace
              </label>
              <input
                ref={searchRef}
                id="global-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search anything"
              />
              <kbd>⌘ K</kbd>
            </form>
            <button
              className="icon-button"
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="icon-button notification-button"
              type="button"
              aria-label="Notifications"
              onClick={() =>
                toast('You’re all caught up', { description: 'There are no unread notifications.', tone: 'info' })
              }
            >
              <Bell size={18} />
            </button>
            <details className="profile-menu">
              <summary>
                <span className="avatar dark">{session?.initials ?? 'JD'}</span>
                <span>
                  <strong>{session?.displayName ?? 'Jordan Davis'}</strong>
                  <small>{session?.role ?? 'Admin'}</small>
                </span>
                <ChevronDown size={13} />
              </summary>
              <div>
                <NavLink to="/settings/profile">Profile settings</NavLink>
                <button type="button" onClick={handleLogout}>
                  Sign out
                </button>
              </div>
            </details>
          </div>
        </header>
        <div className="content-wrap">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
