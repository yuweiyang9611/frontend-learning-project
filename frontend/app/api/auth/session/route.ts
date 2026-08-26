import { authenticatedSession } from '@/src/server/auth';
import { problem } from '@/src/server/problem';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await authenticatedSession(request);
  return session
    ? Response.json(session, { headers: { 'Cache-Control': 'no-store' } })
    : problem(401, 'Authentication required', 'Sign in to continue.');
}
