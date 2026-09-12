import { authenticatedSession, isLocalRequest } from './auth';
import { getDatabase } from './issueflow-db';
import {
  defaultPreferences,
  type NotificationPreferences,
  type UserSettings,
} from '@/src/features/workspace/contracts';
import type { Session } from '@/src/features/issues/types';
import { problem } from './problem';

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

export async function currentSettings(
  request: Request,
): Promise<(UserSettings & { subject: string; memberId: number }) | Response> {
  const session = await authenticatedSession(request);
  if (!session) return problem(401, 'Authentication required', 'Sign in to manage your settings.');
  const platformId = request.headers.get('oai-authenticated-user-email')?.trim()
    ? request.headers.get('oai-authenticated-user-id')
    : null;
  const subject = platformId ? `sites:${platformId}` : isLocalRequest(request) ? 'local:demo' : '';
  if (!subject) return problem(401, 'Authentication required', 'No stable user identity.');
  const db = await getDatabase();
  let row = await db
    .prepare('SELECT * FROM user_settings WHERE subject = ?')
    .bind(subject)
    .first<{ member_id: number; display_name: string; assigned: number; mentions: number; digest: number }>();
  if (!row) {
    // Only the explicit loopback demo identity may claim the seed demo member.
    const existing = await db
      .prepare(
        'SELECT id FROM members WHERE id NOT IN (SELECT member_id FROM user_settings) AND ' +
          (subject === 'local:demo' ? 'id = 1' : 'email = ? COLLATE NOCASE'),
      )
      .bind(...(subject === 'local:demo' ? [] : [session.email]))
      .first<{ id: number }>();
    // One atomic batch prevents concurrent first visits from creating duplicate links.
    const statements = [];
    if (!existing)
      statements.push(
        db
          .prepare(
            "INSERT INTO members (display_name,email,role,initials,color) SELECT ?,?,?,?,'green' WHERE NOT EXISTS (SELECT 1 FROM user_settings WHERE subject = ?) ON CONFLICT DO NOTHING",
          )
          .bind(session.displayName, session.email, 'Developer', initials(session.displayName), subject),
      );
    statements.push(
      db
        .prepare(
          `INSERT INTO user_settings (subject, member_id, display_name) SELECT ?, id, ? FROM members WHERE ${existing ? 'id = ?' : 'email = ? COLLATE NOCASE'} AND NOT EXISTS (SELECT 1 FROM user_settings WHERE subject = ?) ON CONFLICT DO NOTHING`,
        )
        .bind(subject, session.displayName, existing?.id ?? session.email, subject),
    );
    await db.batch(statements);
    row = await db.prepare('SELECT * FROM user_settings WHERE subject = ?').bind(subject).first<typeof row>();
    if (!row) return problem(409, 'Identity already linked', 'This member is already linked to another identity.');
  }
  return {
    subject,
    memberId: row.member_id,
    session: { ...session, displayName: row.display_name, initials: initials(row.display_name) },
    notifications: { assigned: Boolean(row.assigned), mentions: Boolean(row.mentions), digest: Boolean(row.digest) },
  };
}
export async function saveProfile(
  settings: UserSettings & { subject: string; memberId: number },
  displayName: string,
): Promise<Session> {
  const db = await getDatabase();
  await db.batch([
    db.prepare('UPDATE user_settings SET display_name = ? WHERE subject = ?').bind(displayName, settings.subject),
    db
      .prepare('UPDATE members SET display_name = ?, initials = ? WHERE id = ?')
      .bind(displayName, initials(displayName), settings.memberId),
  ]);
  return { ...settings.session, displayName, initials: initials(displayName) };
}
export async function savePreferences(subject: string, prefs: NotificationPreferences) {
  const db = await getDatabase();
  await db
    .prepare('UPDATE user_settings SET assigned = ?, mentions = ?, digest = ? WHERE subject = ?')
    .bind(Number(prefs.assigned), Number(prefs.mentions), Number(prefs.digest), subject)
    .run();
  return prefs;
}
export { defaultPreferences };
