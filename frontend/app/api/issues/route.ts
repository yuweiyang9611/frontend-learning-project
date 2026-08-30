import { decodeIssueCreate } from '@/src/features/issues/runtime-contracts';
import { requireMutationAccess } from '@/src/server/auth';
import {
  duplicateTitle,
  listIssues,
  memberIdForEmail,
  normalizeIssueInput,
  parseIssueQuery,
  saveIssue,
  validateServerIssue,
} from '@/src/server/issueflow-db';
import { asErrorResponse, problem } from '@/src/server/problem';
import { readJsonBody } from '@/src/server/request-contract';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    return Response.json(await listIssues(parseIssueQuery(new URL(request.url).searchParams)), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return asErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireMutationAccess(request);
    if (actor instanceof Response) return actor;
    const body = await readJsonBody(request, decodeIssueCreate);
    if (!body.ok) return body.response;
    const input = normalizeIssueInput(body.value);
    const errors = validateServerIssue(input);
    if (Object.keys(errors).length)
      return problem(400, 'Validation failed', 'Please correct the highlighted fields.', errors);
    if (await duplicateTitle(input.title)) {
      return problem(409, 'Issue title already exists', 'An issue with this title already exists.', {
        title: ['An issue with this title already exists.'],
      });
    }
    const issue = await saveIssue(input, await memberIdForEmail(actor.email));
    return Response.json(issue, { status: 201, headers: { Location: `/api/issues/${issue.id}` } });
  } catch (error) {
    return asErrorResponse(error);
  }
}
