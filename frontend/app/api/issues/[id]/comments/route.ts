import { requireMutationAccess } from '@/src/server/auth';
import { addComment, findIssue, listComments, memberIdForEmail } from '@/src/server/issueflow-db';
import { asErrorResponse, problem } from '@/src/server/problem';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };

async function parseId(context: Context) {
  const id = Number((await context.params).id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: Request, context: Context) {
  try {
    const id = await parseId(context);
    if (!id) return problem(400, 'Invalid issue ID', 'Issue IDs must be positive integers.');
    if (!(await findIssue(id))) return problem(404, 'Issue not found', 'The requested issue could not be found.');
    return Response.json(await listComments(id), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return asErrorResponse(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const actor = await requireMutationAccess(request);
    if (actor instanceof Response) return actor;
    const id = await parseId(context);
    if (!id) return problem(400, 'Invalid issue ID', 'Issue IDs must be positive integers.');
    if (!(await findIssue(id))) return problem(404, 'Issue not found', 'The requested issue could not be found.');
    let body = '';
    try {
      const payload = (await request.json()) as { body?: unknown };
      body = typeof payload.body === 'string' ? payload.body.trim() : '';
    } catch {
      return problem(400, 'Invalid request', 'Send a JSON comment payload.');
    }
    if (!body)
      return problem(400, 'Validation failed', 'Comment cannot be empty.', { body: ['Comment cannot be empty.'] });
    if (body.length > 2_000)
      return problem(400, 'Validation failed', 'Comment is too long.', {
        body: ['Comment must be 2,000 characters or fewer.'],
      });
    return Response.json(await addComment(id, await memberIdForEmail(actor.email), body), { status: 201 });
  } catch (error) {
    return asErrorResponse(error);
  }
}
