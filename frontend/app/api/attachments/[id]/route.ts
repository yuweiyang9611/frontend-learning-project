import { authenticatedSession } from '@/src/server/auth';
import { findAttachment, runtimeEnv } from '@/src/server/issueflow-db';
import { asErrorResponse, problem } from '@/src/server/problem';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    if (!(await authenticatedSession(request)))
      return problem(401, 'Authentication required', 'Sign in before downloading attachments.');
    const id = Number((await params).id);
    if (!Number.isSafeInteger(id) || id <= 0)
      return problem(400, 'Invalid attachment ID', 'Attachment IDs must be positive integers.');
    const attachment = await findAttachment(id);
    if (!attachment?.object_key)
      return problem(404, 'Attachment not found', 'The requested attachment file could not be found.');
    const object = await runtimeEnv().UPLOADS?.get(attachment.object_key);
    if (!object) return problem(404, 'Attachment not found', 'The requested attachment file could not be found.');
    return new Response(object.body, {
      headers: {
        'Content-Type': attachment.content_type,
        'Content-Length': String(attachment.size),
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(attachment.original_file_name)}`,
        'Cache-Control': 'private, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return asErrorResponse(error);
  }
}
