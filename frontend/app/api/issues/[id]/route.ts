import { decodeIssueUpdate } from '@/src/features/issues/runtime-contracts';
import { requireMutationAccess } from '@/src/server/auth';
import {
  deleteIssue,
  duplicateTitle,
  findIssue,
  normalizeIssueInput,
  updateIssue,
  validateServerIssue,
} from '@/src/server/issueflow-db';
import { asErrorResponse, problem } from '@/src/server/problem';
import { readJsonBody } from '@/src/server/request-contract';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };

async function issueId(context: Context) {
  const id = Number((await context.params).id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: Request, context: Context) {
  try {
    const id = await issueId(context);
    if (!id) return problem(400, 'Invalid issue ID', 'Issue IDs must be positive integers.');
    const issue = await findIssue(id);
    return issue
      ? Response.json(issue, { headers: { 'Cache-Control': 'no-store' } })
      : problem(404, 'Issue not found', 'The requested issue could not be found.');
  } catch (error) {
    return asErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const actor = await requireMutationAccess(request);
    if (actor instanceof Response) return actor;
    const id = await issueId(context);
    if (!id) return problem(400, 'Invalid issue ID', 'Issue IDs must be positive integers.');
    const current = await findIssue(id);
    if (!current) return problem(404, 'Issue not found', 'The requested issue could not be found.');
    const body = await readJsonBody(request, decodeIssueUpdate);
    if (!body.ok) return body.response;
    const update = body.value;
    const input = normalizeIssueInput(update, current);
    const errors = validateServerIssue(input);
    if (Object.keys(errors).length)
      return problem(400, 'Validation failed', 'Please correct the highlighted fields.', errors);
    if (await duplicateTitle(input.title, id)) {
      return problem(409, 'Issue title already exists', 'An issue with this title already exists.', {
        title: ['An issue with this title already exists.'],
      });
    }
    return Response.json(await updateIssue(id, update, current));
  } catch (error) {
    return asErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const actor = await requireMutationAccess(request);
    if (actor instanceof Response) return actor;
    const id = await issueId(context);
    if (!id) return problem(400, 'Invalid issue ID', 'Issue IDs must be positive integers.');
    if (!(await findIssue(id))) return problem(404, 'Issue not found', 'The requested issue could not be found.');
    await deleteIssue(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return asErrorResponse(error);
  }
}
