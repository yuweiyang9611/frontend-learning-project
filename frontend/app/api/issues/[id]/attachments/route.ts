import { requireMutationAccess } from '@/src/server/auth';
import { addAttachment, findIssue, listAttachments } from '@/src/server/issueflow-db';
import { asErrorResponse, problem } from '@/src/server/problem';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };
const allowedTypes = new Set(['image/png', 'image/jpeg', 'application/pdf', 'text/plain']);

async function parseId(context: Context) {
  const id = Number((await context.params).id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: Request, context: Context) {
  try {
    const id = await parseId(context);
    if (!id) return problem(400, 'Invalid issue ID', 'Issue IDs must be positive integers.');
    if (!(await findIssue(id))) return problem(404, 'Issue not found', 'The requested issue could not be found.');
    return Response.json(await listAttachments(id), { headers: { 'Cache-Control': 'no-store' } });
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
    let file: FormDataEntryValue | null;
    try {
      file = (await request.formData()).get('file');
    } catch {
      return problem(400, 'Invalid upload', 'Send the file as multipart form data.');
    }
    if (!(file instanceof File)) return problem(400, 'Invalid upload', 'Choose a file to upload.');
    if (file.size > 5 * 1024 * 1024) return problem(400, 'File too large', 'Files must be 5 MB or smaller.');
    if (!allowedTypes.has(file.type))
      return problem(400, 'Unsupported file type', 'Upload a PNG, JPEG, PDF, or text file.');
    return Response.json(await addAttachment(id, file), { status: 201 });
  } catch (error) {
    return asErrorResponse(error);
  }
}
