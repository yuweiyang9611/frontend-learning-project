import { requireMutationAccess } from '@/src/server/auth';
import { currentSettings, savePreferences } from '@/src/server/settings';
import { decodePreferences } from '@/src/features/workspace/contracts';
import { readJsonBody } from '@/src/server/request-contract';
import { asErrorResponse } from '@/src/server/problem';
export const dynamic = 'force-dynamic';
export async function PUT(request: Request) {
  try {
    const access = await requireMutationAccess(request);
    if (access instanceof Response) return access;
    const body = await readJsonBody(request, decodePreferences);
    if (!body.ok) return body.response;
    const settings = await currentSettings(request);
    if (settings instanceof Response) return settings;
    return Response.json(await savePreferences(settings.subject, body.value), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return asErrorResponse(error);
  }
}
