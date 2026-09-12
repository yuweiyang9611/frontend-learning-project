import { currentSettings } from '@/src/server/settings';
import { asErrorResponse } from '@/src/server/problem';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    const settings = await currentSettings(request);
    if (settings instanceof Response) return settings;
    return Response.json(
      { session: settings.session, notifications: settings.notifications },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return asErrorResponse(error);
  }
}
