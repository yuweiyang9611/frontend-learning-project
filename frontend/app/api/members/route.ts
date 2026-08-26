import { listMembers } from '@/src/server/issueflow-db';
import { asErrorResponse } from '@/src/server/problem';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return Response.json(await listMembers(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return asErrorResponse(error);
  }
}
