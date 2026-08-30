import type { FieldErrors } from '@/src/features/issues/types';

export class RequestValidationError extends Error {
  constructor(
    public readonly errors: FieldErrors,
    message = 'One or more request values are invalid.',
  ) {
    super(message);
    this.name = 'RequestValidationError';
  }
}

export function problem(status: number, title: string, detail: string, errors?: FieldErrors) {
  return Response.json(
    {
      type: 'about:blank',
      title,
      status,
      detail,
      ...(errors && Object.keys(errors).length ? { errors } : {}),
    },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/problem+json',
      },
    },
  );
}

export function asErrorResponse(error: unknown) {
  if (error instanceof RequestValidationError) {
    return problem(400, 'Validation failed', error.message, error.errors);
  }
  console.error(error);
  return problem(500, 'Unexpected server error', 'IssueFlow could not complete this request. Please try again.');
}
