import { getDatabase } from '@/src/server/issueflow-db';
import { asErrorResponse } from '@/src/server/problem';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const database = await getDatabase();
    await database.prepare('SELECT 1').first();
    return Response.json({ status: 'healthy', service: 'IssueFlow Sites API' });
  } catch (error) {
    return asErrorResponse(error);
  }
}
