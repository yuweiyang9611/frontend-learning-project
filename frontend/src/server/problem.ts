import type { FieldErrors } from '@/src/features/issues/types';

export function problem(status: number, title: string, detail: string, errors?: FieldErrors) {
  return Response.json(
    {
      type: 'about:blank',
      title,
      status,
      detail,
      ...(errors && Object.keys(errors).length ? { errors } : {}),
    },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}

export function asErrorResponse(error: unknown) {
  console.error(error);
  return problem(500, 'Unexpected server error', 'IssueFlow could not complete this request. Please try again.');
}
