import type { Session } from '@/src/features/issues/types';
import { getDatabase } from '@/src/server/issueflow-db';
import { problem } from '@/src/server/problem';

const COOKIE_NAME = 'issueflow_local_session';
const EIGHT_HOURS = 8 * 60 * 60;

function isLoopback(request: Request) {
  const hostname = new URL(request.url).hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function decodedPlatformName(request: Request) {
  const encoded = request.headers.get('oai-authenticated-user-full-name');
  if (!encoded || request.headers.get('oai-authenticated-user-full-name-encoding') !== 'percent-encoded-utf-8')
    return null;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}

function initialsFor(displayName: string, email: string) {
  return (
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || email.slice(0, 2).toUpperCase()
  );
}

function cookieValue(request: Request) {
  const cookie = request.headers.get('cookie') ?? '';
  for (const pair of cookie.split(';')) {
    const [name, ...value] = pair.trim().split('=');
    if (name === COOKIE_NAME) return decodeURIComponent(value.join('='));
  }
  return null;
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function authenticatedSession(request: Request): Promise<Session | null> {
  const platformEmail = request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
  const platformId = request.headers.get('oai-authenticated-user-id');
  if (platformEmail && platformId) {
    const displayName = decodedPlatformName(request) ?? platformEmail;
    return { email: platformEmail, displayName, initials: initialsFor(displayName, platformEmail), role: 'Admin' };
  }
  if (!isLoopback(request)) return null;
  const token = cookieValue(request);
  if (!token) return null;
  const database = await getDatabase();
  const row = await database
    .prepare(
      `SELECT email, display_name, initials FROM local_sessions
     WHERE token_hash = ? AND expires_at > ?`,
    )
    .bind(await sha256(token), new Date().toISOString())
    .first<{ email: string; display_name: string; initials: string }>();
  return row ? { email: row.email, displayName: row.display_name, initials: row.initials, role: 'Admin' } : null;
}

export async function requireMutationAccess(request: Request): Promise<Session | Response> {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return problem(403, 'Cross-site request rejected', 'IssueFlow only accepts changes from its own origin.');
  }
  return (
    (await authenticatedSession(request)) ??
    problem(401, 'Authentication required', 'Sign in before changing IssueFlow data.')
  );
}

export async function createLocalSession(request: Request, email: string, displayName: string) {
  if (!isLoopback(request)) throw new Error('Local sessions may only be created on loopback hosts.');
  const token = crypto.randomUUID() + crypto.randomUUID();
  const initials = initialsFor(displayName, email);
  const expiresAt = new Date(Date.now() + EIGHT_HOURS * 1_000).toISOString();
  const database = await getDatabase();
  await database.prepare('DELETE FROM local_sessions WHERE expires_at <= ?').bind(new Date().toISOString()).run();
  await database
    .prepare(
      'INSERT INTO local_sessions (token_hash, email, display_name, initials, expires_at) VALUES (?, ?, ?, ?, ?)',
    )
    .bind(await sha256(token), email, displayName, initials, expiresAt)
    .run();
  return {
    session: { email, displayName, initials, role: 'Admin' } satisfies Session,
    cookie: `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${EIGHT_HOURS}`,
  };
}

export async function destroyLocalSession(request: Request) {
  const token = cookieValue(request);
  if (token && isLoopback(request)) {
    const database = await getDatabase();
    await database
      .prepare('DELETE FROM local_sessions WHERE token_hash = ?')
      .bind(await sha256(token))
      .run();
  }
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;
}

export function isLocalRequest(request: Request) {
  return isLoopback(request);
}
