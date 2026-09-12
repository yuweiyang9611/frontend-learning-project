import { authenticatedSession } from '@/src/server/auth';
import { currentSettings } from '@/src/server/settings';
import { asErrorResponse } from '@/src/server/problem';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await authenticatedSession(request);
    if (session) {
      const settings = await currentSettings(request);
      if (settings instanceof Response) return settings;
      return Response.json(settings.session, { headers: { 'Cache-Control': 'no-store' } });
    }
    return session
      ? Response.json(session, { headers: { 'Cache-Control': 'no-store' } })
      : new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return asErrorResponse(error);
  }
}
