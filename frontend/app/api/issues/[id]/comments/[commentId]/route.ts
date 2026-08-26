import { requireMutationAccess } from '@/src/server/auth';
import { findIssue, removeComment } from '@/src/server/issueflow-db';
import { asErrorResponse, problem } from '@/src/server/problem';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string; commentId: string }> };

export async function DELETE(request: Request, { params }: Context) {
  try {
    const actor = await requireMutationAccess(request);
    if (actor instanceof Response) return actor;
    const values = await params;
    const issueId = Number(values.id);
    const commentId = Number(values.commentId);
    if (!Number.isSafeInteger(issueId) || issueId <= 0 || !Number.isSafeInteger(commentId) || commentId <= 0) {
      return problem(400, 'Invalid ID', 'Issue and comment IDs must be positive integers.');
    }
    if (!(await findIssue(issueId))) return problem(404, 'Issue not found', 'The requested issue could not be found.');
    if (!(await removeComment(issueId, commentId)))
      return problem(404, 'Comment not found', 'The requested comment could not be found.');
    return new Response(null, { status: 204 });
  } catch (error) {
    return asErrorResponse(error);
  }
}
