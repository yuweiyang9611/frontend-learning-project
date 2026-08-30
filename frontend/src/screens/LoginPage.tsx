'use client';

import { ArrowRight, Check, Eye, EyeOff, Layers3, LockKeyhole } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '@/src/api/issueflowApi';
import { useAuth } from '@/src/app/AppProviders';
import { Spinner } from '@/src/components/ui';

export default function LoginPage() {
  const { session, ready, login } = useAuth();
  const [email, setEmail] = useState('demo@issueflow.dev');
  const [password, setPassword] = useState('issueflow');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  if (ready && session) return <Navigate to="/dashboard" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setPending(true);
    try {
      await login(email, password);
      const destination = (location.state as { from?: string } | null)?.from ?? '/dashboard';
      navigate(destination, { replace: true });
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to sign in. Please try again.');
    } finally {
      setPending(false);
    }
  };

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
          <ul>
            <li>
              <Check size={16} />
              One place for issues, context, and decisions
            </li>
            <li>
              <Check size={16} />
              Fast filters, thoughtful defaults, no clutter
            </li>
            <li>
              <Check size={16} />A board that keeps the whole team in sync
            </li>
          </ul>
        </div>
        <div className="login-visual" aria-hidden="true">
          <div className="visual-card one">
            <span>Open</span>
            <b>Refresh session flow</b>
            <i />
          </div>
          <div className="visual-card two">
            <span>In progress</span>
            <b>Keyboard navigation</b>
            <i />
          </div>
          <div className="visual-card three">
            <span>Resolved</span>
            <b>Shared issue filters</b>
            <i />
          </div>
        </div>
        <p className="login-footnote">IssueFlow learning project · React + TypeScript</p>
      </section>
      <section className="login-form-wrap">
        <form className="login-form" onSubmit={submit} aria-busy={!ready || pending}>
          <div className="login-form-icon">
            <Layers3 size={22} />
          </div>
          <p className="eyebrow">Welcome back</p>
          <h2>Sign in to your workspace</h2>
          <p className="form-intro">
            Use the demo credentials below when running locally. The hosted app uses your authenticated workspace
            identity.
          </p>
          {error && (
            <div className="form-banner error" role="alert">
              {error}
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <LockKeyhole size={16} aria-hidden="true" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                minLength={6}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button className="primary-button login-submit" type="submit" disabled={!ready || pending}>
            {pending ? (
              <Spinner label="Signing in" />
            ) : (
              <>
                <span>Continue to IssueFlow</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
          <p className="demo-note">
            <strong>Demo:</strong> demo@issueflow.dev · issueflow
          </p>
        </form>
      </section>
    </main>
  );
}
