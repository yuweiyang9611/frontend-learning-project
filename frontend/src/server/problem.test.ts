import { describe, expect, it, vi } from 'vitest';
import { asErrorResponse, problem, RequestValidationError } from './problem';

describe('Problem Details responses', () => {
  it('serializes validation fields and disables caching', async () => {
    const response = problem(422, 'Invalid issue', 'Correct the fields.', { title: ['Required'] });
    expect(response.status).toBe(422);
    expect(response.headers.get('content-type')).toContain('application/problem+json');
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.json()).resolves.toMatchObject({
      type: 'about:blank',
      title: 'Invalid issue',
      status: 422,
      detail: 'Correct the fields.',
      errors: { title: ['Required'] },
    });
  });

  it('maps request validation failures to 400 without logging them', async () => {
    const error = new RequestValidationError({ dueDate: ['Use a real calendar date.'] }, 'Invalid date.');
    expect(error.name).toBe('RequestValidationError');
    const response = asErrorResponse(error);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      title: 'Validation failed',
      detail: 'Invalid date.',
      errors: { dueDate: ['Use a real calendar date.'] },
    });
  });

  it('logs unexpected failures and returns a body without internal details', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const response = asErrorResponse(new Error('database password leaked here'));
    expect(response.status).toBe(500);
    expect(consoleError).toHaveBeenCalledOnce();
    const body = await response.text();
    expect(body).toContain('Unexpected server error');
    expect(body).not.toContain('database password');
  });
});
