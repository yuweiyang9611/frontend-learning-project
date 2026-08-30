import { authenticatedSession } from '@/src/server/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await authenticatedSession(request);
  return session
    ? Response.json(session, { headers: { 'Cache-Control': 'no-store' } })
    : new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
