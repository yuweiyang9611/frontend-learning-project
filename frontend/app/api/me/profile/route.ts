import { requireMutationAccess } from '@/src/server/auth';
import { currentSettings, saveProfile } from '@/src/server/settings';
import { decodeProfileInput } from '@/src/features/workspace/contracts';
import { readJsonBody } from '@/src/server/request-contract';
import { asErrorResponse } from '@/src/server/problem';
export const dynamic = 'force-dynamic';
export async function PATCH(request: Request) {
  try {
    const access = await requireMutationAccess(request);
    if (access instanceof Response) return access;
    const body = await readJsonBody(request, decodeProfileInput);
    if (!body.ok) return body.response;
    const settings = await currentSettings(request);
    if (settings instanceof Response) return settings;
    return Response.json(await saveProfile(settings, body.value.displayName), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return asErrorResponse(error);
  }
}
