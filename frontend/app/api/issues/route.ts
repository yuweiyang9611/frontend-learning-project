import type { IssueInput } from '@/src/features/issues/types';
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
    let body: Partial<IssueInput>;
    try {
      body = (await request.json()) as Partial<IssueInput>;
    } catch {
      return problem(400, 'Invalid request', 'Send a JSON issue payload.');
    }
    const input = normalizeIssueInput(body);
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
