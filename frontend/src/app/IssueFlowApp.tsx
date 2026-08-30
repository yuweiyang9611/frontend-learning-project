'use client';

import { lazy, Suspense, useSyncExternalStore, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppProviders, useAuth } from './AppProviders';
import { PageLoading } from '@/src/components/ui';
import AppLayout from '@/src/layouts/AppLayout';
import LoginPage from '@/src/screens/LoginPage';

const DashboardPage = lazy(() => import('@/src/screens/DashboardPage'));
const IssuesPage = lazy(() => import('@/src/screens/IssuesPage'));
const IssueDetailPage = lazy(() => import('@/src/screens/IssueDetailPage'));
const IssueFormPage = lazy(() => import('@/src/screens/IssueFormPage'));
const BoardPage = lazy(() => import('@/src/screens/BoardPage'));
const UsersPage = lazy(() => import('@/src/screens/UsersPage'));
const TypeScriptLabPage = lazy(() => import('@/src/screens/TypeScriptLabPage'));
const SettingsLayout = lazy(() => import('@/src/screens/settings/SettingsLayout'));
const ProfileSettingsPage = lazy(() => import('@/src/screens/settings/ProfileSettingsPage'));
const AccountSettingsPage = lazy(() => import('@/src/screens/settings/AccountSettingsPage'));
const AppearanceSettingsPage = lazy(() => import('@/src/screens/settings/AppearanceSettingsPage'));
const NotFoundPage = lazy(() => import('@/src/screens/NotFoundPage'));

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <PageLoading />;
  if (!session) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  return children;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/issues" element={<IssuesPage />} />
          <Route path="/issues/new" element={<IssueFormPage />} />
          <Route path="/issues/:id" element={<IssueDetailPage />} />
          <Route path="/issues/:id/edit" element={<IssueFormPage />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/labs/typescript" element={<TypeScriptLabPage />} />
          <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<ProfileSettingsPage />} />
            <Route path="account" element={<AccountSettingsPage />} />
            <Route path="appearance" element={<AppearanceSettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

function LoginPreview() {
  return (
    <main className="login-page">
      <section className="login-story" aria-label="IssueFlow introduction">
        <div className="brand-row">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="brand-name">IssueFlow</span>
        </div>
        <div className="login-story-copy">
          <p className="eyebrow">Built for focused teams</p>
          <h1>
            Clarity for every issue.
            <br />
            Momentum for every team.
          </h1>
          <p>Turn scattered requests into a calm, visible flow of work—from first report to final resolution.</p>
        </div>
      </section>
      <section className="login-form-wrap">
        <div className="login-form" role="status" aria-label="Preparing sign in">
          <p className="eyebrow">Welcome back</p>
          <h2>Sign in to your workspace</h2>
          <p className="form-intro">Preparing the secure local sign-in form…</p>
        </div>
      </section>
    </main>
  );
}

export default function IssueFlowApp({ initialPath = '/' }: { initialPath?: string }) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  if (!mounted) {
    if (initialPath === '/login') return <LoginPreview />;
    return (
      <div className="app-boot">
        <span className="brand-mark" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <strong>IssueFlow</strong>
        <small>Preparing your workspace…</small>
      </div>
    );
  }
  return (
    <BrowserRouter>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </BrowserRouter>
  );
}
